import azure.functions as func
from azure.functions import Blueprint
from shared.tables import _reports, PARTITION_KEY
import logging

refresh_reports_bp = Blueprint()



@refresh_reports_bp.timer_trigger(schedule="0 0 0 1 * *", arg_name="myTimer", run_on_startup=False,
              use_monitor=False) 
def refresh_reports(myTimer: func.TimerRequest) -> None:
    if myTimer.past_due:
        logging.info('The timer is past due!')

    entities = _reports.list_entities()
    batch = []
    for entity in entities:
        batch.append("delete", entity)
        if len(batch) == 100:
            for ent in batch:
                _reports.delete_entity(partition_key=PARTITION_KEY, row_key=ent["RowKey"])

            batch = []
    if batch:
        for ent in batch:
            _reports.delete_entity(partition_key=PARTITION_KEY, row_key=ent["RowKey"])
    
    print("All reports deleted")