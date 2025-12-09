import os
from azure.data.tables import TableServiceClient

CONNECTION_STRING = os.getenv("STORAGE_CONNECTION_STRING")
PARTITION_KEY = "Default"

_service = TableServiceClient.from_connection_string(CONNECTION_STRING)
_reports = _service.get_table_client("reports")

def get_report(deck: str):
    try:
        return _reports.get_entity(PARTITION_KEY, deck)
    except Exception:
        return None

def update_report_field(deck: str, field: str, value):
    _reports.update_entity(
        mode="merge",
        entity={
            "PartitionKey": PARTITION_KEY,
            "RowKey": deck,
            field: value
        }
    )

def canonicalize(deck: str) -> str:
    cleaned = deck.replace("[", "").replace("]", "")
    cards = [c.strip() for c in cleaned.split(",") if c.strip()]
    cards.sort(key=str.lower)
    return ",".join(cards)


def get_report_by_deck(deck: str):
    """
    Returns the correct report entity even if the deck is in a different order.
    Also returns the actual RowKey stored for updates.
    """
    canonical = canonicalize(deck)

    # Query all reports in partition
    filter_query = f"PartitionKey eq '{PARTITION_KEY}'"

    for entity in _reports.query_entities(filter_query):
        existing_deck = entity.get("RowKey", "")
        if canonicalize(existing_deck) == canonical:
            return entity, existing_deck

    return None, None