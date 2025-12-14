import logging
import json
import azure.functions as func
from azure.functions import Blueprint
from shared.table_utils import _playerDecks, PARTITION_KEY
import uuid

# Azure Functions Blueprint
save_player_deck_bp = Blueprint()

# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@save_player_deck_bp.route(route="save_deck", auth_level=func.AuthLevel.FUNCTION)
def save_player_deck(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for saving a deck to the database.
    """
    logging.info("Save deck request received")

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
    deckID = str(uuid.uuid4())
    cards = body.get("cards")
    userID = body.get("userID")
    categoryID = body.get("categoryID")
    deckName = body.get("deckName", "My Favourite Deck")  # Default to "My Favourite Deck" if not provided
    if not cards or not userID or not categoryID:
        logging.warning("Missing field in request")
        return func.HttpResponse(
            "Missing field in request",
            status_code=400,
            mimetype="text/plain"
        )
    # Save deck to database
    try:
        _playerDecks.create_entity({
            "PartitionKey": PARTITION_KEY,
            "RowKey": deckID,
            "DeckID": deckID,  # Add DeckID field for easier lookup
            "Cards": cards,
            "UserID": userID,
            "CategoryID": categoryID,
            "DeckName": deckName,
        })
        logging.info(f"Deck saved successfully for user: {userID} and category: {categoryID}")
        return func.HttpResponse(
            json.dumps({"deckID": deckID, "message": "Deck saved successfully"}),
            status_code=200,
            mimetype="application/json"
        )
    except Exception as e:
        logging.error(f"Error saving deck: {e}")
        return func.HttpResponse(
            f"Error saving deck: {e}",
            status_code=500,
            mimetype="text/plain"
        )
