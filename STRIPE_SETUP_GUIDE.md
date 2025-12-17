# Stripe Integration Setup Guide

This guide walks you through setting up Stripe for ClashOps Diamond subscriptions.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to Azure Portal for configuring environment variables
3. Access to your Azure Functions app

## Step 1: Stripe Account Setup

### 1.1 Create Product and Price

1. Log in to your Stripe Dashboard
2. Navigate to **Products** → **Add Product**
3. Create a product:
   - **Name**: ClashOps Diamond
   - **Description**: Premium deck analysis and insights
   - **Pricing**: 
     - **Price**: $4.99
     - **Billing period**: Monthly (recurring)
   - **Currency**: USD
4. Copy the **Price ID** (starts with `price_`) - you'll need this later

### 1.2 Get API Keys

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_`)
3. Copy your **Secret key** (starts with `sk_`) - keep this secure!

### 1.3 Configure Webhook

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to:
   ```
   https://YOUR_FUNCTION_APP.azurewebsites.net/api/stripe_webhook
   ```
   Replace `YOUR_FUNCTION_APP` with your actual Azure Functions app name
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`) - you'll need this later

## Step 2: Backend Configuration

### 2.1 Install Dependencies

The Stripe Python SDK is already added to `requirements.txt`. Deploy your Azure Functions to install it:

```bash
cd Backend
func azure functionapp publish YOUR_FUNCTION_APP_NAME
```

### 2.2 Set Environment Variables

In Azure Portal:

1. Go to your Function App
2. Navigate to **Configuration** → **Application settings**
3. Add the following environment variables:

| Name | Value | Description |
|------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` | Your Stripe secret key |
| `STRIPE_PRICE_ID` | `price_...` | The Price ID from Step 1.1 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | The webhook signing secret from Step 1.3 |

**Important**: 
- Use `sk_test_...` and test webhook secret for development
- Use `sk_live_...` and live webhook secret for production
- Never commit these keys to version control!

### 2.3 Update Database Schema

You need to add subscription-related fields to your `accounts` table. The Azure Functions will handle this automatically when creating/updating subscriptions, but ensure your table allows these fields:

- `StripeCustomerID` (String)
- `StripeSubscriptionID` (String)
- `SubscriptionStatus` (String)
- `SubscriptionCurrentPeriodEnd` (DateTime)
- `PaymentMethodLast4` (String)
- `SubscriptionCancelledAt` (DateTime)

### 2.4 Get Function Keys

After deploying, get the function keys for the new Stripe endpoints:

1. In Azure Portal, go to your Function App
2. Navigate to **Functions** → Select each function → **Function Keys**
3. Copy the default function key for:
   - `create_subscription`
   - `cancel_subscription`
   - `get_subscription_status`
   - `stripe_webhook`

## Step 3: Frontend Configuration

### 3.1 Install Dependencies

```bash
cd Frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 3.2 Set Environment Variables

Create a `.env` file in the `Frontend` directory:

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Replace `pk_test_...` with your Stripe publishable key.

**For production**, set this in your hosting platform's environment variables.

### 3.3 Update config.js

Update `Frontend/src/config.js` with your function keys:

```javascript
const FUNCTION_KEYS = {
  // ... existing keys ...
  
  // Stripe subscription
  create_subscription: 'YOUR_CREATE_SUBSCRIPTION_FUNCTION_KEY',
  cancel_subscription: 'YOUR_CANCEL_SUBSCRIPTION_FUNCTION_KEY',
  get_subscription_status: 'YOUR_GET_SUBSCRIPTION_STATUS_FUNCTION_KEY',
  stripe_webhook: 'YOUR_STRIPE_WEBHOOK_FUNCTION_KEY'
};
```

### 3.4 Update SubscriptionPrompt Component

The `SubscriptionPrompt` component should call `setShowPaymentForm(true)` when the user clicks "Subscribe to ClashOps Diamond". Update `App.jsx` to handle the payment flow:

```javascript
const handleSubscribe = () => {
  if (!isLoggedIn) {
    setShowLoginPrompt(true)
    setShowSubscriptionPrompt(false)
  } else {
    setShowPaymentForm(true)
    setShowSubscriptionPrompt(false)
  }
}
```

## Step 4: Testing

### 4.1 Test Mode

Stripe provides test cards for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Use any future expiration date (e.g., `12/34`) and any 3-digit CVC.

### 4.2 Test Webhook Events

Use Stripe CLI to test webhooks locally:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to http://localhost:7071/api/stripe_webhook

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

### 4.3 Test Subscription Flow

1. Click "Subscribe to ClashOps Diamond"
2. Enter test card details
3. Verify subscription is created in Stripe Dashboard
4. Verify account is updated in your database
5. Test cancellation flow
6. Verify webhook events are received

## Step 5: Production Checklist

Before going live:

- [ ] Switch to live API keys (`sk_live_...` and `pk_live_...`)
- [ ] Update webhook endpoint to production URL
- [ ] Update `STRIPE_PRICE_ID` to live price ID
- [ ] Test with real card (use small amount first)
- [ ] Set up monitoring/alerts for failed payments
- [ ] Configure email notifications in Stripe Dashboard
- [ ] Test webhook signature verification
- [ ] Set up retry logic for failed webhook processing
- [ ] Review Stripe Dashboard for any security warnings

## Troubleshooting

### Payment Form Not Loading

- Check that `REACT_APP_STRIPE_PUBLISHABLE_KEY` is set correctly
- Verify Stripe.js is loading: Check browser console for errors
- Ensure you're using HTTPS in production (Stripe requires HTTPS)

### Subscription Creation Fails

- Check Azure Function logs for errors
- Verify `STRIPE_SECRET_KEY` is set correctly
- Verify `STRIPE_PRICE_ID` matches your Stripe product
- Check that user account exists in database

### Webhooks Not Received

- Verify webhook endpoint URL is correct
- Check webhook signature verification is working
- Ensure `STRIPE_WEBHOOK_SECRET` matches the signing secret
- Check Azure Function logs for webhook processing errors

### Database Updates Not Happening

- Verify table schema allows new fields
- Check Azure Function logs for database errors
- Ensure proper error handling in webhook handler

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Verify webhook signatures** to prevent unauthorized requests
4. **Use HTTPS** in production (required by Stripe)
5. **Implement rate limiting** on subscription endpoints
6. **Log all subscription events** for audit trail
7. **Monitor failed payments** and notify users
8. **Handle edge cases** (duplicate webhooks, race conditions)

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Azure Functions Documentation: https://docs.microsoft.com/azure/azure-functions/

