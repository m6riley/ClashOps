from typing import Any


import logging
import json
import csv
import io
import azure.functions as func
from azure.functions import Blueprint
from shared.blobs_utils import features

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
        blob_bytes = features.download_blob().readall()

        # Convert to text
        csv_text = blob_bytes.decode("utf-8")

        # Parse CSV rows into dictionaries
        reader = csv.DictReader(io.StringIO(csv_text))
        # Trim whitespace from keys and values
        features_list = []
        for row in reader:
            trimmed_row = {}
            for k, v in row.items():
                # Handle None keys (shouldn't happen, but be safe)
                if k is None:
                    continue
                # Strip key (handle empty strings)
                trimmed_key = k.strip() if k else k
                # Handle None values and strip string values
                if v is None:
                    trimmed_value = None
                elif isinstance(v, str):
                    trimmed_value = v.strip()
                else:
                    trimmed_value = v
                trimmed_row[trimmed_key] = trimmed_value
            features_list.append(trimmed_row)

    except Exception as e:
        logging.error(f"Error getting features from blob: {e}")
        return func.HttpResponse(
            f"Error getting features: {e}",
            status_code=500,
            mimetype="text/plain"
        )

    return func.HttpResponse(
        json.dumps(features_list),
        status_code=200,
        mimetype="application/json"
    )
