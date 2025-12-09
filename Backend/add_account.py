"""
Azure Function for adding new accounts to the database.

This function handles HTTP requests to create new account entities in Azure
Table Storage. It validates input, checks for existing accounts, and creates
a new account if one doesn't already exist.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.tables import _accounts, PARTITION_KEY

# Azure Functions Blueprint
add_account_bp = Blueprint()


# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@add_account_bp.route(route="add_account", auth_level=func.AuthLevel.FUNCTION)
def add_account(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for adding a new account to the database.
    
    Validates the request body, checks if the account already exists, and
    creates a new account entity if one doesn't exist.
    
    Request body should contain:
        - gmail: Gmail address (used as RowKey)
        - password: Account password
    
    Returns:
        HTTP response indicating success, account already exists, or error
    """
    logging.info("Add account request received")

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

    gmail = body.get("gmail")
    password = body.get("password")

    if not gmail or not password:
        logging.warning("Missing gmail and/or password fields in request body")
        return func.HttpResponse(
            "Missing 'gmail' and/or 'password' fields in request body",
            status_code=400,
            mimetype="text/plain"
        )

    # Normalize and validate that it's a Gmail address
    gmail = gmail.strip()
    gmail_lower = gmail.lower()
    
    if not gmail_lower.endswith("@gmail.com"):
        logging.warning(f"Invalid Gmail address provided: {gmail}")
        return func.HttpResponse(
            "Invalid Gmail address. Must be a @gmail.com email address",
            status_code=400,
            mimetype="text/plain"
        )

    # Check if account already exists
    try:
        existing_account = _accounts.get_entity(
            partition_key=PARTITION_KEY,
            row_key=gmail
        )
        
        # Account exists
        logging.info(f"Account already exists for gmail: {gmail}")
        return func.HttpResponse(
            "Account already exists",
            status_code=409,  # Conflict status code
            mimetype="text/plain"
        )
    except Exception:
        # Account doesn't exist (get_entity raises exception when entity not found)
        # This is expected and we can proceed to create the account
        pass

    # Create new account entity
    entity = {
        "PartitionKey": PARTITION_KEY,
        "RowKey": gmail,
        "Password": password
    }

    try:
        _accounts.create_entity(entity)
        logging.info(f"Account added successfully for gmail: {gmail}")
        return func.HttpResponse(
            "Account added successfully",
            status_code=200,
            mimetype="text/plain"
        )
    except Exception as e:
        logging.error(f"Error adding account: {e}")
        # Check if error is due to account already existing (race condition)
        if "EntityAlreadyExists" in str(e) or "409" in str(e):
            logging.warning(f"Account already exists (race condition): {gmail}")
            return func.HttpResponse(
                "Account already exists",
                status_code=409,
                mimetype="text/plain"
            )
        return func.HttpResponse(
            f"Error adding account: {e}",
            status_code=500,
            mimetype="text/plain"
        )