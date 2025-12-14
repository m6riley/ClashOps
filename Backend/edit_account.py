"""
Azure Function for editing existing accounts in the database.

This function handles HTTP requests to update account passwords in Azure
Table Storage. It validates input, confirms the account exists, and updates
the password if found.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.table_utils import _accounts, PARTITION_KEY

# Azure Functions Blueprint
edit_account_bp = Blueprint()


# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@edit_account_bp.route(route="edit_account", auth_level=func.AuthLevel.FUNCTION)
def edit_account(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for editing an existing account in the database.
    
    Validates the request body, confirms the account exists, and updates
    the password for the account.
    
    Request body should contain:
        - email: Email address
        - password: New account password
    
    Returns:
        HTTP response indicating success, account not found, or error
    """
    logging.info("Edit account request received")

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

    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        logging.warning("Missing email and/or password fields in request body")
        return func.HttpResponse(
            "Missing 'email' and/or 'password' fields in request body",
            status_code=400,
            mimetype="text/plain"
        )

    # Normalize and validate email address
    email = email.strip().lower()
    
    if not email or "@" not in email:
        logging.warning(f"Invalid email address provided: {email}")
        return func.HttpResponse(
            "Invalid email address format",
            status_code=400,
            mimetype="text/plain"
        )

    # Check if account exists and get current entity
    try:
        query = f"PartitionKey eq '{PARTITION_KEY}' and Email eq '{email}'"
        accounts = list(_accounts.query_entities(query))
        
        if not accounts:
            # Account doesn't exist
            logging.warning(f"Account not found for email: {email}")
            return func.HttpResponse(
                "Account not found",
                status_code=404,
                mimetype="text/plain"
            )
        
        # Account exists, get the entity
        existing_account = accounts[0]
        logging.info(f"Account found for email: {email}. Proceeding with password update.")
        
    except Exception as e:
        logging.error(f"Error checking account existence: {e}")
        return func.HttpResponse(
            f"Error checking account existence: {e}",
            status_code=500,
            mimetype="text/plain"
        )

    # Update the account password
    existing_account["Password"] = password
    
    # Get the RowKey (UserID) and PartitionKey for upsert
    user_id = existing_account.get("RowKey")
    
    if not user_id:
        logging.error(f"Account entity missing RowKey for email: {email}")
        return func.HttpResponse(
            "Account entity is missing required fields",
            status_code=500,
            mimetype="text/plain"
        )
    
    try:
        # Use upsert to update the entity
        _accounts.upsert_entity(entity=existing_account)
        logging.info(f"Account password updated successfully for email: {email}")
        return func.HttpResponse(
            "Account password updated successfully",
            status_code=200,
            mimetype="text/plain"
        )
    except Exception as e:
        logging.error(f"Error updating account: {e}")
        return func.HttpResponse(
            f"Error updating account: {e}",
            status_code=500,
            mimetype="text/plain"
        )
