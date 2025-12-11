"""
Azure Function for refreshing deck data from Clash Royale API.

This timer-triggered function runs on the 10th, 20th, and 30th of each month
to fetch deck data from top global clans, aggregate deck usage statistics,
and upload the results to Azure Blob Storage.
"""
import logging
import time
import uuid
import azure.functions as func
from azure.functions import Blueprint

from shared.clash_royale_utils import (
    PLAYER_DELAY,
    get_top_clans,
    get_clan_members,
    get_player_data,
    process_player_deck,
    upload_decks
)

# Azure Functions Blueprint
refresh_decks_bp = Blueprint()

# Timer schedule: 10th, 20th, 30th at midnight UTC
_TIMER_SCHEDULE = "0 0 0 10,20,30 * *"


@refresh_decks_bp.timer_trigger(
    schedule=_TIMER_SCHEDULE,
    arg_name="myTimer",
    run_on_startup=False,
    use_monitor=False
)
def refresh_decks(myTimer: func.TimerRequest) -> None:
    """
    Timer-triggered Azure Function for refreshing deck data.
    Fetches deck data from top global clans, aggregates by canonical form,
    assigns UUID deck IDs, increments scores, and uploads to blob storage.
    """

    if myTimer.past_due:
        logging.warning("The timer is past due!")

    logging.info("Starting deck refresh process...")
    logging.info("Fetching top clans...")

    clans = get_top_clans()
    if not clans:
        logging.warning("No clan data found. Exiting.")
        return

    logging.info(f"Found {len(clans)} top clans to process")

    # Dictionary: canonical_key -> deck_data
    deck_dict = {}

    # ---------------------------------------------------------
    # FETCH & PROCESS CLANS
    # ---------------------------------------------------------
    for clan in clans:
        clan_name = clan.get("name", "Unknown")
        clan_tag = clan.get("tag", "")

        logging.info(f"Processing clan: {clan_name} ({clan_tag})")

        members = get_clan_members(clan_tag)
        if not members:
            logging.info(f"No members found for clan: {clan_name}")
            continue

        logging.info(f"Processing {len(members)} members from {clan_name}")

        for member in members:
            player_tag = member.get("tag", "")
            if not player_tag:
                continue

            player_data = get_player_data(player_tag)
            if not player_data:
                logging.debug(f"Could not fetch data for player: {player_tag}")
                continue

            # Get (canonical_key, deck_payload)
            canonical_key, deck_payload = process_player_deck(player_data)

            # -------------------------------
            # NEW UNIQUE DECK
            # -------------------------------
            if canonical_key not in deck_dict:
                deck_payload["deck_id"] = str(uuid.uuid4())
                deck_payload["score"] = 1  # first sighting
                deck_dict[canonical_key] = deck_payload

            # -------------------------------
            # DECK SEEN BEFORE
            # -------------------------------
            else:
                existing = deck_dict[canonical_key]
                existing["score"] += 1  # always increment by 1

            time.sleep(PLAYER_DELAY)

    # ---------------------------------------------------------
    # SORT & UPLOAD
    # ---------------------------------------------------------

    sorted_decks = sorted(
        deck_dict.values(),
        key=lambda d: d["score"],
        reverse=True
    )

    logging.info(f"Aggregated {len(sorted_decks)} unique decks")

    if sorted_decks:
        upload_decks(sorted_decks)
        logging.info(f"Successfully uploaded {len(sorted_decks)} decks to blob storage")
    else:
        logging.warning("No decks to upload")

    logging.info("Deck refresh process completed successfully")