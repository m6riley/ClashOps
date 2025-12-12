# Register this blueprint by adding the following line of code 
# to your entry point file.  
# app.register_functions(indexer) 
# 
# Please refer to https://aka.ms/azure-functions-python-blueprints


import azure.functions as func
import logging
import uuid
from shared.langchain_utils import embedding_model, chunk_text
from shared.pinecone_utils import index


ingest_blob_bp = func.Blueprint()

# Configuration Constants
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

@ingest_blob_bp.blob_trigger(arg_name="myblob", path="clashopscontainer", connection="STORAGE_CONNECTION_STRING") 
def ingest_blob(myblob: func.InputStream):
    logging.info("Blob ingestion process started")
    text = myblob.read().decode("utf-8")
    chunks = chunk_text(text, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
    vectors = embedding_model.embed_documents(chunks)
    payload = []
    for (chunk, vector) in enumerate[tuple[str, list[float]]](zip[tuple[str, list[float]]](chunks, vectors)):
        payload.append({
            "id": str(uuid.uuid4()),
            "values": vector,
            "metadata": {
                "text": chunk,
                "namespace": myblob.name()
            }
        })
    index.upsert(payload)
    logging.info("Blob ingestion process completed")