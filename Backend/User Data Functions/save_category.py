"""
Azure Function for saving categories to the database.

This function handles HTTP requests to create new category entities in Azure
Table Storage for organizing user decks.
"""
import logging
import uuid
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
    body, error_response = parse_json_body(req)
    if error_response:
        return error_response
    
    # Validate required fields
    error_response, fields = validate_required_fields(
        body,
        ["userID", "categoryName", "categoryIcon", "categoryColor"]
    )
    if error_response:
        return error_response
    
    category_id = str(uuid.uuid4())
    user_id = fields["userID"]
    category_name = fields["categoryName"]
    category_icon = fields["categoryIcon"]
    category_color = fields["categoryColor"]
    
    # Save category to database
    try:
        categories_table.create_entity({
            "PartitionKey": PARTITION_KEY,
            "RowKey": category_id,
            "UserID": user_id,
            "CategoryName": category_name,
            "CategoryIcon": category_icon,
            "CategoryColor": category_color,
        })
        logging.info(f"Category saved successfully for user: {user_id} with categoryID: {category_id}")
        return create_success_response({
            "categoryID": category_id,
            "message": "Category saved successfully"
        })
    except Exception as e:
        return create_error_response(f"Error saving category: {e}")