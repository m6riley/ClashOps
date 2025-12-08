import json
import logging
import asyncio
import azure.functions as func
from azure.functions import Blueprint
from shared.tables import get_report, update_report_field
from shared.prompts import offense_prompt, defense_prompt, synergy_prompt, versatility_prompt
from shared.langchain_utils import send_chat


analyze_deck_bp = Blueprint()

# ---------------------------------------------------------------------------
# Category Configuration
# ---------------------------------------------------------------------------
CATEGORY_CONFIG = {
    "offense":     {"field": "Offense",     "prompt": offense_prompt,     "model": "gpt-5.1"},
    "defense":     {"field": "Defense",     "prompt": defense_prompt,     "model": "gpt-5.1"},
    "synergy":     {"field": "Synergy",     "prompt": synergy_prompt,     "model": "gpt-5"},
    "versatility": {"field": "Versatility", "prompt": versatility_prompt, "model": "gpt-5"},
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
async def wait_for_analysis(deck: str, field: str, timeout: int = 120, interval: int = 1):
    """
    Poll the table until the field is no longer 'loading'.
    Returns the final stored value or None on timeout.
    """
    for _ in range(timeout):
        await asyncio.sleep(interval)
        updated = get_report(deck).get(field)

        # Still loading → continue waiting
        if updated == "loading":
            continue

        # When it's no longer loading, return whatever is stored
        if updated not in ("loading", "no", None):
            return updated

    return None  # timeout expired


async def perform_analysis(deck, category_key):
    """Run OpenAI model and update table."""
    cfg = CATEGORY_CONFIG[category_key]
    field = cfg["field"]
    prompt = cfg["prompt"]

    # Mark as loading
    update_report_field(deck, field, "loading")

    # Call OpenAI model
    results = send_chat(system_input=prompt, user_input=deck)
    print(results.content)

    # Store in database
    update_report_field(deck, field, results.content)

    return results.content


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------
@analyze_deck_bp.route(route="analyze_deck", auth_level=func.AuthLevel.FUNCTION)
async def analyze_deck(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Deck analysis request received")

    # Parse JSON
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse("Invalid JSON", status_code=400)

    deck = body.get("deckToAnalyze")
    category = body.get("category")

    if not deck or not category:
        return func.HttpResponse("Missing 'deckToAnalyze' or 'category'", status_code=400)

    if category not in CATEGORY_CONFIG:
        return func.HttpResponse("Invalid category", status_code=400)

    cfg = CATEGORY_CONFIG[category]
    field = cfg["field"]

    # Load or fail
    report = get_report(deck)
    if not report:
        return func.HttpResponse("Report not found", status_code=404)

    current_value = report.get(field)

    # ----------------------------------------------------------------------
    # CASE 1 — Another request is already analyzing this category
    # ----------------------------------------------------------------------
    if current_value == "loading":
        logging.info(f"Analysis already running for deck '{deck}', category '{category}'. Waiting...")

        finished = await wait_for_analysis(deck, field)

        if finished is None:
            return func.HttpResponse("Timeout waiting for analysis", status_code=504)

        return func.HttpResponse(
            json.dumps({"category": category, "content": finished}),
            mimetype="application/json",
            status_code=200,
        )

    # ----------------------------------------------------------------------
    # CASE 2 — Needs to generate analysis now
    # ----------------------------------------------------------------------
    if current_value == "no":
        content = await perform_analysis(deck, category)

        return func.HttpResponse(
            json.dumps({"category": category, "content": content}),
            mimetype="application/json",
            status_code=200,
        )

    # ----------------------------------------------------------------------
    # CASE 3 — Already generated, just return cached result
    # ----------------------------------------------------------------------
    return func.HttpResponse(
        json.dumps({"category": category, "content": current_value}),
        mimetype="application/json",
        status_code=200,
    )
