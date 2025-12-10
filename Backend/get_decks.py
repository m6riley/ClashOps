import logging
import json
import azure.functions as func
from azure.functions import Blueprint
from shared.tables import _decks, PARTITION_KEY

# Azure Functions Blueprint
get_decks_bp = Blueprint()

# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@get_decks_bp.route(route="get_decks", auth_level=func.AuthLevel.FUNCTION)
def get_decks(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for getting all decks from the database.
    """
    logging.info("Get decks request received")
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
    userID = body.get("userID")
    if not userID:
        logging.warning("Missing field in request")
        return func.HttpResponse(
            "Missing field in request",
            status_code=400,
            mimetype="text/plain"
        )
    # Get all decks from database
    try:
        decks = _decks.query_entities(f"PartitionKey eq '{PARTITION_KEY}' and UserID eq '{userID}'")
    except Exception as e:
        logging.error(f"Error getting decks: {e}")
        return func.HttpResponse(
            f"Error getting decks: {e}",
            status_code=500,
            mimetype="text/plain"
        )
    return func.HttpResponse(
        json.dumps(decks),
        status_code=200,
        mimetype="application/json"
    )