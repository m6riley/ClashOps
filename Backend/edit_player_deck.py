import logging
import azure.functions as func
from azure.functions import Blueprint
from shared.table_utils import _playerDecks, PARTITION_KEY

# Azure Functions Blueprint
edit_player_deck_bp = Blueprint()

# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@edit_player_deck_bp.route(route="edit_deck", auth_level=func.AuthLevel.FUNCTION)
def edit_player_deck(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for editing a deck in the database.
    """
    logging.info("Edit deck request received")

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
    cards = body.get("cards")
    categoryID = body.get("categoryID")
    deckName = body.get("deckName")
    
    if not deckID:
        logging.warning("Missing deckID field in request")
        return func.HttpResponse(
            "Missing 'deckID' field in request body",
            status_code=400,
            mimetype="text/plain"
        )
    
    if cards is None or categoryID is None:
        logging.warning("Missing cards or categoryID field in request")
        return func.HttpResponse(
            "Missing 'cards' and/or 'categoryID' field in request body",
            status_code=400,
            mimetype="text/plain"
        )
    
    # Find and update deck in database
    try:
        # Query for the deck using DeckID field
        query = f"PartitionKey eq '{PARTITION_KEY}' and DeckID eq '{deckID}'"
        decks = list(_playerDecks.query_entities(query))
        
        if not decks:
            logging.warning(f"Deck with DeckID {deckID} not found")
            return func.HttpResponse(
                "Deck not found",
                status_code=404,
                mimetype="text/plain"
            )
        
        # Get the deck entity
        deck = decks[0]
        row_key = deck.get("RowKey")
        
        if not row_key:
            logging.error(f"Deck found but RowKey is missing for DeckID {deckID}")
            return func.HttpResponse(
                "Deck found but RowKey is missing",
                status_code=500,
                mimetype="text/plain"
            )
        
        # Update the deck entity with new values
        deck["Cards"] = cards
        deck["CategoryID"] = categoryID
        if deckName is not None:
            deck["DeckName"] = deckName
        
        # Update the entity in the table (using upsert to ensure all fields are preserved)
        _playerDecks.upsert_entity(entity=deck)
        
        logging.info(f"Deck {deckID} updated successfully with new cards and category")
        return func.HttpResponse(
            "Deck updated successfully",
            status_code=200,
            mimetype="text/plain"
        )
    except Exception as e:
        logging.error(f"Error updating deck: {e}")
        return func.HttpResponse(
            f"Error updating deck: {e}",
            status_code=500,
            mimetype="text/plain"
        )

