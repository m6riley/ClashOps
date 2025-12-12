"""
Azure Function for optimizing Clash Royale decks.

This function handles HTTP requests to optimize decks using LangChain with RAG
retrieval from Pinecone. It uses deck analysis scores and summaries to generate
optimization recommendations including card swaps, tower troops, and evolutions.
"""
import json
import logging
import asyncio
import azure.functions as func
from azure.functions import Blueprint
from typing import Optional

from shared.table_utils import get_report_by_deck, update_report_field
from shared.rag_utils import card_to_namespace
from shared.prompts import optimize_prompt
from shared.langchain_utils import build_chain

# Azure Functions Blueprint
optimize_deck_bp = Blueprint()

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------

# Polling configuration for optimization (longer timeout due to RAG retrieval)
_DEFAULT_TIMEOUT_SECONDS = 300
_DEFAULT_POLL_INTERVAL_SECONDS = 1

# Tower troop types for RAG retrieval
_TOWER_TROOP_NAMESPACES = [
    "tower_princess",
    "cannoneer",
    "dagger_duchess",
    "royal_chef"
]

# RAG retrieval configuration
_RETRIEVER_TOP_K = 5


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

async def wait_for_optimize(
    resolved_rowkey: str,
    timeout: int = _DEFAULT_TIMEOUT_SECONDS,
    interval: int = _DEFAULT_POLL_INTERVAL_SECONDS
) -> Optional[str]:
    """
    Poll the table for Optimize field until it is no longer 'loading'.
    
    Continuously checks the report table for the Optimize field until it
    contains a completed optimization result or the timeout is reached.
    
    Args:
        resolved_rowkey: The RowKey of the report entity
        timeout: Maximum number of seconds to wait (default: 300)
        interval: Seconds between polling attempts (default: 1)
    
    Returns:
        The completed optimization result as a string, or None if timeout
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

        val = entity.get("Optimize")

        if val == "loading":
            continue

        if val not in ("loading", "no", None):
            return val

    return None  # timeout exceeded


def build_user_prompt(body: dict) -> str:
    """
    Build a JSON-formatted user prompt from request body data.
    
    Extracts deck analysis scores and summaries from the request body
    and formats them as a JSON string for the optimization prompt.
    
    Args:
        body: Request body dictionary containing analysis data
    
    Returns:
        JSON string containing deck analysis information
    """
    return json.dumps({
        "Deck Analyzed": body.get("deckToAnalyze"),
        "Offense Score": body.get("offenseScore"),
        "Offense Summary": body.get("offenseSummary"),
        "Defense Score": body.get("defenseScore"),
        "Defense Summary": body.get("defenseSummary"),
        "Synergy Score": body.get("synergyScore"),
        "Synergy Summary": body.get("synergySummary"),
        "Versatility Score": body.get("versatilityScore"),
        "Versatility Summary": body.get("versatilitySummary"),
    })


def build_retrievers(deck: str) -> list[dict]:
    """
    Build a list of retriever configurations for RAG retrieval.
    
    Creates retriever configs for:
    - Tower troops (all types)
    - Evolution namespaces (one per card in deck)
    
    Args:
        deck: Deck string with comma-separated card names
    
    Returns:
        List of retriever configuration dictionaries
    """
    retrievers = []

    # Add tower troop retrievers
    for ns in _TOWER_TROOP_NAMESPACES:
        retrievers.append({
            "k": _RETRIEVER_TOP_K,
            "metadata": {
                "namespace": ns
            }
        })

    # Add evolution namespace retrievers
    evolution_namespaces = [
        "evolution_" + card_to_namespace(card.strip())
        for card in deck.replace("[", "").replace("]", "").split(",")
    ]

    for ns in evolution_namespaces:
        retrievers.append({
            "k": _RETRIEVER_TOP_K,
            "metadata": {
                "namespace": ns
            }
        })

    return retrievers


# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@optimize_deck_bp.route(route="optimize_deck", auth_level=func.AuthLevel.FUNCTION)
async def optimize_deck(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for deck optimization.
    
    Handles three cases:
    1. Optimization already running: Polls until completion
    2. No optimization yet: Performs optimization with RAG retrieval
    3. Already optimized: Returns cached result
    
    Request body should contain:
        - deckToAnalyze: Deck string to optimize
        - offenseScore, offenseSummary: Offense analysis data
        - defenseScore, defenseSummary: Defense analysis data
        - synergyScore, synergySummary: Synergy analysis data
        - versatilityScore, versatilitySummary: Versatility analysis data
    
    Returns:
        HTTP response with JSON containing category "optimize" and content
    """
    logging.info("Deck optimization request received")

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
    if not deck:
        logging.warning("Missing 'deckToAnalyze' in request")
        return func.HttpResponse(
            "Missing 'deckToAnalyze'",
            status_code=400,
            mimetype="text/plain"
        )

    # Resolve correct row key via canonical deck matching
    report, resolved_rowkey = get_report_by_deck(deck)

    if not report:
        logging.warning(f"Report not found for deck: {deck}")
        return func.HttpResponse(
            "Report not found",
            status_code=404,
            mimetype="text/plain"
        )

    existing_value = report.get("Optimize")

    # Case 1: Optimization already running → wait for it
    if existing_value == "loading":
        logging.info(
            f"Optimization already running for deck '{resolved_rowkey}'. Waiting..."
        )

        finished = await wait_for_optimize(resolved_rowkey)

        if finished is None:
            logging.error(f"Timeout waiting for optimization: {resolved_rowkey}")
            return func.HttpResponse(
                "Timeout waiting for optimization",
                status_code=504,
                mimetype="text/plain"
            )

        return func.HttpResponse(
            json.dumps({"category": "optimize", "content": finished}),
            mimetype="application/json",
            status_code=200,
        )

    # Case 2: No optimization yet → perform now
    if existing_value == "no":
        try:
            update_report_field(resolved_rowkey, "Optimize", "loading")

            user_prompt = build_user_prompt(body)
            chain = build_chain()
            retrievers = build_retrievers(deck)

            # Invoke chain with RAG retrieval
            results = chain.invoke({
                "system_instructions": optimize_prompt,
                "user_input": user_prompt,
                "retrievers": retrievers
            })

            logging.info(f"Optimization completed for deck: {resolved_rowkey}")

            # Store result
            update_report_field(resolved_rowkey, "Optimize", results)

            return func.HttpResponse(
                json.dumps({"category": "optimize", "content": results}),
                mimetype="application/json",
                status_code=200,
            )
        except Exception as e:
            logging.error(f"Error during optimization: {e}")
            # Reset loading state on error
            update_report_field(resolved_rowkey, "Optimize", "no")
            return func.HttpResponse(
                "Internal server error",
                status_code=500,
                mimetype="text/plain"
            )

    # Case 3: Already optimized → return cached value
    return func.HttpResponse(
        json.dumps({"category": "optimize", "content": existing_value}),
        mimetype="application/json",
        status_code=200,
    )
