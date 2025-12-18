"""
Azure Function for renewing/reactivating a Stripe subscription.

This function reactivates a subscription that was set to cancel at period end
by setting cancel_at_period_end to False in Stripe.
"""
import logging
import json
import azure.functions as func
from azure.functions import Blueprint

from shared.stripe_utils import renew_subscription, get_subscription
from shared.table_utils import accounts_table, PARTITION_KEY
from shared.http_utils import (
    parse_json_body,
    validate_required_fields,
    create_error_response,
    create_success_response,
    build_table_query
)

# Azure Functions Blueprint
renew_subscription_bp = Blueprint()

@renew_subscription_bp.route(route="renew_subscription", auth_level=func.AuthLevel.FUNCTION)
def renew_subscription_handler(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for renewing/reactivating a Stripe subscription.
    
    Request body should contain:
        - userId: Internal user ID
    
    Returns:
        - 200: Subscription renewed (JSON with success status)
        - 400: Invalid request
        - 404: Subscription not found or not eligible for renewal
        - 500: Server error
    """
    logging.info("Renew subscription request received")

    # Parse and validate request body
    body, error_response = parse_json_body(req)
    if error_response:
        return error_response

    user_id = body.get("userId")

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
        subscription_status = account.get("SubscriptionStatus")
        
        if not subscription_id:
            logging.warning(f"No subscription found for user ID: {user_id}")
            return create_error_response(
                "No active subscription found",
                status_code=404,
                log_error=False
            )
        
        # Check if subscription is eligible for renewal (must be cancel_at_period_end)
        if subscription_status != 'cancel_at_period_end':
            logging.warning(f"Subscription {subscription_id} is not set to cancel at period end. Status: {subscription_status}")
            return create_error_response(
                f"Subscription is not eligible for renewal. Current status: {subscription_status}",
                status_code=400,
                log_error=False
            )
        
        # Get subscription from Stripe to verify it's set to cancel at period end
        subscription_before_renew = get_subscription(subscription_id)
        
        # Convert Stripe object to dictionary to check cancel_at_period_end
        try:
            if hasattr(subscription_before_renew, 'to_dict'):
                sub_dict = subscription_before_renew.to_dict()
            else:
                sub_dict = dict(subscription_before_renew)
        except Exception as e:
            logging.error(f"Error converting subscription to dict: {e}")
            sub_dict = {}
        
        # Verify subscription is set to cancel at period end
        cancel_at_period_end = sub_dict.get('cancel_at_period_end', False)
        if not cancel_at_period_end:
            logging.warning(f"Subscription {subscription_id} is not set to cancel at period end in Stripe")
            return create_error_response(
                "Subscription is not set to cancel at period end",
                status_code=400,
                log_error=False
            )
        
        # Renew/reactivate subscription in Stripe
        subscription = renew_subscription(subscription_id)
        
        # Convert renewed subscription to dict to get updated status
        try:
            if hasattr(subscription, 'to_dict'):
                renewed_sub_dict = subscription.to_dict()
            else:
                renewed_sub_dict = dict(subscription)
        except Exception as e:
            logging.warning(f"Error converting renewed subscription to dict: {e}")
            renewed_sub_dict = {}
        
        # Update account in database
        account['SubscriptionStatus'] = 'active'
        
        # Clear billing cycle end date since subscription is reactivated
        if 'SubscriptionBillingCycleEnd' in account:
            account['SubscriptionBillingCycleEnd'] = ''
        
        # Update current period end if available from renewed subscription
        current_period_end = renewed_sub_dict.get('current_period_end')
        if current_period_end:
            account['SubscriptionCurrentPeriodEnd'] = current_period_end
        
        accounts_table.update_entity(account)
        
        logging.info(f"Subscription renewed: {subscription_id} for user {user_id}")
        
        response_data = {
            "success": True,
            "message": "Subscription renewed successfully",
            "subscriptionId": subscription_id,
            "status": "active"
        }
        
        return create_success_response(response_data)
        
    except Exception as e:
        logging.error(f"Error renewing subscription: {e}")
        return create_error_response(f"Error renewing subscription: {e}")

