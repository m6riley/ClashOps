"""
Azure Function for editing player decks in the database.

This function handles HTTP requests to update player deck entities in Azure
Table Storage.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.table_utils import player_decks_table, PARTITION_KEY
from shared.http_utils import (
    parse_json_body,
    create_error_response,
    create_success_response,
    build_table_query
)

# Azure Functions Blueprint
edit_player_deck_bp = Blueprint()

# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@edit_player_deck_bp.route(route="edit_player_deck", auth_level=func.AuthLevel.FUNCTION)
def edit_player_deck(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for editing a deck in the database.
    """
    logging.info("Edit deck request received")

    # Parse and validate request body
    body, error_response = parse_json_body(req)
    if error_response:
        return error_response
    
    deck_id = body.get("deckID")
    cards = body.get("cards")
    category_id = body.get("categoryID")
    deck_name = body.get("deckName")
    
    if not deck_id:
        return create_error_response(
            "Missing 'deckID' field in request body",
            status_code=400,
            log_error=False
        )
    
    if cards is None or category_id is None:
        return create_error_response(
            "Missing 'cards' and/or 'categoryID' field in request body",
            status_code=400,
            log_error=False
        )
    
    # Find and update deck in database
    try:
        # Query for the deck using DeckID field
        query = build_table_query(PARTITION_KEY, {"DeckID": deck_id})
        decks = list(player_decks_table.query_entities(query))
        
        if not decks:
            logging.warning(f"Deck with DeckID {deck_id} not found")
            return create_error_response(
                "Deck not found",
                status_code=404,
                log_error=False
            )
        
        # Get the deck entity
        deck = decks[0]
        row_key = deck.get("RowKey")
        
        if not row_key:
            return create_error_response(
                f"Deck found but RowKey is missing for DeckID {deck_id}",
                status_code=500
            )
        
        # Update the deck entity with new values
        deck["Cards"] = cards
        deck["CategoryID"] = category_id
        if deck_name is not None:
            deck["DeckName"] = deck_name
        
        # Update the entity in the table (using upsert to ensure all fields are preserved)
        player_decks_table.upsert_entity(entity=deck)
        
        logging.info(f"Deck {deck_id} updated successfully with new cards and category")
        return create_success_response({
            "deckID": deck_id,
            "message": "Deck updated successfully"
        })
    except Exception as e:
        return create_error_response(f"Error updating deck: {e}")

