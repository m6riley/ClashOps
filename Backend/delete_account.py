"""
Azure Function for deleting accounts from the database.

This function handles HTTP requests to delete account entities from Azure
Table Storage. It validates input, confirms the account exists, and deletes
the account if found.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.table_utils import _accounts, PARTITION_KEY

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
        - email: Email address
    
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

    email = body.get("email")

    if not email:
        logging.warning("Missing email field in request body")
        return func.HttpResponse(
            "Missing 'email' field in request body",
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

    # Check if account exists before attempting to delete
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
        
        # Account exists, get the RowKey (UserID) for deletion
        account = accounts[0]
        user_id = account.get("RowKey")
        
        if not user_id:
            logging.error(f"Account entity missing RowKey for email: {email}")
            return func.HttpResponse(
                "Account entity is missing required fields",
                status_code=500,
                mimetype="text/plain"
            )
        
        logging.info(f"Account found for email: {email} with UserID: {user_id}. Proceeding with deletion.")
        
    except Exception as e:
        logging.error(f"Error checking account existence: {e}")
        return func.HttpResponse(
            f"Error checking account existence: {e}",
            status_code=500,
            mimetype="text/plain"
        )

    # Delete the account entity
    try:
        _accounts.delete_entity(
            partition_key=PARTITION_KEY,
            row_key=user_id
        )
        logging.info(f"Account deleted successfully for email: {email}")
        return func.HttpResponse(
            "Account deleted successfully",
            status_code=200,
            mimetype="text/plain"
        )
    except Exception as e:
        # Check if account was already deleted (race condition)
        if "ResourceNotFound" in str(e) or "404" in str(e):
            logging.warning(f"Account not found when attempting deletion (race condition): {email}")
            # Re-query to see if account still exists
            try:
                query = f"PartitionKey eq '{PARTITION_KEY}' and Email eq '{email}'"
                accounts = list(_accounts.query_entities(query))
                if accounts:
                    # Account still exists but delete failed - this is a real error
                    logging.error(f"Account still exists but delete failed. UserID: {user_id}")
                    return func.HttpResponse(
                        "Failed to delete account. Please try again.",
                        status_code=500,
                        mimetype="text/plain"
                    )
                else:
                    # Account was deleted (race condition)
                    logging.info(f"Account was already deleted (race condition): {email}")
                    return func.HttpResponse(
                        "Account deleted successfully",
                        status_code=200,
                        mimetype="text/plain"
                    )
            except Exception as query_err:
                logging.error(f"Error re-querying account after delete failure: {query_err}")
                return func.HttpResponse(
                    "Error deleting account",
                    status_code=500,
                    mimetype="text/plain"
                )
        logging.error(f"Error deleting account: {e}")
        return func.HttpResponse(
            f"Error deleting account: {e}",
            status_code=500,
            mimetype="text/plain"
        )
