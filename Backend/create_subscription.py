"""
Azure Function for creating a Stripe subscription and returning
the confirmation secret required to complete the first payment.
Compatible with Stripe 2025+ Invoice API.
"""

import json
import logging
import os

import stripe
import azure.functions as func
from azure.functions import Blueprint

from shared.table_utils import _accounts, PARTITION_KEY

# Stripe configuration
stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
PRICE_ID = os.environ["STRIPE_PRICE_ID"]

create_subscription_bp = Blueprint()


@create_subscription_bp.route(
    route="create_subscription",
    auth_level=func.AuthLevel.FUNCTION
)
def create_subscription_handler(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Create subscription request received")

    try:
        body = req.get_json()
        user_id = body.get("userId")

        if not user_id:
            return func.HttpResponse("Missing userId", status_code=400)

        # ─────────────────────────────────────────────
        # 1️⃣ Fetch user account from Azure Table Storage
        # ─────────────────────────────────────────────
        query = f"PartitionKey eq '{PARTITION_KEY}' and RowKey eq '{user_id}'"
        accounts = list(_accounts.query_entities(query))

        if not accounts:
            return func.HttpResponse("Account not found", status_code=404)

        account = accounts[0]
        email = account.get("Email")

        if not email:
            return func.HttpResponse("Account email missing", status_code=400)

        # ─────────────────────────────────────────────
        # 2️⃣ Create or reuse Stripe Customer
        # ─────────────────────────────────────────────
        customer_id = account.get("StripeCustomerID")

        if customer_id:
            customer = stripe.Customer.retrieve(customer_id)
        else:
            customer = stripe.Customer.create(email=email)
            account["StripeCustomerID"] = customer.id

        # ─────────────────────────────────────────────
        # 3️⃣ Create subscription (invoice + confirmation secret)
        # ─────────────────────────────────────────────
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": PRICE_ID}],
            payment_behavior="default_incomplete",
            collection_method="charge_automatically",
            payment_settings={
                "save_default_payment_method": "on_subscription"
            },
            expand=["latest_invoice.confirmation_secret"]
        )

        invoice = subscription.latest_invoice
        confirmation_secret = None

        if (
            invoice
            and hasattr(invoice, "confirmation_secret")
            and invoice.confirmation_secret
        ):
            confirmation_secret = invoice.confirmation_secret.client_secret

        if not confirmation_secret:
            logging.error("Confirmation secret missing for subscription %s", subscription.id)
            return func.HttpResponse(
                "Confirmation secret not created",
                status_code=500
            )

        # ─────────────────────────────────────────────
        # 4️⃣ Persist subscription state to Azure Table
        # ─────────────────────────────────────────────
        account["StripeSubscriptionID"] = subscription.id
        account["SubscriptionStatus"] = subscription.status

        # current_period_end may not exist for incomplete subscriptions
        current_period_end = getattr(subscription, 'current_period_end', None)
        if current_period_end:
            account["SubscriptionCurrentPeriodEnd"] = current_period_end

        _accounts.update_entity(account)

        # ─────────────────────────────────────────────
        # 5️⃣ Return data required by frontend only
        # ─────────────────────────────────────────────
        return func.HttpResponse(
            json.dumps({
                "customerId": customer.id,
                "subscriptionId": subscription.id,
                "clientSecret": confirmation_secret
            }),
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        logging.exception("Error creating subscription")
        return func.HttpResponse(
            str(e),
            status_code=500
        )
