"""
Azure Function for cancelling a Stripe subscription.
"""
import logging
import json
import azure.functions as func
from azure.functions import Blueprint

from shared.stripe_utils import cancel_subscription
from shared.table_utils import accounts_table, PARTITION_KEY
from shared.http_utils import (
    parse_json_body,
    validate_required_fields,
    create_error_response,
    create_success_response,
    build_table_query
)

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

    # Parse and validate request body
    body, error_response = parse_json_body(req)
    if error_response:
        return error_response

    user_id = body.get("userId")
    cancel_immediately = body.get("cancelImmediately", False)

    if not user_id:
        return create_error_response(
            "Missing 'userId' field",
            status_code=400,
            log_error=False
        )

    try:
        # Get user account
        query = build_table_query(PARTITION_KEY, {"RowKey": user_id})
        accounts = list(accounts_table.query_entities(query))
        
        if not accounts:
            logging.warning(f"Account not found for user ID: {user_id}")
            return create_error_response(
                "Account not found",
                status_code=404,
                log_error=False
            )
        
        account = accounts[0]
        subscription_id = account.get("StripeSubscriptionID")
        
        if not subscription_id:
            logging.warning(f"No subscription found for user ID: {user_id}")
            return create_error_response(
                "No active subscription found",
                status_code=404,
                log_error=False
            )
        
        # Cancel subscription in Stripe
        subscription = cancel_subscription(subscription_id, cancel_at_period_end=not cancel_immediately)
        
        # Update account
        account['SubscriptionStatus'] = 'cancelled' if cancel_immediately else 'cancel_at_period_end'
        if cancel_immediately:
            account['SubscriptionCancelledAt'] = subscription.canceled_at
        
        accounts_table.update_entity(account)
        
        response_data = {
            "success": True,
            "message": "Subscription cancelled successfully",
            "cancelAtPeriodEnd": not cancel_immediately
        }
        
        logging.info(f"Subscription cancelled: {subscription_id} for user {user_id}")
        return create_success_response(response_data)
        
    except Exception as e:
        return create_error_response(f"Error cancelling subscription: {e}")

