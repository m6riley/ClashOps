import logging
import azure.functions as func
from azure.functions import Blueprint
from shared.table_utils import _categories, PARTITION_KEY
import uuid

# Azure Functions Blueprint
save_category_bp = Blueprint()

# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@save_category_bp.route(route="save_category", auth_level=func.AuthLevel.FUNCTION)
def save_category(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for saving a category to the database.
    """
    logging.info("Save category request received")
    # Parse and validate request body
    try:
        body = req.get_json()
    except ValueError as e:
        logging.error(f"Invalid JSON in request: {e}")
        return func.HttpResponse(
            "Invalid JSON",
            status_code=400,
            mimetype="text/plain"
        )
    categoryID = str(uuid.uuid4())
    userID = body.get("userID")
    categoryName = body.get("categoryName")
    categoryIcon = body.get("categoryIcon")
    categoryColor = body.get("categoryColor")
    if not userID or not categoryName or not categoryIcon or not categoryColor:
        logging.warning("Missing field in request")
        return func.HttpResponse(
            "Missing field in request",
            status_code=400,
            mimetype="text/plain"
        )
    # Save category to database
    try:
        _categories.create_entity({
            "PartitionKey": PARTITION_KEY,
            "RowKey": categoryID,
            "UserID": userID,
            "CategoryName": categoryName,
            "CategoryIcon": categoryIcon,
            "CategoryColor": categoryColor,
        })
    except Exception as e:
        logging.error(f"Error saving category: {e}")
        return func.HttpResponse(
            f"Error saving category: {e}",
            status_code=500,
            mimetype="text/plain"
        )
    return func.HttpResponse(
        "Category saved successfully",
        status_code=200,
        mimetype="text/plain"
    )