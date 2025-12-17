"""
Azure Function for getting subscription status.
"""
import logging
import json
import azure.functions as func
from azure.functions import Blueprint

from shared.stripe_utils import get_subscription
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
        
        if not subscription_id:
            # No subscription
            response_data = {
                "hasSubscription": False,
                "status": None
            }
            return create_success_response(response_data)
        
        # Get latest subscription status from Stripe
        subscription = get_subscription(subscription_id)
        
        # Update account with latest subscription status from Stripe
        # This ensures we have the most up-to-date status
        account['SubscriptionStatus'] = subscription.status
        if hasattr(subscription, 'current_period_end') and subscription.current_period_end:
            account['SubscriptionCurrentPeriodEnd'] = subscription.current_period_end
        
        # Update account in database
        try:
            accounts_table.update_entity(account)
        except Exception as e:
            logging.warning(f"Could not update account with latest subscription status: {e}")
            # Continue anyway - not critical for this request
        
        # Get payment method details
        payment_method_last4 = account.get("PaymentMethodLast4", "")
        
        response_data = {
            "hasSubscription": True,
            "subscriptionId": subscription.id,
            "status": subscription.status,
            "currentPeriodEnd": subscription.current_period_end if hasattr(subscription, 'current_period_end') and subscription.current_period_end else None,
            "cancelAtPeriodEnd": subscription.cancel_at_period_end if hasattr(subscription, 'cancel_at_period_end') else False,
            "paymentMethodLast4": payment_method_last4
        }
        
        logging.info(f"Retrieved subscription status for user {user_id}")
        return create_success_response(response_data)
        
    except Exception as e:
        return create_error_response(f"Error getting subscription status: {e}")

