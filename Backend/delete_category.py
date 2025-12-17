"""
Azure Function for deleting categories from the database.

This function handles HTTP requests to delete category entities from Azure
Table Storage.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.table_utils import categories_table, PARTITION_KEY
from shared.http_utils import (
    parse_json_body,
    validate_required_fields,
    create_error_response,
    create_success_response
)

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
    body, error_response = parse_json_body(req)
    if error_response:
        return error_response
    
    # Validate required fields
    error_response, fields = validate_required_fields(body, ["categoryID"])
    if error_response:
        return error_response
    
    category_id = fields["categoryID"]
    
    # Delete category from database
    try:
        categories_table.delete_entity(PARTITION_KEY, category_id)
        return create_success_response(message="Category deleted successfully")
    except Exception as e:
        return create_error_response(f"Error deleting category: {e}")