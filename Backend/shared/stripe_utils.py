"""
Stripe utility functions for subscription management.
"""
import os
import logging
import stripe

# Initialize Stripe with secret key from environment variable
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

if not stripe.api_key:
    logging.warning("STRIPE_SECRET_KEY not found in environment variables")

# Stripe configuration
STRIPE_PRICE_ID = os.environ.get('STRIPE_PRICE_ID', 'price_clashops_diamond_monthly')  # Replace with actual price ID
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')

def get_or_create_customer(user_id, email):
    """
    Get existing Stripe customer or create a new one.
    
    Args:
        user_id: Internal user ID
        email: User email address
    
    Returns:
        Stripe Customer object
    """
    try:
        # Check if customer already exists (you might want to store stripe_customer_id in database)
        # For now, we'll search by email
        customers = stripe.Customer.list(email=email, limit=1)
        
        if customers.data:
            return customers.data[0]
        
        # Create new customer
        customer = stripe.Customer.create(
            email=email,
            metadata={
                'user_id': user_id,
                'clashops_user_id': user_id
            }
        )
        
        logging.info(f"Created Stripe customer {customer.id} for user {user_id}")
        return customer
        
    except stripe.error.StripeError as e:
        logging.error(f"Stripe error creating/getting customer: {e}")
        raise

def create_subscription(customer_id):
    """
    Create a Stripe subscription for a customer.
    Payment method will be collected via PaymentElement and confirmed separately.
    
    Args:
        customer_id: Stripe Customer ID
    
    Returns:
        Stripe Subscription object
    """
    try:
        # Create subscription with payment_behavior='default_incomplete'
        # This creates a PaymentIntent that can be confirmed via PaymentElement
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{
                'price': STRIPE_PRICE_ID,
            }],
            payment_behavior='default_incomplete',
            payment_settings={'save_default_payment_method': 'on_subscription'},
            expand=['latest_invoice.payment_intent'],
        )
        
        logging.info(f"Created subscription {subscription.id} for customer {customer_id}")
        return subscription
        
    except stripe.error.StripeError as e:
        logging.error(f"Stripe error creating subscription: {e}")
        raise

def cancel_subscription(subscription_id, cancel_at_period_end=True):
    """
    Cancel a Stripe subscription.
    
    Args:
        subscription_id: Stripe Subscription ID
        cancel_at_period_end: If True, cancel at end of billing period; if False, cancel immediately
    
    Returns:
        Updated Stripe Subscription object
    """
    try:
        if cancel_at_period_end:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
        else:
            subscription = stripe.Subscription.delete(subscription_id)
        
        logging.info(f"Cancelled subscription {subscription_id}")
        return subscription
        
    except stripe.error.StripeError as e:
        logging.error(f"Stripe error cancelling subscription: {e}")
        raise

def update_payment_method(customer_id, payment_method_id):
    """
    Update the default payment method for a customer.
    
    Args:
        customer_id: Stripe Customer ID
        payment_method_id: Stripe PaymentMethod ID
    
    Returns:
        Updated Stripe Customer object
    """
    try:
        # Attach payment method to customer
        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer_id,
        )
        
        # Set as default payment method
        customer = stripe.Customer.modify(
            customer_id,
            invoice_settings={
                'default_payment_method': payment_method_id,
            },
        )
        
        logging.info(f"Updated payment method for customer {customer_id}")
        return customer
        
    except stripe.error.StripeError as e:
        logging.error(f"Stripe error updating payment method: {e}")
        raise

def get_subscription(subscription_id):
    """
    Get subscription details from Stripe.
    
    Args:
        subscription_id: Stripe Subscription ID
    
    Returns:
        Stripe Subscription object
    """
    try:
        subscription = stripe.Subscription.retrieve(subscription_id)
        return subscription
    except stripe.error.StripeError as e:
        logging.error(f"Stripe error getting subscription: {e}")
        raise

def get_customer_subscriptions(customer_id):
    """
    Get all subscriptions for a customer.
    
    Args:
        customer_id: Stripe Customer ID
    
    Returns:
        List of Stripe Subscription objects
    """
    try:
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status='all',
            limit=10
        )
        return subscriptions.data
    except stripe.error.StripeError as e:
        logging.error(f"Stripe error getting customer subscriptions: {e}")
        raise

def renew_subscription(subscription_id):
    """
    Renew/reactivate a Stripe subscription that is set to cancel at period end.
    
    This sets cancel_at_period_end to False, reactivating the subscription.
    
    Args:
        subscription_id: Stripe Subscription ID
    
    Returns:
        Updated Stripe Subscription object
    """
    try:
        subscription = stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=False
        )
        
        logging.info(f"Renewed/reactivated subscription {subscription_id}")
        return subscription
        
    except stripe.error.StripeError as e:
        logging.error(f"Stripe error renewing subscription: {e}")
        raise

