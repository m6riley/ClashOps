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
    if card.replace("[", "").replace("]", "") == "X-Bow":
        return "x-bow"
    elif card.replace("[", "").replace("]", "") == "Mini P.E.K.K.A":
        return "mini_pekka"
    elif card.replace("[", "").replace("]", "") == "P.E.K.K.A":
        return "pekka"
    else:
        return card.lower().replace(" ", "_").replace("[", "").replace("]", "")
    
