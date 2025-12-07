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

    if existing_value == "loading":
        return func.HttpResponse("Optimizations already being processed", status_code=409)

    # Fresh optimization required
    if existing_value == "no":
        update_report_field(deck=deck, field="Optimize", value="loading")

        user_prompt = build_user_prompt(body)
        
        tower_types = ["tower_princess", "cannoneer", "dagger_duchess", "royal_chef"]    
        evolution_namespaces = [
            card_to_namespace(card.strip())
            for card in deck.split(",")
        ]

        tower_tasks = [
            query_vectors(query=user_prompt, top_k=5, namespace="tower_troops", metadata_filter= {
                "troop": tower_type
            })
            for tower_type in tower_types
        ]
        evolution_tasks = [
            query_vectors(query=user_prompt, top_k=5, namespace=ns)
            for ns in evolution_namespaces
        ]

        results = await asyncio.gather(*tower_tasks, *evolution_tasks)

        tower_results = results[:len(tower_tasks)]
        evolution_results = results[len(tower_tasks):]


        tower_context = [
            {
                "Tower Troop Name": m.metadata["troop"],
                "Fact": m.metadata["text"]
            }
            for matches in tower_results
            for m in matches
            ]

        evolution_context = [
            {
                "Evolution Name": m.metadata["troop"],
                "Fact": m.metadata["text"]
            }
            for matches in evolution_results
            for m in matches
            ]

        # Build final system message
        system_message = (
            "## SYSTEM INSTRUCTIONS ##\n"
            + optimize_prompt
            + "\n## TOWER TROOP CONTEXT ##\n"
            + json.dumps(tower_context, indent=2)
            + "\n## EVOLUTION CONTEXT ##\n"
            + json.dumps(evolution_context, indent=2)
        )

        # OpenAI optimization call
        content = await run_chat(model="gpt-5", system=system_message, user=user_prompt)

        # Store result
        update_report_field(deck=deck, field="Optimize", value=content) 

        return func.HttpResponse(
            json.dumps({"category": "optimize", "content": content}),
            mimetype="application/json",
            status_code=200,
        )

    # Optimization exists (cached result)
    return func.HttpResponse(
        json.dumps({"category": "optimize", "content": existing_value}),
        mimetype="application/json",
        status_code=200,
    )