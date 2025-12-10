import logging
import json
import csv
import io
import azure.functions as func
from azure.functions import Blueprint
from shared.blobs import _features

# Azure Functions Blueprint
get_features_bp = Blueprint()

@get_features_bp.route(route="get_features", auth_level=func.AuthLevel.FUNCTION)
def get_features(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for getting all features from the features CSV blob.
    """
    logging.info("Get features request received")

    try:
        # Download CSV bytes from blob
        blob_bytes = _features.download_blob().readall()

        # Convert to text
        csv_text = blob_bytes.decode("utf-8")

        # Parse CSV rows into dictionaries
        reader = csv.DictReader(io.StringIO(csv_text))
        features = list(reader)

    except Exception as e:
        logging.error(f"Error getting features from blob: {e}")
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
