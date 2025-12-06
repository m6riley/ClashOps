import os
from azure.storage.blob import BlobServiceClient

CONNECTION_STRING = os.getenv("STORAGE_CONNECTION_STRING")
CONTAINER_NAME = "clashopscontainer"
BLOB_NAME = "decks.csv"

_service = BlobServiceClient.from_connection_string(CONNECTION_STRING)
blob = _service.get_blob_client(
    container=CONTAINER_NAME,
    blob=BLOB_NAME

)