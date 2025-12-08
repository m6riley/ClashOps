import azure.functions as func
from azure.functions import Blueprint
from shared.tables import _reports, PARTITION_KEY

create_report_bp = Blueprint()

# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------
@create_report_bp.route(route="create_report", auth_level=func.AuthLevel.FUNCTION)
def create_report(req: func.HttpRequest) -> func.HttpResponse:
    # Parse JSON safely
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse("Invalid JSON", status_code=400)

    # Extract `deck`
    deck = body.get("deck")
    if not deck:
        return func.HttpResponse("Missing 'deck' field", status_code=400)

    entity = {
        "PartitionKey": PARTITION_KEY,
        "RowKey": deck,
        "Offense": "no",
        "Defense": "no",
        "Synergy": "no",
        "Versatility": "no",
        "Optimize": "no"
    }

    # Create new entity
    try:
        _reports.create_entity(entity)
        return func.HttpResponse("Report added successfully", status_code=200)
    except Exception as e:
        return func.HttpResponse(f"Error creating report or report already exists: {e}", status_code=200)