"""
Azure Function for ingesting blob content into Pinecone vector database.

This EventGrid-triggered function processes blob storage events, downloads the blob content,
chunks the text, generates embeddings, and upserts them into Pinecone with metadata.
"""
import azure.functions as func
import logging
import uuid
import os
from urllib.parse import urlparse
from azure.storage.blob import BlobServiceClient
from shared.langchain_utils import embedding_model, chunk_text
from shared.pinecone_utils import index

ingest_blob_bp = func.Blueprint()

# Configuration Constants
CHUNK_SIZE = 200
CHUNK_OVERLAP = 20
_CONTAINER_NAME = "clashopscontainer"
_CONNECTION_STRING = os.getenv("STORAGE_CONNECTION_STRING")

@ingest_blob_bp.event_grid_trigger(arg_name="event", event_type="Microsoft.Storage.BlobCreated", data_version="1.0")
def ingest_blob(event: func.EventGridEvent):
    """
    EventGrid-triggered Azure Function for ingesting blob content into Pinecone.
    
    Processes blob storage events (typically BlobCreated), downloads the blob,
    chunks the text, generates embeddings, and upserts them into Pinecone.
    
    Args:
        event: EventGrid event containing blob storage event data
    """
    logging.info("Blob ingestion process started")
    
    try:
        # Extract blob URL from event data
        event_data = event.get_json()
        blob_url = event_data.get("url")
        
        if not blob_url:
            logging.error("No blob URL found in event data")
            return
        
        logging.info(f"Processing blob: {blob_url}")
        
        # Parse blob URL to extract container and blob name
        parsed_url = urlparse(blob_url)
        path_parts = parsed_url.path.strip("/").split("/", 1)
        
        if len(path_parts) < 2:
            logging.error(f"Invalid blob URL format: {blob_url}")
            return
        
        container_name = path_parts[0]
        blob_name = path_parts[1]
        
        # Only process blobs from the configured container
        if container_name != _CONTAINER_NAME:
            logging.info(f"Skipping blob from container: {container_name}")
            return
        
        # Download blob content
        service_client = BlobServiceClient.from_connection_string(_CONNECTION_STRING)
        blob_client = service_client.get_blob_client(container=container_name, blob=blob_name)
        blob_bytes = blob_client.download_blob().readall()
        text = blob_bytes.decode("utf-8")
        
        # Process text: chunk, embed, and prepare for upsert
        chunks = chunk_text(text, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP, separators=["*"])
        vectors = embedding_model.embed_documents(chunks)
        
        payload = []
        for chunk, vector in zip(chunks, vectors):
            payload.append({
                "id": str(uuid.uuid4()),
                "values": vector,
                "metadata": {
                    "text": chunk,
                    "namespace": blob_name.split(".")[0]
                }
            })
        
        # Upsert to Pinecone
        index.upsert(vectors=payload)
        logging.info(f"Blob ingestion process completed. Processed {len(payload)} chunks from {blob_name}")
        
    except Exception as e:
        logging.error(f"Error during blob ingestion: {e}", exc_info=True)
        raise