"""
Azure Function for adding new accounts to the database.

This function handles HTTP requests to create new account entities in Azure
Table Storage. It validates input, checks for existing accounts, and creates
a new account if one doesn't already exist.
"""
import logging
import uuid
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
add_account_bp = Blueprint()


# ---------------------------------------------------------------------------
# Azure Function Route
# ---------------------------------------------------------------------------

@add_account_bp.route(route="add_account", auth_level=func.AuthLevel.FUNCTION)
def add_account(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for adding a new account to the database.
    
    Validates the request body, checks if the account already exists, and
    creates a new account entity if one doesn't exist. Each account is
    assigned a unique UUID as its UserID (RowKey).
    
    Request body should contain:
        - email: Email address
        - password: Account password
    
    Returns:
        HTTP response indicating success, account already exists, or error
    """
    logging.info("Add account request received")

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

    # Check if account already exists by querying for email
    try:
        query = build_table_query(PARTITION_KEY, {"Email": email})
        accounts = list(accounts_table.query_entities(query))
        
        if accounts:
            # Account exists
            logging.info(f"Account already exists for email: {email}")
            return create_error_response(
                "Account already exists",
                status_code=409
            )
    except Exception as e:
        return create_error_response(f"Error checking account existence: {e}")

    # Generate unique ID for the account
    user_id = str(uuid.uuid4())

    # Create new account entity
    # RowKey is the UserID (UUID), PartitionKey is "Default"
    account_entity = {
        "PartitionKey": PARTITION_KEY,
        "RowKey": user_id,
        "Email": email,
        "Password": password,
        "IsSubscribed": True  # Default to subscribed
    }

    try:
        accounts_table.create_entity(entity=account_entity)
        logging.info(f"Account added successfully for email: {email} with UserID: {user_id}")
        return create_success_response({
            "message": "Account added successfully",
            "id": user_id,
            "account_id": user_id
        })
    except Exception as e:
        # Check if it's a conflict error (account already exists)
        if "EntityAlreadyExists" in str(e) or "409" in str(e):
            logging.warning(f"Account already exists (race condition): {email}")
            return create_error_response(
                "Account already exists",
                status_code=409,
                log_error=False
            )
        return create_error_response(f"Error adding account: {e}")
