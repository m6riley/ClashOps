# Stripe Configuration Steps for ClashOps Diamond

This guide provides exact step-by-step instructions to configure Stripe for ClashOps Diamond subscriptions.

## Prerequisites

- A Stripe account (sign up at https://stripe.com if you don't have one)
- Access to your Azure Portal for setting environment variables
- Access to your Azure Functions app

---

## Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Click **"Sign up"** in the top right
3. Enter your email address and create a password
4. Complete the account setup process
5. Verify your email address if prompted

---

## Step 2: Create Product - ClashOps Diamond

### 2.1 Navigate to Products

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. In the left sidebar, click **"Products"**
3. Click the **"+ Add product"** button (top right)

### 2.2 Configure Product Details

1. **Name**: Enter `ClashOps Diamond`
2. **Description**: Enter `Premium deck analysis and insights`
3. Leave **"Images"** empty (or add logo if desired)
4. Leave **"Metadata"** empty

### 2.3 Set Up Pricing

1. Under **"Pricing"**, select **"Recurring"**
2. **Price**: Enter `4.99`
3. **Billing period**: Select **"Monthly"**
4. **Currency**: Select **"USD"** (or your preferred currency)
5. Leave **"Trial period"** empty (unless you want to offer trials)
6. Leave **"Usage is metered"** unchecked

### 2.4 Save Product

1. Click **"Save product"** button (bottom right)
2. **IMPORTANT**: Copy the **Price ID** - it will look like `price_1ABC123xyz...`
   - You'll need this for the `STRIPE_PRICE_ID` environment variable
   - The Price ID is displayed under the product name or in the URL

---

## Step 3: Get API Keys

### 3.1 Navigate to API Keys

1. In Stripe Dashboard, click **"Developers"** in the left sidebar
2. Click **"API keys"** (under Developers)

### 3.2 Get Test Mode Keys

1. Ensure **"Test mode"** toggle is ON (top right of the page)
2. Find the **"Publishable key"** section
   - Click **"Reveal test key"** if it's hidden
   - Copy the key (starts with `pk_test_...`)
   - **Save this**: You'll need it for `REACT_APP_STRIPE_PUBLISHABLE_KEY`
3. Find the **"Secret key"** section
   - Click **"Reveal test key"** if it's hidden
   - Click **"Reveal"** and confirm if prompted
   - Copy the key (starts with `sk_test_...`)
   - **Save this**: You'll need it for `STRIPE_SECRET_KEY` (test mode)

### 3.3 Get Live Mode Keys (For Production)

1. Toggle **"Test mode"** to OFF (top right)
2. Find the **"Publishable key"** section
   - Copy the key (starts with `pk_live_...`)
   - **Save this**: For production `REACT_APP_STRIPE_PUBLISHABLE_KEY`
3. Find the **"Secret key"** section
   - Click **"Reveal live key"** and confirm
   - Copy the key (starts with `sk_live_...`)
   - **Save this**: For production `STRIPE_SECRET_KEY`

**⚠️ Security Note**: Never commit these keys to version control. Store them securely.

---

## Step 4: Set Up Webhook Endpoint

### 4.1 Navigate to Webhooks

1. In Stripe Dashboard, click **"Developers"** in the left sidebar
2. Click **"Webhooks"** (under Developers)

### 4.2 Add Webhook Endpoint

1. Click **"+ Add endpoint"** button (top right)

### 4.3 Configure Webhook Endpoint

1. **Endpoint URL**: Enter your Azure Functions webhook URL:
   ```
   https://YOUR_FUNCTION_APP_NAME.azurewebsites.net/api/stripe_webhook
   ```
   Replace `YOUR_FUNCTION_APP_NAME` with your actual Azure Functions app name
   - Example: `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/stripe_webhook`

2. **Description**: Enter `ClashOps Diamond Subscription Webhooks`

3. **Events to send**: Click **"Select events"** and choose:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   
   Or select **"Select all events"** to receive all events (recommended for development)

4. Click **"Add endpoint"**

### 4.4 Get Webhook Signing Secret

1. After creating the endpoint, click on it to view details
2. Find the **"Signing secret"** section
3. Click **"Reveal"** next to the signing secret
4. Copy the secret (starts with `whsec_...`)
   - **Save this**: You'll need it for `STRIPE_WEBHOOK_SECRET`
5. **Important**: You'll need separate webhooks for test mode and live mode
   - Create one endpoint with Test mode ON
   - Create another endpoint with Test mode OFF (for production)

---

## Step 5: Configure Azure Functions (Backend)

### 5.1 Navigate to Azure Portal

1. Go to https://portal.azure.com
2. Sign in with your Azure account
3. Navigate to your Function App

### 5.2 Set Environment Variables

1. In your Function App, click **"Configuration"** in the left sidebar
2. Click **"Application settings"** tab
3. Click **"+ New application setting"** for each variable:

#### For Test Mode:

| Name | Value | Example |
|------|-------|---------|
| `STRIPE_SECRET_KEY` | Your test secret key | `sk_test_51ABC123...` |
| `STRIPE_PRICE_ID` | Your price ID | `price_1ABC123xyz...` |
| `STRIPE_WEBHOOK_SECRET` | Your test webhook secret | `whsec_ABC123...` |

#### For Live Mode (Production):

| Name | Value | Example |
|------|-------|---------|
| `STRIPE_SECRET_KEY` | Your live secret key | `sk_live_51ABC123...` |
| `STRIPE_PRICE_ID` | Your live price ID | `price_1ABC123xyz...` |
| `STRIPE_WEBHOOK_SECRET` | Your live webhook secret | `whsec_ABC123...` |

4. Click **"Save"** after adding all variables
5. Wait for the app to restart (may take 1-2 minutes)

### 5.3 Get Function Keys

1. In your Function App, click **"Functions"** in the left sidebar
2. Click on `create_subscription`
3. Click **"Function Keys"** in the left menu
4. Copy the **"default"** key value
   - **Save this**: Update `create_subscription` key in `Frontend/src/config.js`
5. Repeat for:
   - `cancel_subscription`
   - `get_subscription_status`
   - `stripe_webhook`

---

## Step 6: Configure Frontend

### 6.1 Set Environment Variable

1. In your `Frontend` directory, create a `.env` file (if it doesn't exist)
2. Add the following line:

**For Test Mode:**
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE
```

**For Live Mode (Production):**
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE
```

3. Replace `YOUR_TEST_PUBLISHABLE_KEY_HERE` with your actual test publishable key
4. Save the file

### 6.2 Update config.js

1. Open `Frontend/src/config.js`
2. Update the function keys in `FUNCTION_KEYS` object:

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

3. Replace the placeholder values with the actual function keys from Step 5.3

### 6.3 Restart Development Server

1. Stop your development server (Ctrl+C)
2. Restart it:
   ```bash
   cd Frontend
   npm run dev
   ```

---

## Step 7: Test Mode vs Live Mode

### Test Mode

**When to Use:**
- Development and testing
- Before going to production
- Testing payment flows without real charges

**Configuration:**
- Use `pk_test_...` for frontend
- Use `sk_test_...` for backend
- Use test webhook secret
- Use test price ID (create a test product/price if needed)

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`
- Use any future expiration date (e.g., `12/34`)
- Use any 3-digit CVC

**How to Switch:**
1. In Stripe Dashboard, toggle **"Test mode"** ON/OFF (top right)
2. Update environment variables accordingly
3. Restart your application

### Live Mode

**When to Use:**
- Production environment
- Real customers
- Actual payments

**Configuration:**
- Use `pk_live_...` for frontend
- Use `sk_live_...` for backend
- Use live webhook secret
- Use live price ID

**⚠️ Important:**
- Live mode charges real credit cards
- Test thoroughly in test mode first
- Ensure all security measures are in place
- Monitor transactions closely initially

**How to Switch:**
1. Complete Stripe account verification (if not already done)
2. Update all environment variables to live keys
3. Create live webhook endpoint
4. Update frontend `.env` file
5. Restart application
6. Test with a small real transaction first

---

## Step 8: Verify Configuration

### 8.1 Test Subscription Creation

1. Start your application
2. Navigate to the subscription page
3. Click "Subscribe to ClashOps Diamond"
4. Enter test card: `4242 4242 4242 4242`
5. Use expiration: `12/34`, CVC: `123`
6. Complete the payment
7. Check Stripe Dashboard → **"Customers"** → Should see new customer
8. Check Stripe Dashboard → **"Subscriptions"** → Should see active subscription
9. Check your database → Account should have subscription status updated

### 8.2 Test Webhook

1. In Stripe Dashboard → **"Developers"** → **"Webhooks"**
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select event: `customer.subscription.created`
5. Click **"Send test webhook"**
6. Check your Azure Functions logs to verify webhook was received
7. Check your database to verify subscription was updated

### 8.3 Test Cancellation

1. In your app, go to Account page
2. Click "Cancel Subscription"
3. Check Stripe Dashboard → Subscription should show `cancel_at_period_end: true`
4. Check your database → Subscription status should be updated

---

## Quick Reference Checklist

### Test Mode Setup
- [ ] Created Stripe account
- [ ] Created "ClashOps Diamond" product
- [ ] Created monthly price ($4.99)
- [ ] Copied test publishable key (`pk_test_...`)
- [ ] Copied test secret key (`sk_test_...`)
- [ ] Created test webhook endpoint
- [ ] Copied test webhook secret (`whsec_...`)
- [ ] Set Azure environment variables (test keys)
- [ ] Updated frontend `.env` file (test publishable key)
- [ ] Updated `config.js` with function keys
- [ ] Tested subscription creation
- [ ] Tested webhook events

### Live Mode Setup (Production)
- [ ] Completed Stripe account verification
- [ ] Created live webhook endpoint
- [ ] Copied live publishable key (`pk_live_...`)
- [ ] Copied live secret key (`sk_live_...`)
- [ ] Copied live webhook secret (`whsec_...`)
- [ ] Updated Azure environment variables (live keys)
- [ ] Updated frontend `.env` file (live publishable key)
- [ ] Tested with small real transaction
- [ ] Monitored initial transactions

---

## Troubleshooting

### Issue: "Stripe publishable key not configured"
**Solution**: Ensure `.env` file exists with `REACT_APP_STRIPE_PUBLISHABLE_KEY` set

### Issue: Webhook not receiving events
**Solution**: 
- Verify webhook URL is correct
- Check webhook secret matches
- Ensure webhook endpoint is accessible (not behind firewall)
- Check Azure Functions logs for errors

### Issue: Subscription creation fails
**Solution**:
- Verify `STRIPE_SECRET_KEY` is set correctly
- Verify `STRIPE_PRICE_ID` matches your product price
- Check Azure Functions logs for detailed error messages
- Ensure user account exists in database

### Issue: Payment form shows "Payment Not Configured"
**Solution**:
- Check `.env` file has `REACT_APP_STRIPE_PUBLISHABLE_KEY`
- Restart development server after adding `.env` file
- Verify key starts with `pk_test_` or `pk_live_`

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Use test mode** for development
4. **Verify webhook signatures** (already implemented)
5. **Rotate keys** if compromised
6. **Monitor Stripe Dashboard** for suspicious activity
7. **Use HTTPS** in production (required by Stripe)
8. **Limit access** to Stripe Dashboard

---

## Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Azure Functions Docs**: https://docs.microsoft.com/azure/azure-functions/

---

## Next Steps

After completing configuration:

1. Test all subscription flows in test mode
2. Test webhook events
3. Test cancellation flow
4. Test payment failures
5. Once confident, switch to live mode
6. Monitor first few real transactions closely
7. Set up email notifications in Stripe Dashboard
8. Configure monitoring and alerts

