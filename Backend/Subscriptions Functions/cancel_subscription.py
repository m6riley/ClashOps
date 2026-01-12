"""
Azure Function for cancelling a Stripe subscription.
"""
import logging
import json
import azure.functions as func
from azure.functions import Blueprint

from shared.stripe_utils import cancel_subscription, get_subscription
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
        
        # Get subscription details first to retrieve current_period_end before canceling
        # Convert Stripe Subscription object to dictionary for easier access
        subscription_before_cancel = get_subscription(subscription_id)
        
        # Convert Stripe object to dictionary
        try:
            if hasattr(subscription_before_cancel, 'to_dict'):
                sub_dict = subscription_before_cancel.to_dict()
            else:
                # Fallback: try dict() conversion or access as dict
                try:
                    sub_dict = dict(subscription_before_cancel)
                except:
                    # If dict conversion fails, try accessing as dict-like object
                    sub_dict = subscription_before_cancel
        except Exception as e:
            logging.error(f"Error converting subscription to dict: {e}")
            sub_dict = {}
        
        # Log the full subscription dictionary for debugging
        logging.info(f"Full subscription object (as dict) for {subscription_id}: {json.dumps(sub_dict, indent=2, default=str)}")
        
        # Extract current_period_end from the dictionary
        # First try top-level, then check items.data[0] for flexible billing subscriptions
        current_period_end = None
        
        # Method 1: Check top-level dictionary
        if isinstance(sub_dict, dict):
            current_period_end = sub_dict.get('current_period_end')
            logging.info(f"current_period_end from top-level dict: {current_period_end}")
        
        # Method 2: If not found, check items.data[0].current_period_end (for flexible billing)
        if not current_period_end and isinstance(sub_dict, dict):
            items = sub_dict.get('items', {})
            if isinstance(items, dict):
                data = items.get('data', [])
                if isinstance(data, list) and len(data) > 0:
                    first_item = data[0]
                    if isinstance(first_item, dict):
                        current_period_end = first_item.get('current_period_end')
                        logging.info(f"current_period_end from items.data[0]: {current_period_end}")
        
        logging.info(f"Final current_period_end value extracted from dictionary: {current_period_end}")
        
        # Cancel subscription in Stripe
        subscription = cancel_subscription(subscription_id, cancel_at_period_end=not cancel_immediately)
        
        # Update account
        if cancel_immediately:
            account['SubscriptionStatus'] = 'cancelled'
            # Convert canceled subscription to dict to extract canceled_at
            try:
                canceled_sub_dict = subscription.to_dict() if hasattr(subscription, 'to_dict') else dict(subscription)
                canceled_at = canceled_sub_dict.get('canceled_at')
            except:
                canceled_at = getattr(subscription, 'canceled_at', None)
            if canceled_at:
                account['SubscriptionCancelledAt'] = canceled_at
            # Clear billing cycle end date if canceling immediately
            account['SubscriptionBillingCycleEnd'] = ''
        else:
            account['SubscriptionStatus'] = 'cancel_at_period_end'
            # Store the billing cycle end date (current_period_end from before canceling)
            # If not available from before cancel, try getting it from the canceled subscription dictionary
            if not current_period_end:
                try:
                    canceled_sub_dict = subscription.to_dict() if hasattr(subscription, 'to_dict') else dict(subscription)
                    # Try top-level first
                    current_period_end = canceled_sub_dict.get('current_period_end')
                    # If not found, try items.data[0]
                    if not current_period_end:
                        items = canceled_sub_dict.get('items', {})
                        if isinstance(items, dict):
                            data = items.get('data', [])
                            if isinstance(data, list) and len(data) > 0:
                                first_item = data[0]
                                if isinstance(first_item, dict):
                                    current_period_end = first_item.get('current_period_end')
                    logging.info(f"Got current_period_end from canceled subscription dict: {current_period_end}")
                except Exception as e:
                    logging.warning(f"Error extracting current_period_end from canceled subscription: {e}")
                    current_period_end = None
            
            # Store the billing cycle end date - this ensures user has access until the end of the paid period
            if current_period_end:
                # Ensure it's stored as an integer (Unix timestamp)
                account['SubscriptionBillingCycleEnd'] = int(current_period_end)
                logging.info(f"Stored billing cycle end date: {account['SubscriptionBillingCycleEnd']} for user {user_id}")
            else:
                logging.error(f"current_period_end is None for subscription {subscription_id} - billing cycle end date not stored. This will prevent proper access control.")
        
        accounts_table.update_entity(account)
        
        # Get billing cycle end date for response
        billing_cycle_end = account.get('SubscriptionBillingCycleEnd')
        
        response_data = {
            "success": True,
            "message": "Subscription cancelled successfully",
            "cancelAtPeriodEnd": not cancel_immediately,
            "billingCycleEnd": billing_cycle_end
        }
        
        logging.info(f"Subscription cancelled: {subscription_id} for user {user_id}")
        return create_success_response(response_data)
        
    except Exception as e:
        return create_error_response(f"Error cancelling subscription: {e}")

