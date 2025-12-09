import azure.functions as func
from azure.functions import Blueprint
from shared.tables import _reports, PARTITION_KEY

create_report_bp = Blueprint()

def canonicalize(deck: str) -> str:
    # Remove brackets if present
    cleaned = deck.replace("[", "").replace("]", "")
    
    # Split by comma
    cards = [c.strip() for c in cleaned.split(",") if c.strip()]
    
    # Ensure we truly have 8 cards
    if len(cards) != 8:
        raise ValueError(f"Deck does not contain 8 cards: {cards}")

    # Sort alphabetically
    cards.sort(key=str.lower)
    return ",".join(cards)



@create_report_bp.route(route="create_report", auth_level=func.AuthLevel.FUNCTION)
def create_report(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse("Invalid JSON", status_code=400)

    deck = body.get("deck")
    if not deck:
        return func.HttpResponse("Missing 'deck' field", status_code=400)

    canonical_key = canonicalize(deck)

    # ------------------------------------------------------------
    # STEP 1: Check if a deck with this canonical form exists
    # ------------------------------------------------------------
    query = f"PartitionKey eq '{PARTITION_KEY}' and CanonicalKey eq '{canonical_key}'"
    existing = list(_reports.query_entities(query))

    if existing:
        # A report already exists for this set of 8 cards.
        return func.HttpResponse("Deck already has a report", status_code=200)

    # ------------------------------------------------------------
    # STEP 2: Insert new entity using ORIGINAL deck order
    # ------------------------------------------------------------
    entity = {
        "PartitionKey": PARTITION_KEY,
        "RowKey": deck,            # <-- ORIGINAL order preserved
        "CanonicalKey": canonical_key,  # <-- Used only for duplicate detection
        "Offense": "no",
        "Defense": "no",
        "Synergy": "no",
        "Versatility": "no",
        "Optimize": "no"
    }

    try:
        _reports.create_entity(entity)
        return func.HttpResponse("Report added successfully", status_code=200)
    except Exception as e:
        return func.HttpResponse(f"Error creating report: {e}", status_code=500)
