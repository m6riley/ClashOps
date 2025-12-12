"""
Azure Function for refreshing (clearing) all deck reports.

This timer-triggered function runs on the 1st of each month at midnight UTC
to delete all report entities from Azure Table Storage. This provides a
monthly reset of all analysis data.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.table_utils import _reports, PARTITION_KEY

# Azure Functions Blueprint
refresh_reports_bp = Blueprint()

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------

# Timer schedule: Runs on the 1st of each month at midnight UTC
_TIMER_SCHEDULE = "0 0 0 1 * *"

# Batch size for deletion operations
_BATCH_SIZE = 100


# ---------------------------------------------------------------------------
# Azure Function Timer Trigger
# ---------------------------------------------------------------------------

@refresh_reports_bp.timer_trigger(
    schedule=_TIMER_SCHEDULE,
    arg_name="myTimer",
    run_on_startup=False,
    use_monitor=False
)
def refresh_reports(myTimer: func.TimerRequest) -> None:
    """
    Timer-triggered Azure Function for clearing all deck reports.
    
    Deletes all report entities from Azure Table Storage in batches.
    This provides a monthly reset of all analysis data.
    
    Process:
    1. List all entities in the reports table
    2. Delete entities in batches of 100
    3. Process remaining entities if any
    
    Args:
        myTimer: Timer trigger request object
    """
    if myTimer.past_due:
        logging.warning("The timer is past due!")

    logging.info("Starting report refresh (deletion) process...")

    try:
        entities = _reports.list_entities()
        batch = []
        total_deleted = 0

        for entity in entities:
            batch.append(entity)

            # Delete in batches
            if len(batch) >= _BATCH_SIZE:
                deleted_count = _delete_batch(batch)
                total_deleted += deleted_count
                batch = []
                logging.info(f"Deleted batch: {total_deleted} total entities deleted")

        # Delete remaining entities
        if batch:
            deleted_count = _delete_batch(batch)
            total_deleted += deleted_count

        logging.info(f"Report refresh completed. Total entities deleted: {total_deleted}")

    except Exception as e:
        logging.error(f"Error during report refresh: {e}")
        raise


def _delete_batch(batch: list) -> int:
    """
    Delete a batch of entities from the reports table.
    
    Args:
        batch: List of entity dictionaries to delete
    
    Returns:
        Number of successfully deleted entities
    """
    deleted_count = 0

    for entity in batch:
        try:
            row_key = entity.get("RowKey")
            if not row_key:
                logging.warning("Entity missing RowKey, skipping")
                continue

            _reports.delete_entity(
                partition_key=PARTITION_KEY,
                row_key=row_key
            )
            deleted_count += 1

        except Exception as e:
            logging.error(f"Error deleting entity {entity.get('RowKey', 'unknown')}: {e}")

    return deleted_count