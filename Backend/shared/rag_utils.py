"""
RAG (Retrieval-Augmented Generation) utility functions.

This module provides helper functions for processing card names and
formatting vector search results for RAG contexts.
"""
def card_to_namespace(card: str) -> str:
    """
    Convert a card name to a Pinecone namespace format.
    
    Transforms card names to lowercase, replaces spaces with underscores,
    and removes brackets. Prepends "evolved_" prefix.
    
    Args:
        card: Card name (e.g., "Goblin Barrel", "[Mega Knight]")
    
    Returns:
        Namespace string (e.g., "evolved_goblin_barrel")
    """
    return (
        "evolved_"
        + card.lower()
        .replace(" ", "_")
        .replace("[", "")
        .replace("]", "")
    )


# UNUSED: This function is not currently used in the codebase
def build_context(matches: list) -> list[dict]:
    """
    Build a context list from Pinecone match results.
    
    Extracts troop name and text fact from match metadata.
    
    Args:
        matches: List of Pinecone match objects
    
    Returns:
        List of dictionaries with "Name" and "Fact" keys
    
    Note: This function is currently unused in the codebase.
    """
    return [
        {
            "Name": m.metadata.get("troop"),
            "Fact": m.metadata.get("text")
        }
        for m in matches
    ]
