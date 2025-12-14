# Cloudflare Pages Function Proxy Setup

## Overview

This setup uses **Cloudflare Pages Functions** to proxy Azure Function requests. This approach:

✅ **Keeps function keys server-side** (not in client bundle)  
✅ **Supports environment variables** (Pages Functions can access them)  
✅ **More secure** than exposing keys in the frontend  
✅ **Standard approach** for Cloudflare Pages deployments

## How It Works

1. Frontend calls `/api/functionName` (e.g., `/api/add_account`)
2. Pages Function at `Frontend/functions/api/[...path].js` intercepts the request
3. Function reads the key from environment variables
4. Function proxies the request to Azure Functions with the key
5. Response is returned to the frontend

## Setup Steps

### 1. Environment Variables

Go to **Cloudflare Pages** → **Your Project** → **Settings** → **Environment Variables** and add:

- `ADD_ACCOUNT_KEY`
- `GET_ACCOUNT_KEY`
- `EDIT_ACCOUNT_KEY`
- `DELETE_ACCOUNT_KEY`
- `GET_PLAYER_DECKS_KEY`
- `SAVE_DECK_KEY`
- `EDIT_DECK_KEY`
- `DELETE_DECK_KEY`
- `GET_CATEGORIES_KEY`
- `SAVE_CATEGORY_KEY`
- `EDIT_CATEGORY_KEY`
- `DELETE_CATEGORY_KEY`
- `GET_FEATURES_KEY`
- `GET_DECKS_KEY`
- `GET_CARDS_KEY`
- `ANALYZE_DECK_KEY`
- `CREATE_REPORT_KEY`
- `OPTIMIZE_DECK_KEY`

**Note:** With Pages Functions, you should now be able to add environment variables. The error you saw was because static-only deployments don't support them, but Pages Functions do.

### 2. Deploy

Use the same deploy command:
```
./deploy.sh
```

Or configure in Cloudflare Pages:
- **Build command:** `cd Frontend && npm install && npm run build`
- **Build output:** `Frontend/dist`
- **Deploy command:** `npx wrangler versions upload`

## Files

- `Frontend/functions/api/[...path].js` - Pages Function that proxies requests
- `Frontend/src/config.example.js` - Updated to use `/api` proxy in production
- `wrangler.toml` - Configures static assets deployment

## Local Development

For local development, you can:
1. Use the Pages Function proxy (if using `wrangler pages dev`)
2. Or create a local `config.js` with direct Azure Function URLs for testing

## Benefits

- ✅ Keys never exposed to clients
- ✅ Environment variables work (Pages Functions support them)
- ✅ Standard Cloudflare Pages pattern
- ✅ Can add rate limiting, caching, etc. in the proxy
