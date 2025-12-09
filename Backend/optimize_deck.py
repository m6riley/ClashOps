import json
import logging
import asyncio
import azure.functions as func
from azure.functions import Blueprint

from shared.tables import get_report_by_deck, update_report_field
from shared.pinecone_utils import query_vectors
from shared.rag_utils import card_to_namespace
from shared.prompts import optimize_prompt
from shared.langchain_utils import build_chain


optimize_deck_bp = Blueprint()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def wait_for_optimize(resolved_rowkey: str, timeout: int = 300, interval: int = 1):
    """
    Poll the table for Optimize until it is no longer 'loading'.
    Returns the final value or None on timeout.
    """
    from shared.tables import _reports

    for _ in range(timeout):
        await asyncio.sleep(interval)

        try:
            entity = _reports.get_entity(resolved_rowkey)
        except Exception:
            continue

        val = entity.get("Optimize")

        if val == "loading":
            continue

        if val not in ("loading", "no", None):
            return val

    return None  # timeout exceeded


def build_user_prompt(body: dict):
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


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------
@optimize_deck_bp.route(route="optimize_deck", auth_level=func.AuthLevel.FUNCTION)
async def optimize_deck(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Deck optimization request received")

    # Parse JSON
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse("Invalid JSON", status_code=400)

    deck = body.get("deckToAnalyze")
    if not deck:
        return func.HttpResponse("Missing 'deckToAnalyze'", status_code=400)

    # ---------------------------------------------------------
    # Resolve correct row key via canonical deck matching
    # ---------------------------------------------------------
    report, resolved_rowkey = get_report_by_deck(deck)

    if not report:
        return func.HttpResponse("Report not found", status_code=404)

    existing_value = report.get("Optimize")

    # ---------------------------------------------------------
    # CASE 1 — Optimization already running → wait for it
    # ---------------------------------------------------------
    if existing_value == "loading":
        logging.info(f"Optimization already running for deck '{resolved_rowkey}'. Waiting...")

        finished = await wait_for_optimize(resolved_rowkey)

        if finished is None:
            return func.HttpResponse("Timeout waiting for optimization", status_code=504)

        return func.HttpResponse(
            json.dumps({"category": "optimize", "content": finished}),
            mimetype="application/json",
            status_code=200,
        )

    # ---------------------------------------------------------
    # CASE 2 — No optimization yet → perform now
    # ---------------------------------------------------------
    if existing_value == "no":
        update_report_field(resolved_rowkey, "Optimize", "loading")

        user_prompt = build_user_prompt(body)
        chain = build_chain()

        # Tower troops namespaces
        tower_types = ["tower_princess", "cannoneer", "dagger_duchess", "royal_chef"]

        # Evolution namespaces
        evolution_namespaces = [
            card_to_namespace(card.strip())
            for card in deck.split(",")
        ]

        # Build retriever list
        retrievers = []

        for tower in tower_types:
            retrievers.append({
                "k": 5,
                "namespace": "tower_troops",
                "filter": {"troop": tower}
            })

        for ns in evolution_namespaces:
            retrievers.append({
                "k": 5,
                "namespace": ns
            })

        # Invoke chain
        results = chain.invoke({
            "system_instructions": optimize_prompt,
            "user_input": user_prompt,
            "retrievers": retrievers
        })

        # Store result
        update_report_field(resolved_rowkey, "Optimize", results)

        return func.HttpResponse(
            json.dumps({"category": "optimize", "content": results}),
            mimetype="application/json",
            status_code=200,
        )

    # ---------------------------------------------------------
    # CASE 3 — Already optimized → return cached value
    # ---------------------------------------------------------
    return func.HttpResponse(
        json.dumps({"category": "optimize", "content": existing_value}),
        mimetype="application/json",
        status_code=200,
    )
