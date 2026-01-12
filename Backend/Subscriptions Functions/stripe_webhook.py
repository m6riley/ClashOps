"""
Azure Function for handling Stripe webhook events.
"""
import logging
import json
import os
import azure.functions as func
from azure.functions import Blueprint
import stripe

from shared.table_utils import accounts_table, PARTITION_KEY
from shared.http_utils import (
    create_error_response,
    create_success_response,
    build_table_query
)

# Azure Functions Blueprint
stripe_webhook_bp = Blueprint()

# Get webhook secret from environment
WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')

@stripe_webhook_bp.route(route="stripe_webhook", auth_level=func.AuthLevel.ANONYMOUS, methods=["POST"])
def stripe_webhook_handler(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP-triggered Azure Function for handling Stripe webhook events.
    
    This endpoint receives webhook events from Stripe and updates the database accordingly.
    """
    logging.info("Stripe webhook received")

    payload = req.get_body()
    sig_header = req.headers.get('stripe-signature')

    if not sig_header:
        logging.error("Missing stripe-signature header")
        return create_error_response(
            "Missing stripe-signature header",
            status_code=400
        )

    if not WEBHOOK_SECRET:
        logging.error("STRIPE_WEBHOOK_SECRET not configured")
        return create_error_response(
            "Webhook secret not configured",
            status_code=500
        )

    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, WEBHOOK_SECRET
        )
    except ValueError as e:
        logging.error(f"Invalid payload: {e}")
        return create_error_response("Invalid payload", status_code=400)
    except stripe.error.SignatureVerificationError as e:
        logging.error(f"Invalid signature: {e}")
        return create_error_response("Invalid signature", status_code=400)

    # Handle the event
    event_type = event['type']
    event_data = event['data']['object']

    logging.info(f"Processing webhook event: {event_type}")

    try:
        if event_type == 'customer.subscription.created':
            handle_subscription_created(event_data)
        elif event_type == 'customer.subscription.updated':
            handle_subscription_updated(event_data)
        elif event_type == 'customer.subscription.deleted':
            handle_subscription_deleted(event_data)
        elif event_type == 'invoice.payment_succeeded':
            handle_payment_succeeded(event_data)
        elif event_type == 'invoice.payment_failed':
            handle_payment_failed(event_data)
        else:
            logging.info(f"Unhandled event type: {event_type}")

        return create_success_response({"received": True})

    except Exception as e:
        return create_error_response(f"Error processing webhook: {e}")


def handle_subscription_created(subscription):
    """Handle subscription.created webhook event."""
    customer_id = subscription.get('customer')
    subscription_id = subscription.get('id')
    status = subscription.get('status')
    
    logging.info(f"Subscription created: {subscription_id} for customer {customer_id}")
    
    # Find account by Stripe customer ID
    query = build_table_query(PARTITION_KEY, {"StripeCustomerID": customer_id})
    accounts = list(accounts_table.query_entities(query))
    
    if accounts:
        account = accounts[0]
        account['StripeSubscriptionID'] = subscription_id
        account['SubscriptionStatus'] = status
        # Azure Table Storage doesn't support None values
        current_period_end = subscription.get('current_period_end')
        if current_period_end is not None:
            account['SubscriptionCurrentPeriodEnd'] = current_period_end
        accounts_table.update_entity(account)
        logging.info(f"Updated account for subscription {subscription_id}")


def handle_subscription_updated(subscription):
    """Handle subscription.updated webhook event."""
    customer_id = subscription.get('customer')
    subscription_id = subscription.get('id')
    status = subscription.get('status')
    
    logging.info(f"Subscription updated: {subscription_id} - Status: {status}")
    
    # Find account by Stripe customer ID or subscription ID
    # Note: Azure Table Storage doesn't support OR queries, so we need to query separately
    accounts = []
    
    # Try to find by customer ID first
    query_customer = build_table_query(PARTITION_KEY, {"StripeCustomerID": customer_id})
    accounts_by_customer = list(accounts_table.query_entities(query_customer))
    
    if accounts_by_customer:
        accounts = accounts_by_customer
        logging.info(f"Found account by customer ID: {customer_id}")
    else:
        # If not found by customer ID, try subscription ID
        query_subscription = build_table_query(PARTITION_KEY, {"StripeSubscriptionID": subscription_id})
        accounts_by_subscription = list(accounts_table.query_entities(query_subscription))
        accounts = accounts_by_subscription
        if accounts_by_subscription:
            logging.info(f"Found account by subscription ID: {subscription_id}")
    
    if accounts:
        account = accounts[0]
        # Ensure StripeSubscriptionID is set
        if not account.get('StripeSubscriptionID'):
            account['StripeSubscriptionID'] = subscription_id
            logging.info(f"Setting StripeSubscriptionID for account: {subscription_id}")
        
        account['SubscriptionStatus'] = status
        
        # Update period end if available
        current_period_end = subscription.get('current_period_end')
        if current_period_end:
            account['SubscriptionCurrentPeriodEnd'] = current_period_end
        
        # Update cancelled timestamp if available
        canceled_at = subscription.get('canceled_at')
        if canceled_at:
            account['SubscriptionCancelledAt'] = canceled_at
        
        # Handle cancel_at_period_end status
        if status == 'active' and subscription.get('cancel_at_period_end'):
            account['SubscriptionStatus'] = 'cancel_at_period_end'
            # Store billing cycle end date when subscription is set to cancel at period end
            if current_period_end:
                account['SubscriptionBillingCycleEnd'] = current_period_end
                logging.info(f"Stored billing cycle end date: {current_period_end} for subscription {subscription_id}")
        
        try:
            accounts_table.update_entity(account)
            logging.info(f"Successfully updated account for subscription {subscription_id} with status {status}")
        except Exception as e:
            logging.error(f"Failed to update account for subscription updated: {e}")
    else:
        logging.warning(f"No account found for customer ID: {customer_id} or subscription ID: {subscription_id}")


def handle_subscription_deleted(subscription):
    """Handle subscription.deleted webhook event."""
    customer_id = subscription.get('customer')
    subscription_id = subscription.get('id')
    
    logging.info(f"Subscription deleted: {subscription_id}")
    
    # Find account by Stripe customer ID or subscription ID
    # Note: Azure Table Storage doesn't support OR queries, so we need to query separately
    accounts = []
    
    # Try to find by customer ID first
    query_customer = build_table_query(PARTITION_KEY, {"StripeCustomerID": customer_id})
    accounts_by_customer = list(accounts_table.query_entities(query_customer))
    
    if accounts_by_customer:
        accounts = accounts_by_customer
    else:
        # If not found by customer ID, try subscription ID
        query_subscription = build_table_query(PARTITION_KEY, {"StripeSubscriptionID": subscription_id})
        accounts_by_subscription = list(accounts_table.query_entities(query_subscription))
        accounts = accounts_by_subscription
    
    if accounts:
        account = accounts[0]
        account['SubscriptionStatus'] = 'cancelled'
        
        # Update cancelled timestamp if available
        canceled_at = subscription.get('canceled_at')
        if canceled_at:
            account['SubscriptionCancelledAt'] = canceled_at
        
        accounts_table.update_entity(account)
        logging.info(f"Updated account for deleted subscription {subscription_id}")


def handle_payment_succeeded(invoice):
    """Handle invoice.payment_succeeded webhook event."""
    customer_id = invoice.get('customer')
    subscription_id = invoice.get('subscription')
    
    logging.info(f"Payment succeeded for subscription: {subscription_id}, customer: {customer_id}")
    
    # Find account by Stripe customer ID
    query = build_table_query(PARTITION_KEY, {"StripeCustomerID": customer_id})
    accounts = list(accounts_table.query_entities(query))
    
    if accounts:
        account = accounts[0]
        # Update subscription status to active if payment succeeded
        if subscription_id:
            # Ensure StripeSubscriptionID is set if not already set
            if not account.get('StripeSubscriptionID'):
                account['StripeSubscriptionID'] = subscription_id
                logging.info(f"Setting StripeSubscriptionID for account: {subscription_id}")
            
            account['SubscriptionStatus'] = 'active'
            # Azure Table Storage doesn't support None values
            period_end = invoice.get('period_end')
            if period_end is not None:
                account['SubscriptionCurrentPeriodEnd'] = period_end
            
            try:
                accounts_table.update_entity(account)
                logging.info(f"Successfully updated account after successful payment for subscription {subscription_id}")
            except Exception as e:
                logging.error(f"Failed to update account after payment succeeded: {e}")
    else:
        logging.warning(f"No account found for customer ID: {customer_id}")


def handle_payment_failed(invoice):
    """Handle invoice.payment_failed webhook event."""
    customer_id = invoice.get('customer')
    subscription_id = invoice.get('subscription')
    
    logging.info(f"Payment failed for subscription: {subscription_id}")
    
    # Find account by Stripe customer ID
    query = build_table_query(PARTITION_KEY, {"StripeCustomerID": customer_id})
    accounts = list(accounts_table.query_entities(query))
    
    if accounts:
        account = accounts[0]
        # Update subscription status
        if subscription_id:
            account['SubscriptionStatus'] = 'past_due'
            accounts_table.update_entity(account)
            logging.info(f"Updated account after failed payment for subscription {subscription_id}")

