"""
Azure Table Storage utilities for deck report management.

This module provides functions to interact with Azure Table Storage
for storing and retrieving deck analysis reports. Supports canonical
deck matching to handle decks with the same cards in different orders.
"""
import os
from azure.data.tables import TableServiceClient

# Azure Storage connection string from environment variable
_CONNECTION_STRING = os.getenv("STORAGE_CONNECTION_STRING")

# Partition key for all report entities
PARTITION_KEY = "Default"

# Internal table service client (not exported)
_service = TableServiceClient.from_connection_string(_CONNECTION_STRING)

# Reports table client (exported for direct access in some modules)
_reports = _service.get_table_client("reports")

# Accounts table client
_accounts = _service.get_table_client("accounts")

# Decks table client
_decks = _service.get_table_client("decks")

# Categories table client
_categories = _service.get_table_client("categories")


# UNUSED: This function is not currently used in the codebase
def get_report(deck: str) -> dict | None:
    """
    Get a report entity by deck string (exact match).
    
    Args:
        deck: Deck string to look up
    
    Returns:
        Report entity dictionary, or None if not found
    
    Note: This function is currently unused. Use get_report_by_deck()
          instead for canonical deck matching.
    """
    try:
        return _reports.get_entity(PARTITION_KEY, deck)
    except Exception:
        return None


def update_report_field(deck: str, field: str, value: str) -> None:
    """
    Update a specific field in a report entity.
    
    Args:
        deck: RowKey of the deck to update
        field: Field name to update
        value: New value for the field
    """
    _reports.update_entity(
        mode="merge",
        entity={
            "PartitionKey": PARTITION_KEY,
            "RowKey": deck,
            field: value
        }
    )


def canonicalize(deck: str) -> str:
    """
    Convert a deck string to canonical form for comparison.
    
    Removes brackets, splits by comma, sorts cards alphabetically,
    and rejoins. This allows matching decks with the same cards
    regardless of order.
    
    Args:
        deck: Deck string (e.g., "[Card1, Card2, Card3]")
    
    Returns:
        Canonical deck string (e.g., "card1,card2,card3")
    """
    cleaned = deck.replace("[", "").replace("]", "")
    cards = [c.strip() for c in cleaned.split(",") if c.strip()]
    cards.sort(key=str.lower)
    return ",".join(cards)


def get_report_by_deck(deck: str) -> tuple[dict | None, str | None]:
    """
    Get a report entity by canonical deck matching.
    
    Finds the correct report even if the deck cards are in a different order.
    Uses canonical matching to compare decks regardless of card order.
    
    Args:
        deck: Deck string to look up (any order)
    
    Returns:
        Tuple of (report entity dictionary, actual RowKey), or (None, None) if not found.
        The RowKey is the original deck order as stored in the table.
    """
    canonical = canonicalize(deck)

    # Query all reports in partition
    filter_query = f"PartitionKey eq '{PARTITION_KEY}'"

    for entity in _reports.query_entities(filter_query):
        existing_deck = entity.get("RowKey", "")
        if canonicalize(existing_deck) == canonical:
            return entity, existing_deck

    return None, None