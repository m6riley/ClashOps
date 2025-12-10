"""
Azure Function for editing existing accounts in the database.

This function handles HTTP requests to update account passwords in Azure
Cosmos DB. It validates input, confirms the account exists, and updates
the password if found.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.cosmos_utils import container, exceptions

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
        - email: Email address (used as document id and partition key)
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

    # Check if account exists and get current document
    try:
        existing_account = container.read_item(
            item=email,
            partition_key=email
        )
        # Account exists, proceed with update
        logging.info(f"Account found for email: {email}. Proceeding with password update.")
        
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

    # Update the account password
    existing_account["password"] = password
    
    try:
        container.replace_item(
            item=email,
            body=existing_account
        )
        logging.info(f"Account password updated successfully for email: {email}")
        return func.HttpResponse(
            "Account password updated successfully",
            status_code=200,
            mimetype="text/plain"
        )
    except exceptions.CosmosResourceNotFoundError:
        # Account was deleted between check and update (race condition)
        logging.warning(f"Account not found (race condition): {email}")
        return func.HttpResponse(
            "Account not found",
            status_code=404,
            mimetype="text/plain"
        )
    except Exception as e:
        logging.error(f"Error updating account: {e}")
        return func.HttpResponse(
            f"Error updating account: {e}",
            status_code=500,
            mimetype="text/plain"
        )

