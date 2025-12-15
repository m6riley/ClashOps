import logging
import azure.functions as func
from azure.functions import Blueprint
from shared.table_utils import _playerDecks, PARTITION_KEY

# Azure Functions Blueprint
delete_player_deck_bp = Blueprint()

# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@delete_player_deck_bp.route(route="delete_player_deck", auth_level=func.AuthLevel.FUNCTION)
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
        # First, verify the deck exists by querying for it
        query = f"PartitionKey eq '{PARTITION_KEY}' and DeckID eq '{deckID}'"
        logging.info(f"Querying for deck with DeckID: {deckID}")
        decks = list(_playerDecks.query_entities(query))
        
        if not decks:
            logging.warning(f"Deck with DeckID {deckID} not found via query")
            # Since RowKey and DeckID are the same in save_player_deck, try direct deletion as fallback
            logging.info(f"Attempting direct deletion using deckID as RowKey: {deckID}")
            try:
                _playerDecks.delete_entity(
                    partition_key=PARTITION_KEY,
                    row_key=deckID
                )
                logging.info(f"Successfully deleted deck using direct RowKey: {deckID}")
                return func.HttpResponse(
                    "Deck deleted successfully",
                    status_code=200,
                    mimetype="text/plain"
                )
            except Exception as direct_delete_error:
                logging.error(f"Direct deletion also failed: {direct_delete_error}")
                return func.HttpResponse(
                    "Deck not found",
                    status_code=404,
                    mimetype="text/plain"
                )
        
        # Get the RowKey from the found deck
        deck = decks[0]
        row_key = deck.get("RowKey")
        
        if not row_key:
            logging.error(f"Deck found but RowKey is missing for DeckID {deckID}")
            return func.HttpResponse(
                "Deck found but RowKey is missing",
                status_code=500,
                mimetype="text/plain"
            )
        
        logging.info(f"Found deck - PartitionKey: {PARTITION_KEY}, RowKey: {row_key}, DeckID: {deckID}")
        logging.info(f"Deck entity keys: {list(deck.keys())}")
        
        # Delete the entity using PartitionKey and RowKey
        _playerDecks.delete_entity(
            partition_key=PARTITION_KEY,
            row_key=row_key
        )
        
        logging.info(f"Successfully deleted deck with RowKey: {row_key}")
        
        # Verify deletion by querying again
        verify_query = f"PartitionKey eq '{PARTITION_KEY}' and DeckID eq '{deckID}'"
        verify_decks = list(_playerDecks.query_entities(verify_query))
        
        if verify_decks:
            logging.warning(f"Deck still exists after deletion attempt. RowKey: {row_key}, DeckID: {deckID}")
            return func.HttpResponse(
                "Deck deletion may have failed - deck still exists",
                status_code=500,
                mimetype="text/plain"
            )
        
        logging.info(f"Deletion verified - deck no longer exists in table")
        
    except Exception as e:
        logging.error(f"Error deleting deck: {e}", exc_info=True)
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