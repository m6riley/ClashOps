"""
Azure Function for getting account information and verifying login credentials.

This function handles HTTP requests to verify account credentials and return
the account ID if the email and password match.
"""
import logging
import json
import azure.functions as func
from azure.functions import Blueprint

from shared.cosmos_utils import container, exceptions, PARTITION_KEY_FIELD

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
        - email: Email address (used as partition key)
        - password: Account password
    
    Returns:
        - 200: Account ID (JSON: {"account_id": "..."})
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
        query = f"SELECT * FROM c WHERE c.{PARTITION_KEY_FIELD} = @email"
        items = list(container.query_items(
            query=query,
            parameters=[{"name": "@email", "value": email}],
            enable_cross_partition_query=True
        ))
        
        if not items:
            # Account does not exist
            logging.info(f"Account not found for email: {email}")
            return func.HttpResponse(
                "Account does not exist",
                status_code=409,  # Conflict status code
                mimetype="text/plain"
            )
        
        # Account exists, verify password
        account = items[0]
        stored_password = account.get("password")
        
        if stored_password != password:
            # Password is incorrect
            logging.warning(f"Incorrect password for email: {email}")
            return func.HttpResponse(
                "Password is incorrect",
                status_code=408,  # Request Timeout (used for incorrect password)
                mimetype="text/plain"
            )
        
        # Password is correct, return account ID
        account_id = account.get("id")
        logging.info(f"Account verified successfully for email: {email}")
        return func.HttpResponse(
            json.dumps({"account_id": account_id}),
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

