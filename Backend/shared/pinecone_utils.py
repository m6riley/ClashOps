import os
import asyncio
from pinecone import Pinecone
from shared.openai_utils import embed

PINECONE_KEY = os.getenv("PINECONE_KEY")
client = Pinecone(api_key=PINECONE_KEY)

index = client.Index("tower-troops")

from typing import Optional

async def query_vectors(query: str, top_k: int, namespace: str, metadata_filter: Optional[dict] = None):
    vec = await embed(query)
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        lambda: index.query(
            vector = vec,
            top_k = top_k,
            namespace = namespace,
            include_metadata = True,
            filter = metadata_filter

        ).matches
    )
