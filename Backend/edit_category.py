"""
Azure Function for editing categories in the database.

This function handles HTTP requests to update category entities in Azure
Table Storage.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.table_utils import categories_table, PARTITION_KEY
from shared.http_utils import (
    parse_json_body,
    create_error_response,
    create_success_response,
    build_table_query
)

# Azure Functions Blueprint
edit_category_bp = Blueprint()

# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@edit_category_bp.route(route="edit_category", auth_level=func.AuthLevel.FUNCTION)
def edit_category(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for editing a category in the database.
    """
    logging.info("Edit category request received")

    # Parse and validate request body
    body, error_response = parse_json_body(req)
    if error_response:
        return error_response
    
    category_id = body.get("categoryID")
    category_name = body.get("categoryName")
    category_icon = body.get("categoryIcon")
    category_color = body.get("categoryColor")

    if not category_id:
        return create_error_response(
            "Missing 'categoryID' field in request body",
            status_code=400,
            log_error=False
        )
    
    # At least one field must be provided for update
    if category_name is None and category_icon is None and category_color is None:
        return create_error_response(
            "No fields provided for update",
            status_code=400,
            log_error=False
        )
    
    # Find and update category in database
    try:
        # Query for the category using RowKey
        query = build_table_query(PARTITION_KEY, {"RowKey": category_id})
        categories = list(categories_table.query_entities(query))
        
        if not categories:
            logging.warning(f"Category with ID {category_id} not found")
            return create_error_response(
                "Category not found",
                status_code=404,
                log_error=False
            )
        
        # Get the category entity
        category = categories[0]
        
        # Update the category entity with new values if provided
        if category_name is not None:
            category["CategoryName"] = category_name
        if category_icon is not None:
            category["CategoryIcon"] = category_icon
        if category_color is not None:
            category["CategoryColor"] = category_color
        
        # Update the entity in the table (using upsert to ensure all fields are preserved)
        categories_table.upsert_entity(entity=category)
        
        logging.info(f"Category {category_id} updated successfully")
        return create_success_response({
            "categoryID": category_id,
            "message": "Category updated successfully"
        })
    except Exception as e:
        return create_error_response(f"Error updating category: {e}")

