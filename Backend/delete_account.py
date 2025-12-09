"""
Azure Function for deleting accounts from the database.

This function handles HTTP requests to delete account entities from Azure
Table Storage. It validates input, confirms the account exists, and deletes
the account if found.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.tables import _accounts, PARTITION_KEY

# Azure Functions Blueprint
delete_account_bp = Blueprint()


# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@delete_account_bp.route(route="delete_account", auth_level=func.AuthLevel.FUNCTION)
def delete_account(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for deleting an account from the database.
    
    Validates the request body, confirms the account exists, and deletes
    the account entity if found.
    
    Request body should contain:
        - gmail: Gmail address (used as RowKey)
    
    Returns:
        HTTP response indicating success, account not found, or error
    """
    logging.info("Delete account request received")

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

    if not gmail:
        logging.warning("Missing gmail field in request body")
        return func.HttpResponse(
            "Missing 'gmail' field in request body",
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

    # Check if account exists before attempting to delete
    try:
        existing_account = _accounts.get_entity(
            partition_key=PARTITION_KEY,
            row_key=gmail
        )
        
        # Account exists, proceed with deletion
        logging.info(f"Account found for gmail: {gmail}. Proceeding with deletion.")
        
    except Exception:
        # Account doesn't exist
        logging.warning(f"Account not found for gmail: {gmail}")
        return func.HttpResponse(
            "Account not found",
            status_code=404,
            mimetype="text/plain"
        )

    # Delete the account entity
    try:
        _accounts.delete_entity(
            partition_key=PARTITION_KEY,
            row_key=gmail
        )
        logging.info(f"Account deleted successfully for gmail: {gmail}")
        return func.HttpResponse(
            "Account deleted successfully",
            status_code=200,
            mimetype="text/plain"
        )
    except Exception as e:
        logging.error(f"Error deleting account: {e}")
        return func.HttpResponse(
            f"Error deleting account: {e}",
            status_code=500,
            mimetype="text/plain"
        )

