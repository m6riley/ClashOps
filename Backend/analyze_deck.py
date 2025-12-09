import json
import logging
import asyncio
import azure.functions as func
from azure.functions import Blueprint

from shared.tables import get_report_by_deck, update_report_field
from shared.prompts import offense_prompt, defense_prompt, synergy_prompt, versatility_prompt
from shared.langchain_utils import build_chain


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
async def wait_for_analysis(resolved_rowkey: str, field: str, timeout: int = 120, interval: int = 1):
    """
    Poll the table until the field is no longer 'loading'.
    Returns the final stored value or None on timeout.
    """
    from shared.tables import _reports  # local import to avoid circular

    for _ in range(timeout):
        await asyncio.sleep(interval)

        try:
            entity = _reports.get_entity(resolved_rowkey)
        except Exception:
            continue

        updated = entity.get(field)

        if updated == "loading":
            continue

        if updated not in ("loading", "no", None):
            return updated

    return None  # timeout expired


def perform_analysis(deck: str, category_key: str):
    """
    Run model inference and update the report record.
    """
    cfg = CATEGORY_CONFIG[category_key]
    field = cfg["field"]
    prompt = cfg["prompt"]

    # ---------------------------------------------------------
    # Resolve the actual RowKey in table (canonical match)
    # ---------------------------------------------------------
    report, resolved_rowkey = get_report_by_deck(deck)

    if not report:
        raise ValueError("Report not found for this deck")

    # ---------------------------------------------------------
    # Mark as loading
    # ---------------------------------------------------------
    update_report_field(resolved_rowkey, field, "loading")

    # Build and run the langchain model
    chain = build_chain()
    results = chain.invoke({
        "system_instructions": prompt,
        "user_input": deck,
        "retrievers": []
    })

    print("MODEL RESPONSE:", results)

    # ---------------------------------------------------------
    # Store result
    # ---------------------------------------------------------
    update_report_field(resolved_rowkey, field, results)

    return results


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

    # ---------------------------------------------------------
    # Resolve correct report row (canonical detection)
    # ---------------------------------------------------------
    report, resolved_rowkey = get_report_by_deck(deck)
    if not report:
        return func.HttpResponse("Report not found", status_code=404)

    current_value = report.get(field)

    # ---------------------------------------------------------
    # Case 1 — Already loading → wait for it
    # ---------------------------------------------------------
    if current_value == "loading":
        logging.info(f"Analysis already running for deck '{resolved_rowkey}', category '{category}'. Waiting...")

        finished = await wait_for_analysis(resolved_rowkey, field)
        if finished is None:
            return func.HttpResponse("Timeout waiting for analysis", status_code=504)

        return func.HttpResponse(
            json.dumps({"category": category, "content": finished}),
            mimetype="application/json",
            status_code=200,
        )

    # ---------------------------------------------------------
    # Case 2 — No analysis yet → perform now
    # ---------------------------------------------------------
    if current_value == "no":
        content = perform_analysis(deck, category)
        return func.HttpResponse(
            json.dumps({"category": category, "content": content}),
            mimetype="application/json",
            status_code=200,
        )

    # ---------------------------------------------------------
    # Case 3 — Already analyzed → return cached value
    # ---------------------------------------------------------
    return func.HttpResponse(
        json.dumps({"category": category, "content": current_value}),
        mimetype="application/json",
        status_code=200,
    )
