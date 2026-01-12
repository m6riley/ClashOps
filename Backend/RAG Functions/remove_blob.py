"""
Azure Function for removing blob embeddings from Pinecone vector database.

This EventGrid-triggered function processes blob storage deletion events,
identifies all embeddings associated with the deleted blob, and removes
them from the Pinecone index.
"""
import azure.functions as func
import logging
from urllib.parse import urlparse
from shared.pinecone_utils import index

remove_blob_bp = func.Blueprint()

# Configuration Constants
_CONTAINER_NAME = "clashopscontainer"


@remove_blob_bp.event_grid_trigger(
    arg_name="event",
    event_type="Microsoft.Storage.BlobDeleted",
    data_version="1.0"
)
def remove_blob(event: func.EventGridEvent):
    """
    EventGrid-triggered Azure Function for removing blob embeddings from Pinecone.
    
    Processes blob storage deletion events (BlobDeleted), extracts the blob name,
    and deletes all embeddings from Pinecone that were created from that blob.
    
    Args:
        event: EventGrid event containing blob storage event data
    """
    logging.info("Blob removal process started")
    
    try:
        # Extract blob URL from event data
        event_data = event.get_json()
        blob_url = event_data.get("url")
        
        if not blob_url:
            logging.error("No blob URL found in event data")
            return
        
        logging.info(f"Processing blob deletion: {blob_url}")
        
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
        
        # Delete embeddings associated with this blob
        # The blob name is stored in metadata.namespace field
        metadata_filter = {
            "namespace": {"$eq": blob_name}
        }
        
        # Delete vectors matching the metadata filter
        # This will delete all embeddings that have this blob name in their metadata
        index.delete(filter=metadata_filter)
        
        logging.info(f"Successfully deleted embeddings for blob: {blob_name}")
        
    except Exception as e:
        logging.error(f"Error during blob removal: {e}", exc_info=True)
        raise

