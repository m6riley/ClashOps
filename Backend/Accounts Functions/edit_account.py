"""
Azure Function for editing existing accounts in the database.

This function handles HTTP requests to update account passwords in Azure
Table Storage. It validates input, confirms the account exists, and updates
the password if found.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.table_utils import accounts_table, PARTITION_KEY
from shared.http_utils import (
    parse_json_body,
    validate_email,
    validate_required_fields,
    create_error_response,
    create_success_response,
    build_table_query
)

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
    body, error_response = parse_json_body(req)
    if error_response:
        return error_response

    # Validate required fields
    error_response, fields = validate_required_fields(body, ["email", "password"])
    if error_response:
        return error_response
    
    email = fields["email"]
    password = fields["password"]

    # Validate and normalize email address
    email, error_response = validate_email(email)
    if error_response:
        return error_response

    # Check if account exists and get current entity
    try:
        query = build_table_query(PARTITION_KEY, {"Email": email})
        accounts = list(accounts_table.query_entities(query))
        
        if not accounts:
            # Account doesn't exist
            logging.warning(f"Account not found for email: {email}")
            return create_error_response(
                "Account not found",
                status_code=404,
                log_error=False
            )
        
        # Account exists, get the entity
        existing_account = accounts[0]
        logging.info(f"Account found for email: {email}. Proceeding with password update.")
        
    except Exception as e:
        return create_error_response(f"Error checking account existence: {e}")

    # Update the account password
    existing_account["Password"] = password
    
    # Get the RowKey (UserID) and PartitionKey for upsert
    user_id = existing_account.get("RowKey")
    
    if not user_id:
        return create_error_response(
            f"Account entity missing RowKey for email: {email}",
            status_code=500
        )
    
    try:
        # Use upsert to update the entity
        accounts_table.upsert_entity(entity=existing_account)
        logging.info(f"Account password updated successfully for email: {email}")
        return create_success_response(message="Account password updated successfully")
    except Exception as e:
        return create_error_response(f"Error updating account: {e}")
