"""
Azure Function for getting account information and verifying login credentials.

This function handles HTTP requests to verify account credentials and return
the account ID if the email and password match.
"""
import logging
import json
import azure.functions as func
from azure.functions import Blueprint

from shared.table_utils import _accounts, PARTITION_KEY

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

    # Query for account by email
    try:
        query = f"PartitionKey eq '{PARTITION_KEY}' and Email eq '{email}'"
        accounts = list(_accounts.query_entities(query))
        
        if not accounts:
            # Account does not exist
            logging.info(f"Account not found for email: {email}")
            return func.HttpResponse(
                "Account does not exist",
                status_code=409,  # Conflict status code
                mimetype="text/plain"
            )
        
        # Account exists, verify password
        account = accounts[0]
        stored_password = account.get("Password")
        
        if stored_password != password:
            # Password is incorrect
            logging.warning(f"Incorrect password for email: {email}")
            return func.HttpResponse(
                "Password is incorrect",
                status_code=408,  # Request Timeout (used for incorrect password)
                mimetype="text/plain"
            )
        
        # Password is correct, return account ID (RowKey) and email
        user_id = account.get("RowKey")  # UserID is stored as RowKey
        logging.info(f"Account verified successfully for email: {email}")
        return func.HttpResponse(
            json.dumps({"id": user_id, "email": email}),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"Error getting account: {e}")
        return func.HttpResponse(
            f"Error getting account: {e}",
            status_code=500,
            mimetype="text/plain"
        )
