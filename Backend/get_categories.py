import logging
import json
import azure.functions as func
from azure.functions import Blueprint
from shared.table_utils import _categories, PARTITION_KEY

# Azure Functions Blueprint
get_categories_bp = Blueprint()

# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@get_categories_bp.route(route="get_categories", auth_level=func.AuthLevel.FUNCTION)
def get_categories(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for getting all categories from the database.
    """
    logging.info("Get categories request received")
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
    # Get all categories from database
    try:
        categories = list(_categories.query_entities(f"PartitionKey eq '{PARTITION_KEY}' and UserID eq '{userID}'"))
    except Exception as e:
        logging.error(f"Error getting categories: {e}")
        return func.HttpResponse(
            f"Error getting categories: {e}",
            status_code=500,
            mimetype="text/plain"
        )
    return func.HttpResponse(
        json.dumps(categories),
        status_code=200,
        mimetype="application/json"
    )