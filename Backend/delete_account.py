"""
Azure Function for deleting accounts from the database.

This function handles HTTP requests to delete account entities from Azure
Table Storage. It validates input, confirms the account exists, and deletes
the account if found.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.table_utils import accounts_table, PARTITION_KEY
from shared.http_utils import (
    parse_json_body,
    validate_email,
    create_error_response,
    create_success_response,
    build_table_query
)

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
    body, error_response = parse_json_body(req)
    if error_response:
        return error_response

    email = body.get("email")

    # Validate and normalize email address
    email, error_response = validate_email(email)
    if error_response:
        return error_response

    # Check if account exists before attempting to delete
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
        
        # Account exists, get the RowKey (UserID) for deletion
        account = accounts[0]
        user_id = account.get("RowKey")
        
        if not user_id:
            return create_error_response(
                f"Account entity missing RowKey for email: {email}",
                status_code=500
            )
        
        logging.info(f"Account found for email: {email} with UserID: {user_id}. Proceeding with deletion.")
        
    except Exception as e:
        return create_error_response(f"Error checking account existence: {e}")

    # Delete the account entity
    try:
        accounts_table.delete_entity(
            partition_key=PARTITION_KEY,
            row_key=user_id
        )
        logging.info(f"Account deleted successfully for email: {email}")
        return create_success_response(message="Account deleted successfully")
    except Exception as e:
        # Check if account was already deleted (race condition)
        if "ResourceNotFound" in str(e) or "404" in str(e):
            logging.warning(f"Account not found when attempting deletion (race condition): {email}")
            # Re-query to see if account still exists
            try:
                query = build_table_query(PARTITION_KEY, {"Email": email})
                accounts = list(accounts_table.query_entities(query))
                if accounts:
                    # Account still exists but delete failed - this is a real error
                    logging.error(f"Account still exists but delete failed. UserID: {user_id}")
                    return create_error_response(
                        "Failed to delete account. Please try again.",
                        status_code=500
                    )
                else:
                    # Account was deleted (race condition)
                    logging.info(f"Account was already deleted (race condition): {email}")
                    return create_success_response(message="Account deleted successfully")
            except Exception as query_err:
                return create_error_response(f"Error re-querying account after delete failure: {query_err}")
        return create_error_response(f"Error deleting account: {e}")
