"""
Azure Function for deleting accounts from the database.

This function handles HTTP requests to delete account documents from Azure
Cosmos DB. It validates input, confirms the account exists, and deletes
the account if found.
"""
import logging
import azure.functions as func
from azure.functions import Blueprint

from shared.cosmos_utils import container, exceptions, PARTITION_KEY_FIELD

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
        - email: Email address (used as partition key; document id is a UUID)
    
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
    # Query by email (partition key) since document ID is a UUID
    try:
        query = f"SELECT * FROM c WHERE c.{PARTITION_KEY_FIELD} = @email"
        items = list(container.query_items(
            query=query,
            parameters=[{"name": "@email", "value": email}],
            enable_cross_partition_query=True
        ))
        
        if not items:
            # Account doesn't exist
            logging.warning(f"Account not found for email: {email}")
            return func.HttpResponse(
                "Account not found",
                status_code=404,
                mimetype="text/plain"
            )
        
        # Account exists, get the document ID (UUID) for deletion
        account = items[0]
        account_id = account.get("id")
        
        if not account_id:
            logging.error(f"Account document missing 'id' field for email: {email}. Document keys: {list(account.keys())}")
            return func.HttpResponse(
                "Account document is missing required fields",
                status_code=500,
                mimetype="text/plain"
            )
        
        # Log full account document for debugging (without password)
        account_debug = {k: v for k, v in account.items() if k != "password"}
        logging.info(f"Account found for email: {email}. Account data: {account_debug}")
        logging.info(f"Proceeding with deletion using ID: {account_id}, partition key: {email}")
        
    except Exception as e:
        logging.error(f"Error checking account existence: {e}")
        return func.HttpResponse(
            f"Error checking account existence: {e}",
            status_code=500,
            mimetype="text/plain"
        )

    # Delete the account document
    # Use the account document's _self link or _rid for deletion
    try:
        logging.info(f"Attempting to delete account with ID: {account_id}, partition key: {email}")
        logging.info(f"Account document keys: {list(account.keys())}")
        logging.info(f"Account _self: {account.get('_self')}")
        logging.info(f"Account _rid: {account.get('_rid')}")
        
        # Try using _self link first (most reliable)
        # When using _self, partition_key may not be needed as _self contains routing info
        if "_self" in account:
            try:
                logging.info(f"Attempting delete using _self link: {account['_self']}")
                # Try without partition_key first (since _self contains routing)
                try:
                    container.delete_item(item=account["_self"])
                    logging.info(f"Account deleted successfully using _self link (no partition key) for email: {email}")
                    return func.HttpResponse(
                        "Account deleted successfully",
                        status_code=200,
                        mimetype="text/plain"
                    )
                except Exception:
                    # If that fails, try with partition_key
                    logging.info(f"Retrying with partition key")
                    container.delete_item(
                        item=account["_self"],
                        partition_key=email
                    )
                    logging.info(f"Account deleted successfully using _self link (with partition key) for email: {email}")
                    return func.HttpResponse(
                        "Account deleted successfully",
                        status_code=200,
                        mimetype="text/plain"
                    )
            except Exception as self_err:
                logging.warning(f"Delete using _self failed: {self_err}")
        
        # Fallback: Try using _rid
        if "_rid" in account:
            try:
                logging.info(f"Attempting delete using _rid")
                container.delete_item(
                    item=account["_rid"],
                    partition_key=email
                )
                logging.info(f"Account deleted successfully using _rid for email: {email}")
                return func.HttpResponse(
                    "Account deleted successfully",
                    status_code=200,
                    mimetype="text/plain"
                )
            except Exception as rid_err:
                logging.warning(f"Delete using _rid failed: {rid_err}")
        
        # Final fallback: Use document ID
        logging.info(f"Attempting delete using document ID")
        container.delete_item(
            item=account_id,
            partition_key=email
        )
        logging.info(f"Account deleted successfully for email: {email}")
        return func.HttpResponse(
            "Account deleted successfully",
            status_code=200,
            mimetype="text/plain"
        )
    except exceptions.CosmosResourceNotFoundError as e:
        # Account was deleted between check and delete (race condition) or wrong ID/partition key
        logging.warning(f"Account not found when attempting deletion (ID: {account_id}, partition: {email}): {e}")
        # Re-query to see if account still exists
        try:
            query = f"SELECT * FROM c WHERE c.{PARTITION_KEY_FIELD} = @email"
            items = list(container.query_items(
                query=query,
                parameters=[{"name": "@email", "value": email}],
                enable_cross_partition_query=True
            ))
            if items:
                # Account still exists but delete failed - this is a real error
                logging.error(f"Account still exists but delete failed. Account ID from query: {items[0].get('id')}, ID used for delete: {account_id}")
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
    except Exception as e:
        logging.error(f"Error deleting account: {e}")
        return func.HttpResponse(
            f"Error deleting account: {e}",
            status_code=500,
            mimetype="text/plain"
        )

