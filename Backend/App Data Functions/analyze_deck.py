"""
Azure Function for analyzing Clash Royale decks.

This function handles HTTP requests to analyze deck categories (Offense, Defense,
Synergy, Versatility) using LangChain and OpenAI. It supports caching, concurrent
request handling, and polling for long-running analyses.
"""
import json
import logging
import asyncio
import azure.functions as func
from azure.functions import Blueprint
from typing import Optional

from shared.table_utils import get_report_by_deck, update_report_field
from shared.prompts import (
    offense_prompt,
    defense_prompt,
    synergy_prompt,
    versatility_prompt
)
from shared.langchain_utils import build_chain
from shared.rag_utils import card_to_namespace

# Azure Functions Blueprint
analyze_deck_bp = Blueprint()

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------

# Category configuration mapping category keys to their table fields, prompts, and models
CATEGORY_CONFIG = {
    "offense": {
        "field": "Offense",
        "prompt": offense_prompt,
        "model": "gpt-5.1"
    },
    "defense": {
        "field": "Defense",
        "prompt": defense_prompt,
        "model": "gpt-5.1"
    },
    "synergy": {
        "field": "Synergy",
        "prompt": synergy_prompt,
        "model": "gpt-5"
    },
    "versatility": {
        "field": "Versatility",
        "prompt": versatility_prompt,
        "model": "gpt-5"
    },
}

# Polling configuration
_DEFAULT_TIMEOUT_SECONDS = 120
_DEFAULT_POLL_INTERVAL_SECONDS = 1
_RETRIEVER_TOP_K = 5


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

async def wait_for_analysis(
    resolved_rowkey: str,
    field: str,
    timeout: int = _DEFAULT_TIMEOUT_SECONDS,
    interval: int = _DEFAULT_POLL_INTERVAL_SECONDS
) -> Optional[str]:
    """
    Poll the table until the analysis field is no longer 'loading'.
    
    Continuously checks the report table for the specified field until it
    contains a completed analysis result or the timeout is reached.
    
    Args:
        resolved_rowkey: The RowKey of the report entity
        field: The field name to poll (e.g., "Offense", "Defense")
        timeout: Maximum number of seconds to wait (default: 120)
        interval: Seconds between polling attempts (default: 1)
    
    Returns:
        The completed analysis result as a string, or None if timeout
    """
    # Local import to avoid circular dependency
    from shared.table_utils import _reports, PARTITION_KEY

    for _ in range(timeout):
        await asyncio.sleep(interval)

        try:
            entity = _reports.get_entity(
                partition_key=PARTITION_KEY,
                row_key=resolved_rowkey
            )
        except Exception:
            continue

        updated = entity.get(field)

        if updated == "loading":
            continue

        if updated not in ("loading", "no", None):
            return updated

    return None  # timeout expired


def perform_analysis(deck: str, category_key: str) -> str:
    """
    Run model inference for a deck category and update the report record.
    
    Resolves the deck's canonical form, marks the field as loading, invokes
    the LangChain model with the appropriate prompt, and stores the result.
    
    Args:
        deck: Deck string to analyze
        category_key: Category key from CATEGORY_CONFIG (e.g., "offense")
    
    Returns:
        The analysis result as a JSON string
    
    Raises:
        ValueError: If the report is not found for the deck
    """
    if category_key not in CATEGORY_CONFIG:
        raise ValueError(f"Invalid category key: {category_key}")

    cfg = CATEGORY_CONFIG[category_key]
    field = cfg["field"]
    prompt = cfg["prompt"]

    # Resolve the actual RowKey in table (canonical match)
    report, resolved_rowkey = get_report_by_deck(deck)

    if not report:
        raise ValueError("Report not found for this deck")

    # Mark as loading
    update_report_field(resolved_rowkey, field, "loading")

    retrievers = []
    card_namespaces = [
        card_to_namespace(card.strip())
        for card in deck.replace("[", "").replace("]", "").split(",")
    ]
    for ns in card_namespaces:
        retrievers.append({
            "k": _RETRIEVER_TOP_K,
            "metadata": {
                "namespace": ns
            }
        })
        
    logging.info(f"Retrievers: {retrievers}")


    # Build and run the LangChain model
    chain = build_chain()
    results = chain.invoke({
        "system_instructions": prompt,
        "user_input": deck,
        "retrievers": retrievers
    })

    logging.info(f"Model response received for {category_key} analysis")

    # Store result
    update_report_field(resolved_rowkey, field, results)

    return results


# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@analyze_deck_bp.route(route="analyze_deck", auth_level=func.AuthLevel.FUNCTION)
async def analyze_deck(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for deck category analysis.
    
    Handles three cases:
    1. Analysis already running: Polls until completion
    2. No analysis yet: Performs analysis synchronously
    3. Already analyzed: Returns cached result
    
    Request body should contain:
        - deckToAnalyze: Deck string to analyze
        - category: Category key ("offense", "defense", "synergy", "versatility")
    
    Returns:
        HTTP response with JSON containing category and content
    """
    logging.info("Deck analysis request received")

    # Parse and validate request body
    try:
        body = req.get_json()
    except ValueError as e:
        logging.error(f"Invalid JSON in request: {e}")
        return func.HttpResponse(
            "Invalid JSON",
            status_code=400,
            mimetype="text/plain"
        )

    deck = body.get("deckToAnalyze")
    category = body.get("category")

    if not deck or not category:
        logging.warning("Missing required fields in request")
        return func.HttpResponse(
            "Missing 'deckToAnalyze' or 'category'",
            status_code=400,
            mimetype="text/plain"
        )

    if category not in CATEGORY_CONFIG:
        logging.warning(f"Invalid category requested: {category}")
        return func.HttpResponse(
            "Invalid category",
            status_code=400,
            mimetype="text/plain"
        )

    cfg = CATEGORY_CONFIG[category]
    field = cfg["field"]

    # Resolve correct report row (canonical detection)
    report, resolved_rowkey = get_report_by_deck(deck)
    if not report:
        logging.warning(f"Report not found for deck: {deck}")
        return func.HttpResponse(
            "Report not found",
            status_code=404,
            mimetype="text/plain"
        )

    current_value = report.get(field)

    # Case 1: Analysis already running → wait for it
    if current_value == "loading":
        logging.info(
            f"Analysis already running for deck '{resolved_rowkey}', "
            f"category '{category}'. Waiting..."
        )

        finished = await wait_for_analysis(resolved_rowkey, field)
        if finished is None:
            logging.error(f"Timeout waiting for analysis: {resolved_rowkey}, {field}")
            return func.HttpResponse(
                "Timeout waiting for analysis",
                status_code=504,
                mimetype="text/plain"
            )

        return func.HttpResponse(
            json.dumps({"category": category, "content": finished}),
            mimetype="application/json",
            status_code=200,
        )

    # Case 2: No analysis yet → perform now
    if current_value == "no":
        try:
            content = perform_analysis(deck, category)
            return func.HttpResponse(
                json.dumps({"category": category, "content": content}),
                mimetype="application/json",
                status_code=200,
            )
        except ValueError as e:
            logging.error(f"Error performing analysis: {e}")
            return func.HttpResponse(
                str(e),
                status_code=404,
                mimetype="text/plain"
            )
        except Exception as e:
            logging.error(f"Unexpected error during analysis: {e}")
            return func.HttpResponse(
                "Internal server error",
                status_code=500,
                mimetype="text/plain"
            )

    # Case 3: Already analyzed → return cached value
    return func.HttpResponse(
        json.dumps({"category": category, "content": current_value}),
        mimetype="application/json",
        status_code=200,
    )
