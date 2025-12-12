from typing import Any


import logging
import json
import csv
import io
import azure.functions as func
from azure.functions import Blueprint
from shared.blobs_utils import decks

get_decks_bp = Blueprint()

@get_decks_bp.route(route="get_decks", auth_level=func.AuthLevel.FUNCTION)
def get_decks(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for getting all decks from the decks CSV blob.
    """
    logging.info("Get decks request received")
    try:
        # Download CSV bytes from blob
        blob_bytes = decks.download_blob().readall()

        # Convert to text
        csv_text = blob_bytes.decode("utf-8")

        # Parse CSV rows into dictionaries
        reader = csv.DictReader(io.StringIO(csv_text))
        decks = list[dict[str | Any, str | Any]](reader)
    except Exception as e:
        logging.error(f"Error getting decks from blob: {e}")
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
