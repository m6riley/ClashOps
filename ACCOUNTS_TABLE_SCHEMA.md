# Accounts Table Schema - ClashOps Diamond Subscription Fields

This document outlines the fields that must be added to the `accounts` table in Azure Table Storage for managing ClashOps Diamond subscriptions.

## Required Fields

The following fields need to be added to the `accounts` table. These fields are automatically created/updated by the Azure Functions when subscriptions are created, updated, or cancelled.

### Subscription Fields

| Field Name | Type | Description | Example | Required |
|------------|------|-------------|---------|----------|
| `StripeCustomerID` | String | Stripe Customer ID (starts with `cus_`) | `cus_ABC123xyz...` | No (created on first subscription) |
| `StripeSubscriptionID` | String | Stripe Subscription ID (starts with `sub_`) | `sub_ABC123xyz...` | No (created when subscription is created) |
| `SubscriptionStatus` | String | Current subscription status | `active`, `trialing`, `past_due`, `canceled`, `cancelled`, `cancel_at_period_end`, `unpaid` | No (defaults to null) |
| `SubscriptionCurrentPeriodEnd` | Int64/DateTime | Unix timestamp of when current billing period ends | `1735689600` | No |
| `PaymentMethodLast4` | String | Last 4 digits of payment card | `4242` | No |
| `SubscriptionCancelledAt` | Int64/DateTime | Unix timestamp of when subscription was cancelled | `1735689600` | No |

## Field Details

### StripeCustomerID
- **Purpose**: Links the account to a Stripe Customer
- **When Set**: Created when user subscribes for the first time
- **Format**: Stripe Customer ID (e.g., `cus_ABC123xyz...`)
- **Uniqueness**: One customer per account
- **Query Usage**: Used to find accounts by Stripe customer ID in webhooks

### StripeSubscriptionID
- **Purpose**: Links the account to a Stripe Subscription
- **When Set**: Created when subscription is successfully created
- **Format**: Stripe Subscription ID (e.g., `sub_ABC123xyz...`)
- **Uniqueness**: One active subscription per account (can have multiple if cancelled/resubscribed)
- **Query Usage**: Used to find accounts by subscription ID

### SubscriptionStatus
- **Purpose**: Tracks the current state of the subscription
- **Possible Values**:
  - `active` - Subscription is active and paid
  - `trialing` - Subscription is in trial period
  - `past_due` - Payment failed, subscription is past due
  - `canceled` / `cancelled` - Subscription has been cancelled
  - `cancel_at_period_end` - Subscription will cancel at end of billing period
  - `unpaid` - Subscription is unpaid
- **When Updated**: 
  - On subscription creation
  - On subscription updates (webhooks)
  - On payment success/failure (webhooks)
  - On cancellation

### SubscriptionCurrentPeriodEnd
- **Purpose**: Tracks when the current billing period ends
- **Format**: Unix timestamp (seconds since epoch)
- **When Updated**: 
  - On subscription creation
  - On subscription updates (webhooks)
  - On successful payment (webhooks)
- **Usage**: Used to display "Next billing date" to users

### PaymentMethodLast4
- **Purpose**: Stores last 4 digits of payment card for display purposes
- **Format**: 4-digit string
- **When Set**: When subscription is created or payment method is updated
- **Security**: Only stores last 4 digits, never full card number
- **Usage**: Displayed to users (e.g., "Card ending in 4242")

### SubscriptionCancelledAt
- **Purpose**: Tracks when subscription was cancelled
- **Format**: Unix timestamp (seconds since epoch)
- **When Set**: When subscription is cancelled (immediately or at period end)
- **Usage**: Used for analytics and to determine if user can resubscribe

## Azure Table Storage Notes

### Schema-less Design
Azure Table Storage is schema-less, meaning:
- Fields are automatically created when first set
- No need to pre-create columns
- Fields can be added/removed dynamically
- Missing fields return `None` when queried

### Data Types
- **Strings**: `StripeCustomerID`, `StripeSubscriptionID`, `SubscriptionStatus`, `PaymentMethodLast4`
- **Int64**: `SubscriptionCurrentPeriodEnd`, `SubscriptionCancelledAt` (Unix timestamps)
- Azure Table Storage will automatically handle type conversion

### Querying
Fields can be queried using OData filter syntax:
```python
# Find account by Stripe Customer ID
query = f"PartitionKey eq '{PARTITION_KEY}' and StripeCustomerID eq '{customer_id}'"

# Find account by Subscription ID
query = f"PartitionKey eq '{PARTITION_KEY}' and StripeSubscriptionID eq '{subscription_id}'"

# Find all active subscriptions
query = f"PartitionKey eq '{PARTITION_KEY}' and SubscriptionStatus eq 'active'"
```

## Migration Notes

### Existing Accounts
- Existing accounts will have `None` for all subscription fields
- Fields are created automatically when a user subscribes
- No migration script needed

### Backward Compatibility
- All subscription fields are optional
- Code checks for `None` before using fields
- Accounts without subscriptions will have `hasSubscription: false` in API responses

## Field Usage by Function

### create_subscription.py
Sets/Updates:
- `StripeCustomerID` - Created or retrieved
- `StripeSubscriptionID` - Created
- `SubscriptionStatus` - Set to subscription status
- `SubscriptionCurrentPeriodEnd` - Set to period end timestamp
- `PaymentMethodLast4` - Set from payment method

### cancel_subscription.py
Updates:
- `SubscriptionStatus` - Set to `cancelled` or `cancel_at_period_end`
- `SubscriptionCancelledAt` - Set if cancelled immediately

### get_subscription_status.py
Reads:
- `StripeSubscriptionID` - To fetch latest status from Stripe
- `PaymentMethodLast4` - To return in response

### stripe_webhook.py
Updates (via various handlers):
- `StripeSubscriptionID` - On subscription.created
- `SubscriptionStatus` - On all subscription events
- `SubscriptionCurrentPeriodEnd` - On subscription updates and payment success
- `SubscriptionCancelledAt` - On cancellation
- `PaymentMethodLast4` - Could be updated on payment method changes

## Example Account Entity

```python
{
    "PartitionKey": "Default",
    "RowKey": "user123",
    "Email": "user@example.com",
    "Password": "hashed_password",
    "StripeCustomerID": "cus_ABC123xyz...",
    "StripeSubscriptionID": "sub_ABC123xyz...",
    "SubscriptionStatus": "active",
    "SubscriptionCurrentPeriodEnd": 1735689600,
    "PaymentMethodLast4": "4242",
    "SubscriptionCancelledAt": None
}
```

## Testing

To verify fields are working:
1. Create a test subscription
2. Check Azure Portal → Storage Account → Tables → accounts
3. Verify all fields are set correctly
4. Test webhook events to ensure fields update properly

