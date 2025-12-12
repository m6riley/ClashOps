import logging
import azure.functions as func
from azure.functions import Blueprint
from shared.table_utils import _categories, PARTITION_KEY

# Azure Functions Blueprint
delete_category_bp = Blueprint()

# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@delete_category_bp.route(route="delete_category", auth_level=func.AuthLevel.FUNCTION)
def delete_category(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for deleting a category from the database.
    """
    logging.info("Delete category request received")
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
    categoryID = body.get("categoryID")
    if not categoryID:
        logging.warning("Missing field in request")
        return func.HttpResponse(
            "Missing field in request",
            status_code=400,
            mimetype="text/plain"
        )
    # Delete category from database
    try:
        _categories.delete_entity(PARTITION_KEY, categoryID)
    except Exception as e:
        logging.error(f"Error deleting category: {e}")
        return func.HttpResponse(
            f"Error deleting category: {e}",
            status_code=500,
            mimetype="text/plain"
        )
    return func.HttpResponse(
        "Category deleted successfully",
        status_code=200,
        mimetype="text/plain"
    )