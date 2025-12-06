import os
import csv
import requests
import time
from urllib.parse import quote
from datetime import datetime
from .blobs import blob
from io import StringIO

CLASH_ROYALE_KEY = os.getenv("CLASH_ROYALE_KEY")
BASE_URL = "https://api.clashroyale.com/v1"
TOP_CLANS = 3
LOCATION_ID = 57000006
PLAYER_DELAY = 0.2
RATE_LIMIT_SLEEP = 5
HEADERS = {"Authorization": f"Bearer {CLASH_ROYALE_KEY}"}

def fetch_json(url, retry_pause=5):
    """Fetch JSON with retry and rate-limit handling."""
    while True:
        try:
            response = requests.get(url, headers=HEADERS)

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

def get_top_clans():
    url = f"{BASE_URL}/locations/{LOCATION_ID}/rankings/clans?limit={TOP_CLANS}"
    data = fetch_json(url, HEADERS)
    return data.get("items", []) if data else []

def get_clan_members(clan_tag):
    encoded_tag = quote(clan_tag)
    url = f"{BASE_URL}/clans/{encoded_tag}"
    data = fetch_json(url, HEADERS)
    return data.get("memberList", []) if data else []


def get_player_data(player_tag):
    encoded_tag = quote(player_tag)
    url = f"{BASE_URL}/players/{encoded_tag}"
    return fetch_json(url, HEADERS)

def process_player_deck(player_data, deck_dict, deck_id_counter):
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

import csv
from io import StringIO

def upload_decks(sorted_decks):
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

    blob.upload_blob(csv_buffer.getvalue(), overwrite=True)
    print("Uploaded decks.csv to blob storage")
