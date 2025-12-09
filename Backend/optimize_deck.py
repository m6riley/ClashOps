import json
import logging
import asyncio
import azure.functions as func
from azure.functions import Blueprint
from shared.tables import update_report_field, _reports, PARTITION_KEY
from shared.pinecone_utils import query_vectors
from shared.rag_utils import card_to_namespace
from shared.openai_utils import run_chat
from shared.prompts import optimize_prompt
from shared.langchain_utils import build_chain



optimize_deck_bp = Blueprint()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def get_existing_optimize(deck: str):
    try:
        entity = _reports.get_entity(PARTITION_KEY, deck)
        return entity.get("Optimize")
    except Exception:
        return None


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

    # Check existing table state
    existing_value = get_existing_optimize(deck)
    if existing_value is None:
        return func.HttpResponse("Report not found", status_code=404)

    # Someone else is optimizing — wait for it to finish
    if existing_value == "loading":
        logging.info(f"Optimization already running for deck '{deck}'. Waiting...")

        # Poll every 1 second until the value is no longer 'loading'
        for _ in range(300):  # wait up to 5 minutes (adjust as needed)
            await asyncio.sleep(1)
            updated = get_existing_optimize(deck)

            # If still loading → continue waiting
            if updated == "loading":
                continue

            # If finished and now contains the optimized result → return it
            if updated not in ("loading", "no", None):
                return func.HttpResponse(
                    json.dumps({"category": "optimize", "content": updated}),
                    mimetype="application/json",
                    status_code=200,
                )

        # Timeout safeguard
        return func.HttpResponse("Timeout waiting for optimization", status_code=504)


    # Fresh optimization required
    if existing_value == "no":
        update_report_field(deck=deck, field="Optimize", value="loading")

        user_prompt = build_user_prompt(body)

        # Build chain
        chain = build_chain()
        
        tower_types = ["tower_princess", "cannoneer", "dagger_duchess", "royal_chef"]
        evolution_namespaces = [
            card_to_namespace(card.strip())
            for card in deck.split(",")
        ]

        # Build retrievers list for chain.invoke()
        retrievers = []

        # Tower retrievers
        for tower_type in tower_types:
            retrievers.append({
                "k": 5,
                "namespace": "tower_troops",
                "filter": {"troop": tower_type}
            })

        # Evolution retrievers
        for ns in evolution_namespaces:
            retrievers.append({
                "k": 5,
                "namespace": ns
            })

        # Invoke chain
        results = chain.invoke(
            {
                "system_instructions": optimize_prompt,
                "user_input": user_prompt,
                "retrievers": retrievers
            }
        )

        # Store result
        update_report_field(deck=deck, field="Optimize", value=results) 

        return func.HttpResponse(
            json.dumps({"category": "optimize", "content": results}),
            mimetype="application/json",
            status_code=200,
        )

    # Optimization exists (cached result)
    return func.HttpResponse(
        json.dumps({"category": "optimize", "content": existing_value}),
        mimetype="application/json",
        status_code=200,
    )