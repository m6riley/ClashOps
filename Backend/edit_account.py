"""
Azure Function for editing existing accounts in the database.

This function handles HTTP requests to update account passwords in Azure
Table Storage. It validates input, confirms the account exists, and updates
the password if found.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.tables import _accounts, PARTITION_KEY

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
        - gmail: Gmail address (used as RowKey)
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

    # Check if account exists before attempting to update
    try:
        existing_account = _accounts.get_entity(
            partition_key=PARTITION_KEY,
            row_key=gmail
        )
        
        # Account exists, proceed with update
        logging.info(f"Account found for gmail: {gmail}. Proceeding with password update.")
        
    except Exception:
        # Account doesn't exist
        logging.warning(f"Account not found for gmail: {gmail}")
        return func.HttpResponse(
            "Account not found",
            status_code=404,
            mimetype="text/plain"
        )

    # Update the account password
    try:
        _accounts.update_entity(
            mode="merge",
            entity={
                "PartitionKey": PARTITION_KEY,
                "RowKey": gmail,
                "Password": password
            }
        )
        logging.info(f"Account password updated successfully for gmail: {gmail}")
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

