"""
Azure Function for refreshing deck data from Clash Royale API.

This timer-triggered function runs on the 10th, 20th, and 30th of each month
to fetch deck data from top global clans, aggregate deck usage statistics,
and upload the results to Azure Blob Storage.
"""
import logging
import time
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

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------

# Timer schedule: Runs on 10th, 20th, and 30th of each month at midnight UTC
_TIMER_SCHEDULE = "0 0 0 10,20,30 * *"

# Starting deck ID counter
_INITIAL_DECK_ID = 1


# ---------------------------------------------------------------------------
# Azure Function Timer Trigger
# ---------------------------------------------------------------------------

@refresh_decks_bp.timer_trigger(
    schedule=_TIMER_SCHEDULE,
    arg_name="myTimer",
    run_on_startup=False,
    use_monitor=False
)
def refresh_decks(myTimer: func.TimerRequest) -> None:
    """
    Timer-triggered Azure Function for refreshing deck data.
    
    Fetches deck data from top global clans via the Clash Royale API,
    aggregates deck usage statistics, and uploads to blob storage.
    
    Process:
    1. Fetch top clans from global rankings
    2. For each clan, fetch all members
    3. For each member, fetch their current deck
    4. Aggregate decks by card set (canonical form)
    5. Sort by usage score and upload to blob storage
    
    Args:
        myTimer: Timer trigger request object
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

    # Initialize deck aggregation dictionary
    deck_dict = {}
    deck_id_counter = _INITIAL_DECK_ID

    # Process each clan
    for clan in clans:
        clan_name = clan.get("name", "Unknown")
        clan_tag = clan.get("tag", "")

        logging.info(f"Processing clan: {clan_name} ({clan_tag})")

        members = get_clan_members(clan_tag)
        if not members:
            logging.info(f"No members found for clan: {clan_name}")
            continue

        logging.info(f"Processing {len(members)} members from {clan_name}")

        # Process each member's deck
        for member in members:
            player_tag = member.get("tag", "")
            if not player_tag:
                continue

            player_data = get_player_data(player_tag)
            if not player_data:
                logging.debug(f"Could not fetch data for player: {player_tag}")
                continue

            # Process and aggregate deck
            deck_id_counter = process_player_deck(
                player_data,
                deck_dict,
                deck_id_counter
            )

            # Rate limiting delay between API calls
            time.sleep(PLAYER_DELAY)

    # Sort decks by score (descending) and upload
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
    