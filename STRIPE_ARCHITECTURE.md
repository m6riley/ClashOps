# ClashOps Diamond Subscription - Stripe Architecture

## Overview
This document outlines the Stripe-based subscription architecture for ClashOps Diamond, ensuring secure payment processing with automatic recurring billing, card-on-file storage, and zero raw card data exposure.

## Architecture Principles
1. **No Raw Card Data**: Card information never touches our servers
2. **Secure Tokenization**: Stripe handles all PCI-sensitive data
3. **Automatic Recurring Billing**: Stripe manages subscription lifecycle
4. **Webhook-Driven Updates**: Real-time subscription status updates

## Architecture Flow

### 1. Subscription Flow (New Customer)

```
User → Frontend (Stripe Elements) → Stripe API → Backend → Database
```

**Steps:**
1. User clicks "Subscribe to ClashOps Diamond" on frontend
2. Frontend loads Stripe.js and creates Payment Element
3. User enters card details (handled by Stripe Elements - no data touches our servers)
4. Frontend creates PaymentMethod via Stripe.js
5. Frontend calls backend endpoint `/create_subscription` with PaymentMethod ID
6. Backend creates Stripe Customer (if doesn't exist) and attaches PaymentMethod
7. Backend creates Stripe Subscription with the PaymentMethod
8. Backend stores subscription status in database
9. Frontend receives confirmation and updates UI

### 2. Subscription Management Flow

```
User → Frontend → Backend → Stripe API → Webhook → Backend → Database
```

**Operations:**
- **Cancel Subscription**: Frontend calls backend → Backend cancels Stripe subscription → Webhook updates database
- **Update Payment Method**: Frontend uses Stripe Elements → Backend updates default PaymentMethod
- **Resume Subscription**: Frontend calls backend → Backend reactivates Stripe subscription → Webhook updates database

### 3. Webhook Flow (Automatic Updates)

```
Stripe → Webhook Endpoint → Backend → Database
```

**Events Handled:**
- `customer.subscription.created` - Subscription activated
- `customer.subscription.updated` - Subscription status changed
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.payment_succeeded` - Payment successful
- `invoice.payment_failed` - Payment failed
- `customer.subscription.trial_will_end` - Trial ending soon

## Components

### Frontend Components

1. **Stripe Integration**
   - Load Stripe.js from `https://js.stripe.com/v3/`
   - Initialize Stripe with publishable key
   - Use Stripe Elements (Payment Element) for card input
   - Handle payment method creation client-side

2. **Subscription UI**
   - Payment form with Stripe Elements
   - Loading states during payment processing
   - Error handling for failed payments
   - Success confirmation

### Backend Components

1. **Azure Functions**
   - `create_subscription` - Create customer and subscription
   - `cancel_subscription` - Cancel active subscription
   - `update_payment_method` - Update default payment method
   - `get_subscription_status` - Get current subscription status
   - `stripe_webhook` - Handle Stripe webhook events

2. **Database Schema**
   - Store Stripe Customer ID
   - Store Stripe Subscription ID
   - Store subscription status (active, cancelled, past_due, etc.)
   - Store next billing date
   - Store payment method last 4 digits (for display)

### Stripe Configuration

1. **Products & Prices**
   - Product: "ClashOps Diamond"
   - Price: $4.99/month (recurring)
   - Billing cycle: Monthly

2. **Webhooks**
   - Endpoint: `/api/stripe_webhook`
   - Events: All subscription and invoice events
   - Secret: Stored securely in Azure Key Vault or environment variables

## Security Considerations

1. **API Keys**
   - Publishable Key: Safe for frontend (starts with `pk_`)
   - Secret Key: Only in backend (starts with `sk_`)
   - Webhook Secret: For verifying webhook signatures

2. **Data Storage**
   - Never store card numbers, CVV, or expiration dates
   - Store only Stripe IDs (Customer ID, Subscription ID, PaymentMethod ID)
   - Store last 4 digits of card for display purposes only

3. **Webhook Security**
   - Verify webhook signatures using Stripe webhook secret
   - Idempotency: Handle duplicate webhook events
   - Retry logic: Handle failed webhook processing

## Implementation Steps

1. **Stripe Account Setup**
   - Create Stripe account
   - Create Product and Price in Stripe Dashboard
   - Configure webhook endpoint
   - Get API keys

2. **Backend Implementation**
   - Install Stripe Python SDK
   - Create Azure Functions for subscription operations
   - Implement webhook handler
   - Update database schema

3. **Frontend Implementation**
   - Integrate Stripe.js
   - Create payment form component
   - Handle subscription flow
   - Update UI based on subscription status

4. **Testing**
   - Test with Stripe test mode
   - Test webhook events
   - Test subscription lifecycle (create, cancel, resume)
   - Test payment failures

## API Endpoints

### Backend Endpoints

1. **POST /api/create_subscription**
   - Input: `{ paymentMethodId, userId }`
   - Output: `{ subscriptionId, status, clientSecret }`
   - Creates Stripe customer, attaches payment method, creates subscription

2. **POST /api/cancel_subscription**
   - Input: `{ userId }`
   - Output: `{ success, message }`
   - Cancels Stripe subscription

3. **POST /api/update_payment_method**
   - Input: `{ paymentMethodId, userId }`
   - Output: `{ success }`
   - Updates default payment method for customer

4. **GET /api/get_subscription_status**
   - Input: `{ userId }`
   - Output: `{ status, nextBillingDate, cardLast4 }`
   - Returns current subscription status

5. **POST /api/stripe_webhook**
   - Input: Stripe webhook event
   - Output: `{ received: true }`
   - Handles Stripe webhook events

## Database Schema Updates

```sql
-- Add to accounts table or create subscriptions table
ALTER TABLE accounts ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE accounts ADD COLUMN stripe_subscription_id VARCHAR(255);
ALTER TABLE accounts ADD COLUMN subscription_status VARCHAR(50);
ALTER TABLE accounts ADD COLUMN subscription_current_period_end DATETIME;
ALTER TABLE accounts ADD COLUMN payment_method_last4 VARCHAR(4);
ALTER TABLE accounts ADD COLUMN subscription_cancelled_at DATETIME;
```

## Error Handling

1. **Payment Failures**
   - Stripe automatically retries failed payments
   - Webhook notifies backend of failures
   - Frontend displays user-friendly error messages

2. **Network Errors**
   - Retry logic for API calls
   - Graceful degradation
   - User notifications

3. **Webhook Failures**
   - Stripe retries webhooks automatically
   - Log failures for manual review
   - Idempotency prevents duplicate processing

## Testing Strategy

1. **Test Mode**
   - Use Stripe test cards
   - Test various scenarios (success, decline, 3D Secure)
   - Test webhook events using Stripe CLI

2. **Test Cards**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0027 6000 3184`

## Monitoring & Analytics

1. **Stripe Dashboard**
   - Monitor subscription metrics
   - Track revenue
   - View failed payments

2. **Application Logging**
   - Log subscription events
   - Track webhook processing
   - Monitor errors

## Future Enhancements

1. **Trial Periods**: Add free trial support
2. **Coupons**: Support discount codes
3. **Upgrades/Downgrades**: Handle plan changes
4. **Usage-Based Billing**: If needed in future
5. **Multiple Payment Methods**: Allow multiple cards
6. **Invoice Management**: View/download invoices

