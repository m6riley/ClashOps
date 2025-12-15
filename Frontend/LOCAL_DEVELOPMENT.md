# Local Development Setup

## Option 1: Use Direct Azure Function URLs (Recommended for Local Dev)

Create a local `src/config.js` file (this file is gitignored) with your actual function keys:

```javascript
// Local development config - uses direct Azure Function URLs
const BASE_URL = 'https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api';

const FUNCTION_KEYS = {
  add_account: 'YOUR_ACTUAL_KEY_HERE',
  get_account: 'YOUR_ACTUAL_KEY_HERE',
  // ... etc for all 18 functions
};

export const getFunctionUrl = (functionName) => {
  const key = FUNCTION_KEYS[functionName];
  if (!key) {
    throw new Error(`Function key not found for: ${functionName}`);
  }
  return `${BASE_URL}/${functionName}?code=${key}`;
};

// Export all the individual URL functions
export const getAddAccountUrl = () => getFunctionUrl('add_account');
export const getGetAccountUrl = () => getFunctionUrl('get_account');
// ... etc
```

This will override `config.example.js` and use direct Azure Function calls locally.

## Option 2: Use Local Pages Function Proxy

You can run the Pages Function locally using Wrangler:

```bash
cd Frontend
npx wrangler pages dev dist --local
```

Then set environment variables in a `.dev.vars` file:

```
ADD_ACCOUNT_URL=https://.../api/add_account?code=YOUR_KEY
GET_ACCOUNT_URL=https://.../api/get_account?code=YOUR_KEY
# ... etc
```

## Current Behavior

- **Local development** (`npm run dev`): Uses direct Azure Function URLs from `config.example.js` (with placeholder keys)
  - To use real keys: Create `src/config.js` with actual keys (Option 1)
  
- **Production** (Cloudflare Pages): Uses `/api` proxy which reads URLs from environment variables

## Note

The `config.example.js` file will use direct URLs in development mode, but with placeholder keys. For local development to work, you need to either:
1. Create a local `config.js` with real keys (Option 1)
2. Or use the Pages Function proxy locally (Option 2)
