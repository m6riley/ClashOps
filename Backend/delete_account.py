"""
Azure Function for deleting accounts from the database.

This function handles HTTP requests to delete account documents from Azure
Cosmos DB. It validates input, confirms the account exists, and deletes
the account if found.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.cosmos_utils import container, exceptions

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
    the account document if found.
    
    Request body should contain:
        - email: Email address (used as document id and partition key)
    
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
        container.read_item(
            item=email,
            partition_key=email
        )
        # Account exists, proceed with deletion
        logging.info(f"Account found for email: {email}. Proceeding with deletion.")
        
    except exceptions.CosmosResourceNotFoundError:
        # Account doesn't exist
        logging.warning(f"Account not found for email: {email}")
        return func.HttpResponse(
            "Account not found",
            status_code=404,
            mimetype="text/plain"
        )
    except Exception as e:
        logging.error(f"Error checking account existence: {e}")
        return func.HttpResponse(
            f"Error checking account existence: {e}",
            status_code=500,
            mimetype="text/plain"
        )

    # Delete the account document
    try:
        container.delete_item(
            item=email,
            partition_key=email
        )
        logging.info(f"Account deleted successfully for email: {email}")
        return func.HttpResponse(
            "Account deleted successfully",
            status_code=200,
            mimetype="text/plain"
        )
    except exceptions.CosmosResourceNotFoundError:
        # Account was deleted between check and delete (race condition)
        logging.warning(f"Account not found (race condition): {email}")
        return func.HttpResponse(
            "Account not found",
            status_code=404,
            mimetype="text/plain"
        )
    except Exception as e:
        logging.error(f"Error deleting account: {e}")
        return func.HttpResponse(
            f"Error deleting account: {e}",
            status_code=500,
            mimetype="text/plain"
        )

