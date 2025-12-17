# Stripe Configuration Quick Reference

Use this as a checklist to collect all required Stripe values.

## Values to Collect

### Product & Pricing
- [ ] **Product Name**: ClashOps Diamond
- [ ] **Price**: $4.99/month
- [ ] **Price ID (Test)**: `price__________________`
- [ ] **Price ID (Live)**: `price__________________`

### API Keys - Test Mode
- [ ] **Publishable Key**: `pk_test__________________`
- [ ] **Secret Key**: `sk_test__________________`

### API Keys - Live Mode
- [ ] **Publishable Key**: `pk_live__________________`
- [ ] **Secret Key**: `sk_live__________________`

### Webhook Secrets
- [ ] **Test Webhook Secret**: `whsec__________________`
- [ ] **Live Webhook Secret**: `whsec__________________`

### Azure Function Keys
- [ ] **create_subscription**: `_________________`
- [ ] **cancel_subscription**: `_________________`
- [ ] **get_subscription_status**: `_________________`
- [ ] **stripe_webhook**: `_________________`

---

## Where to Find Each Value

### Price ID
1. Stripe Dashboard → Products
2. Click on "ClashOps Diamond"
3. Copy the Price ID (starts with `price_`)

### API Keys
1. Stripe Dashboard → Developers → API keys
2. Toggle Test/Live mode
3. Copy Publishable key (`pk_...`)
4. Copy Secret key (`sk_...`)

### Webhook Secret
1. Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Reveal" next to Signing secret
4. Copy secret (`whsec_...`)

### Azure Function Keys
1. Azure Portal → Your Function App
2. Functions → [function name] → Function Keys
3. Copy the "default" key

---

## Environment Variables Setup

### Azure Functions (Backend)
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend (.env file)
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Frontend (config.js)
```javascript
const FUNCTION_KEYS = {
  // ... existing keys ...
  create_subscription: 'YOUR_KEY_HERE',
  cancel_subscription: 'YOUR_KEY_HERE',
  get_subscription_status: 'YOUR_KEY_HERE',
  stripe_webhook: 'YOUR_KEY_HERE'
};
```

---

## Test Cards

| Card Number | Purpose |
|-------------|---------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Declined payment |
| `4000 0027 6000 3184` | 3D Secure required |

**Expiration**: Any future date (e.g., `12/34`)  
**CVC**: Any 3 digits (e.g., `123`)

---

## Quick Test Steps

1. ✅ Set all environment variables
2. ✅ Restart Azure Functions app
3. ✅ Restart frontend dev server
4. ✅ Test subscription with card `4242 4242 4242 4242`
5. ✅ Check Stripe Dashboard for customer/subscription
6. ✅ Check database for subscription status
7. ✅ Test webhook by sending test event
8. ✅ Test cancellation flow

---

## Switching Between Test and Live Mode

### To Switch to Live Mode:
1. Update Azure: `STRIPE_SECRET_KEY` → live key
2. Update Azure: `STRIPE_PRICE_ID` → live price ID
3. Update Azure: `STRIPE_WEBHOOK_SECRET` → live webhook secret
4. Update Frontend `.env`: `REACT_APP_STRIPE_PUBLISHABLE_KEY` → live key
5. Restart both backend and frontend
6. Test with small real transaction first

### To Switch Back to Test Mode:
1. Reverse all the above steps
2. Use test keys instead of live keys

