"""
Azure Function for refreshing deck data from Clash Royale API (HTTP-triggered).

This HTTP-triggered function can be called manually to fetch deck data from top global clans,
aggregate deck usage statistics, and upload the results to Azure Blob Storage.
"""
import logging
import time
import json
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
refresh_decks_http_bp = Blueprint()


@refresh_decks_http_bp.route(route="refresh_decks_http", auth_level=func.AuthLevel.FUNCTION)
def refresh_decks_http(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for refreshing deck data.
    Fetches deck data from top global clans, aggregates by canonical form,
    assigns UUID deck IDs, increments scores, and uploads to blob storage.
    """
    logging.info("HTTP request received for deck refresh")
    
    try:
        logging.info("Starting deck refresh process...")
        logging.info("Fetching top clans...")

        clans = get_top_clans()
        if not clans:
            logging.warning("No clan data found. Exiting.")
            return func.HttpResponse(
                json.dumps({"error": "No clan data found"}),
                status_code=500,
                mimetype="application/json"
            )

        logging.info(f"Found {len(clans)} top clans to process")

        # Dictionary: frozenset(deck_cards) -> deck_data
        deck_dict = {}
        deck_id_counter = 1

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

                # Process player deck and update deck_dict
                deck_id_counter = process_player_deck(player_data, deck_dict, deck_id_counter)

                time.sleep(PLAYER_DELAY)

        # ---------------------------------------------------------
        # CONVERT & SORT
        # ---------------------------------------------------------
        # Convert deck_dict (frozenset keys) to list of deck dictionaries
        decks_list = list(deck_dict.values())

        sorted_decks = sorted(
            decks_list,
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
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "message": "Deck refresh completed successfully",
                "decks_uploaded": len(sorted_decks)
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"Error during deck refresh: {e}", exc_info=True)
        return func.HttpResponse(
            json.dumps({
                "success": False,
                "error": str(e)
            }),
            status_code=500,
            mimetype="application/json"
        )

