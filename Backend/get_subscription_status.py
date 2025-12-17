"""
Azure Function for getting subscription status.
"""
import logging
import json
import azure.functions as func
from azure.functions import Blueprint

from shared.table_utils import accounts_table, PARTITION_KEY
from shared.http_utils import (
    create_error_response,
    create_success_response,
    build_table_query
)

# Azure Functions Blueprint
get_subscription_status_bp = Blueprint()

@get_subscription_status_bp.route(route="get_subscription_status", auth_level=func.AuthLevel.FUNCTION)
def get_subscription_status_handler(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for getting subscription status.
    
    Query parameter:
        - userId: Internal user ID
    
    Returns:
        - 200: Subscription status (JSON)
        - 400: Invalid request
        - 404: Subscription not found
        - 500: Server error
    """
    logging.info("Get subscription status request received")

    user_id = req.params.get('userId')
    if not user_id:
        # Try to get from request body
        try:
            body = req.get_json()
            user_id = body.get("userId")
        except:
            pass

    if not user_id:
        logging.warning("Missing userId in request")
        return func.HttpResponse(
            "Missing 'userId' parameter",
            status_code=400,
            mimetype="text/plain"
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
        stored_status = account.get("SubscriptionStatus")
        
        logging.info(f"Account found for user {user_id}. StripeSubscriptionID: {subscription_id}, StoredStatus: {stored_status}")
        
        if not subscription_id or not stored_status:
            # No subscription
            logging.info(f"No subscription found for user {user_id} (subscription_id: {subscription_id}, status: {stored_status})")
            response_data = {
                "hasSubscription": False,
                "status": None
            }
            return create_success_response(response_data)
        
        # Return stored subscription status from database
        # Webhooks and payment confirmation already keep this field updated
        response_data = {
            "hasSubscription": True,
            "subscriptionId": subscription_id,
            "status": stored_status,
            "currentPeriodEnd": account.get("SubscriptionCurrentPeriodEnd"),
            "cancelAtPeriodEnd": stored_status == 'cancel_at_period_end',
            "paymentMethodLast4": account.get("PaymentMethodLast4", "")
        }
        
        logging.info(f"Returning stored subscription status for user {user_id}: {stored_status}")
        return create_success_response(response_data)
        
    except Exception as e:
        return create_error_response(f"Error getting subscription status: {e}")

