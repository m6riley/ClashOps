"""
Azure Function for handling Stripe webhook events.
"""
import logging
import json
import os
import azure.functions as func
from azure.functions import Blueprint
import stripe

from shared.table_utils import _accounts, PARTITION_KEY

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
        return func.HttpResponse(
            "Missing stripe-signature header",
            status_code=400,
            mimetype="text/plain"
        )

    if not WEBHOOK_SECRET:
        logging.error("STRIPE_WEBHOOK_SECRET not configured")
        return func.HttpResponse(
            "Webhook secret not configured",
            status_code=500,
            mimetype="text/plain"
        )

    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, WEBHOOK_SECRET
        )
    except ValueError as e:
        logging.error(f"Invalid payload: {e}")
        return func.HttpResponse(
            "Invalid payload",
            status_code=400,
            mimetype="text/plain"
        )
    except stripe.error.SignatureVerificationError as e:
        logging.error(f"Invalid signature: {e}")
        return func.HttpResponse(
            "Invalid signature",
            status_code=400,
            mimetype="text/plain"
        )

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

        return func.HttpResponse(
            json.dumps({"received": True}),
            status_code=200,
            mimetype="application/json"
        )

    except Exception as e:
        logging.error(f"Error processing webhook: {e}")
        return func.HttpResponse(
            f"Error processing webhook: {e}",
            status_code=500,
            mimetype="text/plain"
        )


def handle_subscription_created(subscription):
    """Handle subscription.created webhook event."""
    customer_id = subscription.get('customer')
    subscription_id = subscription.get('id')
    status = subscription.get('status')
    
    logging.info(f"Subscription created: {subscription_id} for customer {customer_id}")
    
    # Find account by Stripe customer ID
    query = f"PartitionKey eq '{PARTITION_KEY}' and StripeCustomerID eq '{customer_id}'"
    accounts = list(_accounts.query_entities(query))
    
    if accounts:
        account = accounts[0]
        account['StripeSubscriptionID'] = subscription_id
        account['SubscriptionStatus'] = status
        # Azure Table Storage doesn't support None values
        current_period_end = subscription.get('current_period_end')
        if current_period_end is not None:
            account['SubscriptionCurrentPeriodEnd'] = current_period_end
        _accounts.update_entity(account)
        logging.info(f"Updated account for subscription {subscription_id}")


def handle_subscription_updated(subscription):
    """Handle subscription.updated webhook event."""
    customer_id = subscription.get('customer')
    subscription_id = subscription.get('id')
    status = subscription.get('status')
    
    logging.info(f"Subscription updated: {subscription_id} - Status: {status}")
    
    # Find account by Stripe customer ID or subscription ID
    query = f"PartitionKey eq '{PARTITION_KEY}' and (StripeCustomerID eq '{customer_id}' or StripeSubscriptionID eq '{subscription_id}')"
    accounts = list(_accounts.query_entities(query))
    
    if accounts:
        account = accounts[0]
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
        
        _accounts.update_entity(account)
        logging.info(f"Updated account for subscription {subscription_id}")


def handle_subscription_deleted(subscription):
    """Handle subscription.deleted webhook event."""
    customer_id = subscription.get('customer')
    subscription_id = subscription.get('id')
    
    logging.info(f"Subscription deleted: {subscription_id}")
    
    # Find account by Stripe customer ID or subscription ID
    query = f"PartitionKey eq '{PARTITION_KEY}' and (StripeCustomerID eq '{customer_id}' or StripeSubscriptionID eq '{subscription_id}')"
    accounts = list(_accounts.query_entities(query))
    
    if accounts:
        account = accounts[0]
        account['SubscriptionStatus'] = 'cancelled'
        
        # Update cancelled timestamp if available
        canceled_at = subscription.get('canceled_at')
        if canceled_at:
            account['SubscriptionCancelledAt'] = canceled_at
        
        _accounts.update_entity(account)
        logging.info(f"Updated account for deleted subscription {subscription_id}")


def handle_payment_succeeded(invoice):
    """Handle invoice.payment_succeeded webhook event."""
    customer_id = invoice.get('customer')
    subscription_id = invoice.get('subscription')
    
    logging.info(f"Payment succeeded for subscription: {subscription_id}")
    
    # Find account by Stripe customer ID
    query = f"PartitionKey eq '{PARTITION_KEY}' and StripeCustomerID eq '{customer_id}'"
    accounts = list(_accounts.query_entities(query))
    
    if accounts:
        account = accounts[0]
        # Update subscription status to active if payment succeeded
        if subscription_id:
            account['SubscriptionStatus'] = 'active'
            # Azure Table Storage doesn't support None values
            period_end = invoice.get('period_end')
            if period_end is not None:
                account['SubscriptionCurrentPeriodEnd'] = period_end
            _accounts.update_entity(account)
            logging.info(f"Updated account after successful payment for subscription {subscription_id}")


def handle_payment_failed(invoice):
    """Handle invoice.payment_failed webhook event."""
    customer_id = invoice.get('customer')
    subscription_id = invoice.get('subscription')
    
    logging.info(f"Payment failed for subscription: {subscription_id}")
    
    # Find account by Stripe customer ID
    query = f"PartitionKey eq '{PARTITION_KEY}' and StripeCustomerID eq '{customer_id}'"
    accounts = list(_accounts.query_entities(query))
    
    if accounts:
        account = accounts[0]
        # Update subscription status
        if subscription_id:
            account['SubscriptionStatus'] = 'past_due'
            _accounts.update_entity(account)
            logging.info(f"Updated account after failed payment for subscription {subscription_id}")

