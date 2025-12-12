"""
Pinecone vector database utilities for similarity search.

This module provides functions to query the Pinecone vector index
for semantic similarity search using text embeddings.
"""
import os
from pinecone import Pinecone

# Pinecone API key from environment variable
_PINECONE_KEY = os.getenv("PINECONE_KEY")

# Internal Pinecone client instance (not exported)
_client = Pinecone(api_key=_PINECONE_KEY)

# Pinecone index instance (exported for use in other modules)
index = _client.Index("clashops")