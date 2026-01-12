"""
Azure Function for deleting player decks from the database.

This function handles HTTP requests to delete player deck entities from Azure
Table Storage.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.table_utils import player_decks_table, PARTITION_KEY
from shared.http_utils import (
    parse_json_body,
    validate_required_fields,
    create_error_response,
    create_success_response,
    build_table_query
)

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
    body, error_response = parse_json_body(req)
    if error_response:
        return error_response
    
    # Validate required fields
    error_response, fields = validate_required_fields(body, ["deckID"])
    if error_response:
        return error_response
    
    deck_id = fields["deckID"]
    
    # Delete deck from database
    try:
        # First, verify the deck exists by querying for it
        query = build_table_query(PARTITION_KEY, {"DeckID": deck_id})
        logging.info(f"Querying for deck with DeckID: {deck_id}")
        decks = list(player_decks_table.query_entities(query))
        
        if not decks:
            logging.warning(f"Deck with DeckID {deck_id} not found via query")
            # Since RowKey and DeckID are the same in save_player_deck, try direct deletion as fallback
            logging.info(f"Attempting direct deletion using deckID as RowKey: {deck_id}")
            try:
                player_decks_table.delete_entity(
                    partition_key=PARTITION_KEY,
                    row_key=deck_id
                )
                logging.info(f"Successfully deleted deck using direct RowKey: {deck_id}")
                return create_success_response(message="Deck deleted successfully")
            except Exception as direct_delete_error:
                logging.error(f"Direct deletion also failed: {direct_delete_error}")
                return create_error_response(
                    "Deck not found",
                    status_code=404,
                    log_error=False
                )
        
        # Get the RowKey from the found deck
        deck = decks[0]
        row_key = deck.get("RowKey")
        
        if not row_key:
            return create_error_response(
                f"Deck found but RowKey is missing for DeckID {deck_id}",
                status_code=500
            )
        
        logging.info(f"Found deck - PartitionKey: {PARTITION_KEY}, RowKey: {row_key}, DeckID: {deck_id}")
        logging.info(f"Deck entity keys: {list(deck.keys())}")
        
        # Delete the entity using PartitionKey and RowKey
        player_decks_table.delete_entity(
            partition_key=PARTITION_KEY,
            row_key=row_key
        )
        
        logging.info(f"Successfully deleted deck with RowKey: {row_key}")
        
        # Verify deletion by querying again
        verify_query = build_table_query(PARTITION_KEY, {"DeckID": deck_id})
        verify_decks = list(player_decks_table.query_entities(verify_query))
        
        if verify_decks:
            logging.warning(f"Deck still exists after deletion attempt. RowKey: {row_key}, DeckID: {deck_id}")
            return create_error_response(
                "Deck deletion may have failed - deck still exists",
                status_code=500
            )
        
        logging.info(f"Deletion verified - deck no longer exists in table")
        return create_success_response(message="Deck deleted successfully")
        
    except Exception as e:
        logging.error(f"Error deleting deck: {e}", exc_info=True)
        return create_error_response(f"Error deleting deck: {e}")