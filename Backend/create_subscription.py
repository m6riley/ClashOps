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

from shared.table_utils import accounts_table, PARTITION_KEY
from shared.http_utils import (
    parse_json_body,
    validate_required_fields,
    create_error_response,
    create_success_response,
    build_table_query
)

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
        # Parse and validate request body
        body, error_response = parse_json_body(req)
        if error_response:
            return error_response
        
        # Validate required fields
        error_response, fields = validate_required_fields(body, ["userId"])
        if error_response:
            return error_response
        
        user_id = fields["userId"]

        # ─────────────────────────────────────────────
        # 1️⃣ Fetch user account from Azure Table Storage
        # ─────────────────────────────────────────────
        query = build_table_query(PARTITION_KEY, {"RowKey": user_id})
        accounts = list(accounts_table.query_entities(query))

        if not accounts:
            return create_error_response("Account not found", status_code=404, log_error=False)

        account = accounts[0]
        email = account.get("Email")

        if not email:
            return create_error_response("Account email missing", status_code=400, log_error=False)

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
            return create_error_response("Confirmation secret not created", status_code=500)

        # ─────────────────────────────────────────────
        # 4️⃣ Persist subscription state to Azure Table
        # ─────────────────────────────────────────────
        account["StripeSubscriptionID"] = subscription.id
        account["SubscriptionStatus"] = subscription.status

        # current_period_end may not exist for incomplete subscriptions
        current_period_end = getattr(subscription, 'current_period_end', None)
        if current_period_end:
            account["SubscriptionCurrentPeriodEnd"] = current_period_end

        accounts_table.update_entity(account)

        # ─────────────────────────────────────────────
        # 5️⃣ Return data required by frontend only
        # ─────────────────────────────────────────────
        return create_success_response({
            "customerId": customer.id,
            "subscriptionId": subscription.id,
            "clientSecret": confirmation_secret
        })

    except Exception as e:
        logging.exception("Error creating subscription")
        return create_error_response(str(e))
