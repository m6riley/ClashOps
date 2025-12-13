from typing import Any


import logging
import json
import csv
import io
import azure.functions as func
from azure.functions import Blueprint
from shared.blobs_utils import cards

get_cards_bp = Blueprint()

@get_cards_bp.route(route="get_cards", auth_level=func.AuthLevel.FUNCTION)
def get_cards(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for getting all cards from the cards CSV blob.
    """
    logging.info("Get cards request received")
    try:
        # Download CSV bytes from blob
        blob_bytes = cards.download_blob().readall()

        # Convert to text
        csv_text = blob_bytes.decode("utf-8")

        # Parse CSV rows into dictionaries
        reader = csv.DictReader(io.StringIO(csv_text))
        cards_list = list[dict[str | Any, str | Any]](reader)
    except Exception as e:
        logging.error(f"Error getting cards from blob: {e}")
        return func.HttpResponse(
            f"Error getting cards: {e}",
            status_code=500,
            mimetype="text/plain"
        )

    return func.HttpResponse(
        json.dumps(cards_list),
        status_code=200,
        mimetype="application/json"
    )

