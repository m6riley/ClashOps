import logging
import azure.functions as func
from azure.functions import Blueprint
from shared.tables import _playerDecks, PARTITION_KEY

# Azure Functions Blueprint
delete_player_deck_bp = Blueprint()

# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@delete_player_deck_bp.route(route="delete_deck", auth_level=func.AuthLevel.FUNCTION)
def delete_player_deck(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for deleting a deck from the database.
    """
    logging.info("Delete deck request received")
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
    deckID = body.get("deckID")
    if not deckID:
        logging.warning("Missing field in request")
        return func.HttpResponse(
            "Missing field in request",
            status_code=400,
            mimetype="text/plain"
        )
    # Delete deck from database
    try:
        _playerDecks.delete_entity(
            partition_key=PARTITION_KEY,
            row_key=deckID
        )
    except Exception as e:
        logging.error(f"Error deleting deck: {e}")
        return func.HttpResponse(
            f"Error deleting deck: {e}",
            status_code=500,
            mimetype="text/plain"
        )
    return func.HttpResponse(
        "Deck deleted successfully",
        status_code=200,
        mimetype="text/plain"
    )