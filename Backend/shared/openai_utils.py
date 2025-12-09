"""
OpenAI utility functions for chat completions and embeddings.

This module provides async functions for interacting with OpenAI's API,
including chat completions with JSON response format and text embeddings.
"""
import os
from openai import AsyncOpenAI

# OpenAI API key from environment variable
_OPENAI_KEY = os.getenv("OPENAI_KEY")

# Embedding model name for vector embeddings
EMBEDDING_MODEL = "text-embedding-3-large"

# Internal OpenAI client instance (not exported)
_client = AsyncOpenAI(api_key=_OPENAI_KEY)


async def run_chat(model: str, system: str, user: str, max_tokens: int = 6000) -> str:
    """
    Run a chat completion with OpenAI API.
    
    Args:
        model: The model name to use (e.g., "gpt-4", "gpt-5")
        system: System message content
        user: User message content
        max_tokens: Maximum tokens for completion (default: 6000)
    
    Returns:
        The message content from the first choice as a string
    """
    result = await _client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        max_completion_tokens=max_tokens
    )
    return result.choices[0].message.content


async def embed(text: str) -> list[float]:
    """
    Generate an embedding vector for the given text.
    
    Args:
        text: The text to embed
    
    Returns:
        A list of floats representing the embedding vector
    """
    result = await _client.embeddings.create(model=EMBEDDING_MODEL, input=text)
    return result.data[0].embedding
