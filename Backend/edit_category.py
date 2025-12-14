import logging
import json
import azure.functions as func
from azure.functions import Blueprint
from shared.table_utils import _categories, PARTITION_KEY

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
    categoryName = body.get("categoryName")
    categoryIcon = body.get("categoryIcon")
    categoryColor = body.get("categoryColor")

    if not categoryID:
        logging.warning("Missing categoryID field in request")
        return func.HttpResponse(
            "Missing 'categoryID' field in request body",
            status_code=400,
            mimetype="text/plain"
        )
    
    # At least one field must be provided for update
    if categoryName is None and categoryIcon is None and categoryColor is None:
        logging.warning("No fields provided for update in request")
        return func.HttpResponse(
            "No fields provided for update",
            status_code=400,
            mimetype="text/plain"
        )
    
    # Find and update category in database
    try:
        # Query for the category using CategoryID field (or RowKey)
        # First try to find by CategoryID (if it's stored as a field)
        query = f"PartitionKey eq '{PARTITION_KEY}' and RowKey eq '{categoryID}'"
        categories = list(_categories.query_entities(query))
        
        if not categories:
            logging.warning(f"Category with ID {categoryID} not found")
            return func.HttpResponse(
                "Category not found",
                status_code=404,
                mimetype="text/plain"
            )
        
        # Get the category entity
        category = categories[0]
        
        # Update the category entity with new values if provided
        if categoryName is not None:
            category["CategoryName"] = categoryName
        if categoryIcon is not None:
            category["CategoryIcon"] = categoryIcon
        if categoryColor is not None:
            category["CategoryColor"] = categoryColor
        
        # Update the entity in the table (using upsert to ensure all fields are preserved)
        _categories.upsert_entity(entity=category)
        
        logging.info(f"Category {categoryID} updated successfully")
        return func.HttpResponse(
            json.dumps({"categoryID": categoryID, "message": "Category updated successfully"}),
            status_code=200,
            mimetype="application/json"
        )
    except Exception as e:
        logging.error(f"Error updating category: {e}")
        return func.HttpResponse(
            f"Error updating category: {e}",
            status_code=500,
            mimetype="text/plain"
        )

