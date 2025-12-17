"""
Azure Function for getting account information and verifying login credentials.

This function handles HTTP requests to verify account credentials and return
the account ID if the email and password match.
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
get_account_bp = Blueprint()


# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@get_account_bp.route(route="get_account", auth_level=func.AuthLevel.FUNCTION)
def get_account(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for getting account information and verifying credentials.
    
    Validates the request body, checks if the account exists, and verifies
    the password. Returns the account ID if credentials are correct.
    
    Request body should contain:
        - email: Email address
        - password: Account password
    
    Returns:
        - 200: Account ID (JSON: {"id": "...", "email": "..."})
        - 408: Password is incorrect
        - 409: Account does not exist
        - 400: Invalid request
        - 500: Server error
    """
    logging.info("Get account request received")

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

    # Query for account by email
    try:
        query = build_table_query(PARTITION_KEY, {"Email": email})
        accounts = list(accounts_table.query_entities(query))
        
        if not accounts:
            # Account does not exist
            logging.info(f"Account not found for email: {email}")
            return create_error_response(
                "Account does not exist",
                status_code=409,
                log_error=False
            )
        
        # Account exists, verify password
        account = accounts[0]
        stored_password = account.get("Password")
        
        if stored_password != password:
            # Password is incorrect
            logging.warning(f"Incorrect password for email: {email}")
            return create_error_response(
                "Password is incorrect",
                status_code=408,
                log_error=False
            )
        
        # Password is correct, return account ID (RowKey) and email
        user_id = account.get("RowKey")  # UserID is stored as RowKey
        logging.info(f"Account verified successfully for email: {email}")
        return create_success_response({"id": user_id, "email": email})
        
    except Exception as e:
        return create_error_response(f"Error getting account: {e}")
