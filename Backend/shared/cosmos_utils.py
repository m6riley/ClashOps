"""
Azure Cosmos DB utilities.

This module provides Cosmos DB client and container access for use in
Azure Functions and other modules.
"""
import os
from azure.cosmos import CosmosClient, exceptions

# Cosmos DB connection configuration
_COSMOS_URI = "https://clashops-cosmos-account.documents.azure.com:443/"
_COSMOS_KEY = os.getenv("COSMOS_KEY")
_DATABASE_NAME = "clashops-cosmos-db"
_CONTAINER_NAME = "clashops-cosmos-container"

# Partition key field name for accounts
PARTITION_KEY_FIELD = "email"

# Internal Cosmos DB client (not exported)
_client = CosmosClient(_COSMOS_URI, credential=_COSMOS_KEY)

# Database client (not exported)
_database = _client.get_database_client(_DATABASE_NAME)

# Container client (exported for use in other modules)
container = _database.get_container_client(_CONTAINER_NAME)

# Export Cosmos DB exceptions for use in other modules
__all__ = ["container", "exceptions", "PARTITION_KEY_FIELD"]

