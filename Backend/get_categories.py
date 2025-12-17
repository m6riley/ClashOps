"""
Azure Function for getting categories from the database.

This function handles HTTP requests to retrieve all categories for a user
from Azure Table Storage.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.table_utils import categories_table, PARTITION_KEY
from shared.http_utils import (
    parse_json_body,
    validate_required_fields,
    create_error_response,
    create_success_response,
    build_table_query
)

# Azure Functions Blueprint
get_categories_bp = Blueprint()

# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@get_categories_bp.route(route="get_categories", auth_level=func.AuthLevel.FUNCTION)
def get_categories(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for getting all categories from the database.
    """
    logging.info("Get categories request received")
    
    # Parse and validate request body
    body, error_response = parse_json_body(req)
    if error_response:
        return error_response
    
    # Validate required fields
    error_response, fields = validate_required_fields(body, ["userID"])
    if error_response:
        return error_response
    
    user_id = fields["userID"]
    
    # Get all categories from database
    try:
        query = build_table_query(PARTITION_KEY, {"UserID": user_id})
        categories = list(categories_table.query_entities(query))
        return create_success_response(categories)
    except Exception as e:
        return create_error_response(f"Error getting categories: {e}")