import json
import logging
import azure.functions as func
from azure.functions import Blueprint
from shared.tables import get_report, update_report_field
from shared.openai_utils import client as OPENAI_CLIENT
from shared.prompts import offense_prompt, defense_prompt, synergy_prompt, versatility_prompt



analyze_deck_bp = Blueprint()

# ---------------------------------------------------------------------------
# Category Configuration
# ---------------------------------------------------------------------------
CATEGORY_CONFIG = {
    "offense":    {"field": "Offense",    "prompt": offense_prompt,    "model": "gpt-5.1"},
    "defense":    {"field": "Defense",    "prompt": defense_prompt,    "model": "gpt-5.1"},
    "synergy":    {"field": "Synergy",    "prompt": synergy_prompt,    "model": "gpt-5"},
    "versatility": {"field": "Versatility", "prompt": versatility_prompt, "model": "gpt-5"},
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
async def perform_analysis(deck, category_key):
    """Run OpenAI model and update table."""
    cfg = CATEGORY_CONFIG[category_key]
    field = cfg["field"]
    prompt = cfg["prompt"]
    model = cfg["model"]

    # Mark as loading
    update_report_field(deck, field, "loading")

    # Call OpenAI model
    response = await OPENAI_CLIENT.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": deck},
        ],
        max_completion_tokens=6000,
    )

    content = response.choices[0].message.content

    # Store in database
    update_report_field(deck, field, content)

    return content

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

    # Already running
    if current_value == "loading":
        return func.HttpResponse("Report already generating for this category", status_code=409)

    # Needs to be generated
    if current_value == "no":
        content = await perform_analysis(deck, category)
        return func.HttpResponse(
            json.dumps({"category": category, "content": content}),
            mimetype="application/json",
            status_code=200,
        )

    # Already done — return cached result
    return func.HttpResponse(
        json.dumps({"category": category, "content": current_value}),
        mimetype="application/json",
        status_code=200,
    )
