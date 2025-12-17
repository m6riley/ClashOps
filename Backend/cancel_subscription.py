"""
Azure Function for cancelling a Stripe subscription.
"""
import logging
import json
import azure.functions as func
from azure.functions import Blueprint

from shared.stripe_utils import cancel_subscription
from shared.table_utils import _accounts, PARTITION_KEY

# Azure Functions Blueprint
cancel_subscription_bp = Blueprint()

@cancel_subscription_bp.route(route="cancel_subscription", auth_level=func.AuthLevel.FUNCTION)
def cancel_subscription_handler(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for cancelling a Stripe subscription.
    
    Request body should contain:
        - userId: Internal user ID
    
    Returns:
        - 200: Subscription cancelled (JSON with success status)
        - 400: Invalid request
        - 404: Subscription not found
        - 500: Server error
    """
    logging.info("Cancel subscription request received")

    try:
        body = req.get_json()
    except ValueError as e:
        logging.error(f"Invalid JSON in request: {e}")
        return func.HttpResponse(
            "Invalid JSON",
            status_code=400,
            mimetype="text/plain"
        )

    user_id = body.get("userId")
    cancel_immediately = body.get("cancelImmediately", False)

    if not user_id:
        logging.warning("Missing userId in request")
        return func.HttpResponse(
            "Missing 'userId' field",
            status_code=400,
            mimetype="text/plain"
        )

    try:
        # Get user account
        query = f"PartitionKey eq '{PARTITION_KEY}' and RowKey eq '{user_id}'"
        accounts = list(_accounts.query_entities(query))
        
        if not accounts:
            logging.warning(f"Account not found for user ID: {user_id}")
            return func.HttpResponse(
                "Account not found",
                status_code=404,
                mimetype="text/plain"
            )
        
        account = accounts[0]
        subscription_id = account.get("StripeSubscriptionID")
        
        if not subscription_id:
            logging.warning(f"No subscription found for user ID: {user_id}")
            return func.HttpResponse(
                "No active subscription found",
                status_code=404,
                mimetype="text/plain"
            )
        
        # Cancel subscription in Stripe
        subscription = cancel_subscription(subscription_id, cancel_at_period_end=not cancel_immediately)
        
        # Update account
        account['SubscriptionStatus'] = 'cancelled' if cancel_immediately else 'cancel_at_period_end'
        if cancel_immediately:
            account['SubscriptionCancelledAt'] = subscription.canceled_at
        
        _accounts.update_entity(account)
        
        response_data = {
            "success": True,
            "message": "Subscription cancelled successfully",
            "cancelAtPeriodEnd": not cancel_immediately
        }
        
        logging.info(f"Subscription cancelled: {subscription_id} for user {user_id}")
        return func.HttpResponse(
            json.dumps(response_data),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"Error cancelling subscription: {e}")
        return func.HttpResponse(
            f"Error cancelling subscription: {e}",
            status_code=500,
            mimetype="text/plain"
        )

