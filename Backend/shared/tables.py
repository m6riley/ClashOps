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
