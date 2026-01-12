"""
Azure Function for creating new deck report entries.

This function handles HTTP requests to create new report entities in Azure
Table Storage. It validates deck format, checks for duplicates using canonical
matching, and creates a new report with default "no" values for all categories.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.table_utils import _reports, PARTITION_KEY

# Azure Functions Blueprint
create_report_bp = Blueprint()

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------

# Expected number of cards in a valid deck
_EXPECTED_DECK_SIZE = 8

# Default values for analysis categories
_DEFAULT_CATEGORY_VALUE = "no"


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def canonicalize(deck: str) -> str:
    """
    Convert a deck string to canonical form for duplicate detection.
    
    Removes brackets, splits by comma, validates card count, and sorts
    alphabetically. This allows matching decks with the same cards regardless
    of order.
    
    Args:
        deck: Deck string (e.g., "[Card1, Card2, Card3, ...]")
    
    Returns:
        Canonical deck string with sorted, comma-separated cards
    
    Raises:
        ValueError: If deck does not contain exactly 8 cards
    """
    # Remove brackets if present
    cleaned = deck.replace("[", "").replace("]", "")

    # Split by comma and strip whitespace
    cards = [c.strip() for c in cleaned.split(",") if c.strip()]

    # Validate deck size
    if len(cards) != _EXPECTED_DECK_SIZE:
        raise ValueError(
            f"Deck must contain exactly {_EXPECTED_DECK_SIZE} cards. "
            f"Found {len(cards)}: {cards}"
        )

    # Sort alphabetically (case-insensitive)
    cards.sort(key=str.lower)
    return ",".join(cards)


# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@create_report_bp.route(route="create_report", auth_level=func.AuthLevel.FUNCTION)
def create_report(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for creating new deck reports.
    
    Validates the deck format, checks for existing reports using canonical
    matching, and creates a new report entity if one doesn't exist.
    
    Request body should contain:
        - deck: Deck string with 8 comma-separated card names
    
    Returns:
        HTTP response indicating success or failure
    """
    logging.info("Create report request received")

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

    deck = body.get("deck")
    if not deck:
        logging.warning("Missing 'deck' field in request")
        return func.HttpResponse(
            "Missing 'deck' field",
            status_code=400,
            mimetype="text/plain"
        )

    # Validate and canonicalize deck
    try:
        canonical_key = canonicalize(deck)
    except ValueError as e:
        logging.warning(f"Invalid deck format: {e}")
        return func.HttpResponse(
            str(e),
            status_code=400,
            mimetype="text/plain"
        )

    # Step 1: Check if a deck with this canonical form already exists
    query = (
        f"PartitionKey eq '{PARTITION_KEY}' "
        f"and CanonicalKey eq '{canonical_key}'"
    )
    existing = list(_reports.query_entities(query))

    if existing:
        logging.info(f"Report already exists for canonical deck: {canonical_key}")
        return func.HttpResponse(
            "Deck already has a report",
            status_code=200,
            mimetype="text/plain"
        )

    # Step 2: Insert new entity using ORIGINAL deck order
    entity = {
        "PartitionKey": PARTITION_KEY,
        "RowKey": deck,  # Original order preserved
        "CanonicalKey": canonical_key,  # Used only for duplicate detection
        "Offense": _DEFAULT_CATEGORY_VALUE,
        "Defense": _DEFAULT_CATEGORY_VALUE,
        "Synergy": _DEFAULT_CATEGORY_VALUE,
        "Versatility": _DEFAULT_CATEGORY_VALUE,
        "Optimize": _DEFAULT_CATEGORY_VALUE
    }

    try:
        _reports.create_entity(entity)
        logging.info(f"Report created successfully for deck: {deck}")
        return func.HttpResponse(
            "Report added successfully",
            status_code=200,
            mimetype="text/plain"
        )
    except Exception as e:
        logging.error(f"Error creating report: {e}")
        return func.HttpResponse(
            f"Error creating report: {e}",
            status_code=500,
            mimetype="text/plain"
        )
