import azure.functions as func
from azure.functions import Blueprint
import logging
import time

from shared.clash_royale_utils import PLAYER_DELAY, get_top_clans, get_clan_members, get_player_data, process_player_deck, upload_decks

refresh_decks_bp = Blueprint()


@refresh_decks_bp.timer_trigger(schedule="0 0 0 10,20,30 * *", arg_name="myTimer", run_on_startup=False,
              use_monitor=False) 
def refresh_decks(myTimer: func.TimerRequest) -> None:
    if myTimer.past_due:
        logging.info('The timer is past due!')
        
    logging.info("Fetching top clans...")
    clans = get_top_clans()

    if not clans:
        logging.info("No clan data found. Exiting.")
        return

    deck_dict = {}
    deck_id_counter = 1

    for clan in clans:
        clan_name = clan["name"]
        clan_tag = clan["tag"]

        logging.info(f"\nProcessing clan → {clan_name} ({clan_tag})")

        members = get_clan_members(clan_tag)
        if not members:
            logging.info("No members found.")
            continue

        for member in members:
            player_tag = member["tag"]

            player_data = get_player_data(player_tag)
            if not player_data:
                continue

            deck_id_counter = process_player_deck(
                player_data,
                deck_dict,
                deck_id_counter
            )

            time.sleep(PLAYER_DELAY)

    sorted_decks = sorted(deck_dict.values(), key=lambda d: d["score"], reverse=True)
    upload_decks(sorted_decks)

    logging.info(f"\nDone! Saved {len(sorted_decks)} unique decks.")

    logging.info('Python timer trigger function executed.')
    