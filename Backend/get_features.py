import logging
import json
import azure.functions as func
from azure.functions import Blueprint
from shared.tables import _features, PARTITION_KEY

# Azure Functions Blueprint
get_features_bp = Blueprint()

# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@get_features_bp.route(route="get_features", auth_level=func.AuthLevel.FUNCTION)
def get_features(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for getting all features from the database.
    """
    logging.info("Get features request received")
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
    # Get all features from database
    try:
        features = _features.query_entities(f"PartitionKey eq '{PARTITION_KEY}'")
    except Exception as e:
        logging.error(f"Error getting features: {e}")
        return func.HttpResponse(
            f"Error getting features: {e}",
            status_code=500,
            mimetype="text/plain"
        )
    return func.HttpResponse(
        json.dumps(features),
        status_code=200,
        mimetype="application/json"
    )
    