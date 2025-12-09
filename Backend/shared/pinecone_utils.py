"""
Pinecone vector database utilities for similarity search.

This module provides functions to query the Pinecone vector index
for semantic similarity search using text embeddings.
"""
import os
import asyncio
from typing import Optional
from pinecone import Pinecone
from shared.openai_utils import embed

# Pinecone API key from environment variable
_PINECONE_KEY = os.getenv("PINECONE_KEY")

# Internal Pinecone client instance (not exported)
_client = Pinecone(api_key=_PINECONE_KEY)

# Pinecone index name (unused - kept for reference)
# INDEX_NAME = "tower-troops"

# Pinecone index instance (exported for use in other modules)
index = _client.Index("tower-troops")


async def query_vectors(
    query: str,
    top_k: int,
    namespace: str,
    metadata_filter: Optional[dict] = None
) -> list:
    """
    Query the Pinecone vector index for similar vectors.
    
    Embeds the query text and searches for the top_k most similar vectors
    in the specified namespace with optional metadata filtering.
    
    Args:
        query: Text query to embed and search for
        top_k: Number of top results to return
        namespace: Pinecone namespace to search in
        metadata_filter: Optional metadata filter dictionary
    
    Returns:
        List of match objects from Pinecone query
    """
    vec = await embed(query)
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        lambda: index.query(
            vector=vec,
            top_k=top_k,
            namespace=namespace,
            include_metadata=True,
            filter=metadata_filter
        ).matches
    )
