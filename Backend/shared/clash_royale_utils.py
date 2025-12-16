"""
Clash Royale API utilities for fetching player and deck data.

This module provides functions to interact with the Clash Royale API,
including fetching top clans, clan members, player data, and processing
deck information for storage.
"""
import os
import csv
import requests
import time
from urllib.parse import quote
from datetime import datetime
from io import StringIO
from .blobs_utils import decks

# Clash Royale API key from environment variable
_CLASH_ROYALE_KEY = os.getenv("CLASH_ROYALE_KEY")

# Base URL for Clash Royale API
_BASE_URL = "https://api.clashroyale.com/v1"

# Number of top clans to fetch
_TOP_CLANS = 10

# Location ID for clan rankings (global)
_LOCATION_ID = 57000006

# Delay between player API calls (in seconds)
PLAYER_DELAY = 0.2

# Sleep duration when rate limited (in seconds)
_RATE_LIMIT_SLEEP = 5

# HTTP headers for API requests
_HEADERS = {"Authorization": f"Bearer {_CLASH_ROYALE_KEY}"}


def fetch_json(url: str, retry_pause: int = 5) -> dict | None:
    """
    Fetch JSON data from a URL with retry and rate-limit handling.
    
    Args:
        url: The URL to fetch
        retry_pause: Seconds to wait before retrying on rate limit (default: 5)
    
    Returns:
        JSON data as a dictionary, or None if request fails
    """
    while True:
        try:
            response = requests.get(url, headers=_HEADERS)

            if response.status_code == 200:
                return response.json()

            if response.status_code == 429:  # rate limited
                print("Rate limited → retrying...")
                time.sleep(retry_pause)
                continue

            print(f"HTTP {response.status_code} → {url}")
            return None

        except requests.RequestException as e:
            print("Request exception:", e)
            time.sleep(retry_pause)


def get_top_clans() -> list[dict]:
    """
    Fetch the top clans from the global rankings.
    
    Returns:
        List of clan dictionaries, or empty list if fetch fails
    """
    url = f"{_BASE_URL}/locations/{_LOCATION_ID}/rankings/clans?limit={_TOP_CLANS}"
    data = fetch_json(url)
    return data.get("items", []) if data else []


def get_clan_members(clan_tag: str) -> list[dict]:
    """
    Fetch all members of a clan by clan tag.
    
    Args:
        clan_tag: The clan tag (e.g., "#ABC123")
    
    Returns:
        List of member dictionaries, or empty list if fetch fails
    """
    encoded_tag = quote(clan_tag)
    url = f"{_BASE_URL}/clans/{encoded_tag}"
    data = fetch_json(url)
    return data.get("memberList", []) if data else []


def get_player_data(player_tag: str) -> dict | None:
    """
    Fetch player data by player tag.
    
    Args:
        player_tag: The player tag (e.g., "#ABC123")
    
    Returns:
        Player data dictionary, or None if fetch fails
    """
    encoded_tag = quote(player_tag)
    url = f"{_BASE_URL}/players/{encoded_tag}"
    return fetch_json(url)


def process_player_deck(player_data: dict, deck_dict: dict, deck_id_counter: int) -> int:
    """
    Process a player's current deck and update the deck dictionary.
    
    Increments the score for existing decks or creates a new entry.
    Returns the updated deck_id_counter.
    
    Args:
        player_data: Player data dictionary from API
        deck_dict: Dictionary mapping deck sets to deck information
        deck_id_counter: Current counter for assigning deck IDs
    
    Returns:
        Updated deck_id_counter
    """
    deck_cards = [c["name"] for c in player_data.get("currentDeck", [])]

    if not deck_cards:
        return deck_id_counter

    deck_key = frozenset(deck_cards)

    if deck_key in deck_dict:
        deck_dict[deck_key]["score"] += 1
        deck_dict[deck_key]["last_entry"] = datetime.now()
    else:
        deck_dict[deck_key] = {
            "deck_id": deck_id_counter,
            "cards": "; ".join(deck_cards),
            "score": 1,
            "last_entry": datetime.now(),
        }
        deck_id_counter += 1

    return deck_id_counter


def upload_decks(sorted_decks: list[dict]) -> None:
    """
    Upload sorted deck data to Azure Blob Storage as a CSV file.
    
    Args:
        sorted_decks: List of deck dictionaries sorted by score
    """
    csv_buffer = StringIO()
    writer = csv.writer(csv_buffer)

    # Write header
    writer.writerow(["deck_id", "cards", "score", "last_entry"])

    # Write rows
    for deck in sorted_decks:
        writer.writerow([
            deck["deck_id"],
            deck["cards"],
            deck["score"],
            deck["last_entry"].isoformat()  # convert datetime to string
        ])

    decks.upload_blob(csv_buffer.getvalue(), overwrite=True)
    print("Uploaded decks.csv to blob storage")
