"""
Azure Function for saving player decks to the database.

This function handles HTTP requests to create new player deck entities in Azure
Table Storage.
"""
import logging
import uuid
import azure.functions as func
from azure.functions import Blueprint

from shared.table_utils import player_decks_table, PARTITION_KEY
from shared.http_utils import (
    parse_json_body,
    validate_required_fields,
    create_error_response,
    create_success_response
)

# Azure Functions Blueprint
save_player_deck_bp = Blueprint()

# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@save_player_deck_bp.route(route="save_player_deck", auth_level=func.AuthLevel.FUNCTION)
def save_player_deck(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for saving a deck to the database.
    """
    logging.info("Save deck request received")

    # Parse and validate request body
    body, error_response = parse_json_body(req)
    if error_response:
        return error_response
    
    # Validate required fields
    error_response, fields = validate_required_fields(body, ["cards", "userID", "categoryID"])
    if error_response:
        return error_response
    
    deck_id = str(uuid.uuid4())
    cards = fields["cards"]
    user_id = fields["userID"]
    category_id = fields["categoryID"]
    deck_name = body.get("deckName", "My Favourite Deck")  # Default to "My Favourite Deck" if not provided
    
    # Save deck to database
    try:
        player_decks_table.create_entity({
            "PartitionKey": PARTITION_KEY,
            "RowKey": deck_id,
            "DeckID": deck_id,  # Add DeckID field for easier lookup
            "Cards": cards,
            "UserID": user_id,
            "CategoryID": category_id,
            "DeckName": deck_name,
        })
        logging.info(f"Deck saved successfully for user: {user_id} and category: {category_id}")
        return create_success_response({
            "deckID": deck_id,
            "message": "Deck saved successfully"
        })
    except Exception as e:
        return create_error_response(f"Error saving deck: {e}")
