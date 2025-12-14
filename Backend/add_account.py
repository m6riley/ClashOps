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

from shared.table_utils import _accounts, PARTITION_KEY

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

    # Check if account already exists by querying for email
    try:
        query = f"PartitionKey eq '{PARTITION_KEY}' and Email eq '{email}'"
        accounts = list(_accounts.query_entities(query))
        
        if accounts:
            # Account exists
            logging.info(f"Account already exists for email: {email}")
            return func.HttpResponse(
                "Account already exists",
                status_code=409,  # Conflict status code
                mimetype="text/plain"
            )
    except Exception as e:
        logging.error(f"Error checking account existence: {e}")
        return func.HttpResponse(
            f"Error checking account existence: {e}",
            status_code=500,
            mimetype="text/plain"
        )

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
        _accounts.create_entity(entity=account_entity)
        logging.info(f"Account added successfully for email: {email} with UserID: {user_id}")
        return func.HttpResponse(
            "Account added successfully",
            status_code=200,
            mimetype="text/plain"
        )
    except Exception as e:
        # Check if it's a conflict error (account already exists)
        if "EntityAlreadyExists" in str(e) or "409" in str(e):
            logging.warning(f"Account already exists (race condition): {email}")
            return func.HttpResponse(
                "Account already exists",
                status_code=409,
                mimetype="text/plain"
            )
        logging.error(f"Error adding account: {e}")
        return func.HttpResponse(
            f"Error adding account: {e}",
            status_code=500,
            mimetype="text/plain"
        )
