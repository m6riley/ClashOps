"""
Azure Blob Storage utilities for deck data.

This module provides access to the Azure Blob Storage container
where deck CSV files are stored.
"""
import os
from azure.storage.blob import BlobServiceClient

# Azure Storage connection string from environment variable
_CONNECTION_STRING = os.getenv("STORAGE_CONNECTION_STRING")

# Container name for deck data
_CONTAINER_NAME = "clashopscontainer"


# Internal blob service client (not exported)
_service = BlobServiceClient.from_connection_string(_CONNECTION_STRING)

# Blob client for the decks.csv file (exported for use in other modules)
decks = _service.get_blob_client(
    container=_CONTAINER_NAME,
    blob="decks.csv"
)

features = _service.get_blob_client(
    container=_CONTAINER_NAME,
    blob="features.csv"
)

cards = _service.get_blob_client(
    container=_CONTAINER_NAME,
    blob="cards.csv"
)

