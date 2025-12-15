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

Go to **Cloudflare Pages** → **Your Project** → **Settings** → **Environment Variables** and add the **full Azure Function URLs** (including the `?code=` parameter):

- `ADD_ACCOUNT_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/add_account?code=YOUR_KEY`
- `GET_ACCOUNT_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_account?code=YOUR_KEY`
- `EDIT_ACCOUNT_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/edit_account?code=YOUR_KEY`
- `DELETE_ACCOUNT_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/delete_account?code=YOUR_KEY`
- `GET_PLAYER_DECKS_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_player_decks?code=YOUR_KEY`
- `SAVE_PLAYER_DECK_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/save_player_deck?code=YOUR_KEY`
- `EDIT_PLAYER_DECK_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/edit_player_deck?code=YOUR_KEY`
- `DELETE_PLAYER_DECK_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/delete_player_deck?code=YOUR_KEY`
- `GET_CATEGORIES_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_categories?code=YOUR_KEY`
- `SAVE_CATEGORY_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/save_category?code=YOUR_KEY`
- `EDIT_CATEGORY_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/edit_category?code=YOUR_KEY`
- `DELETE_CATEGORY_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/delete_category?code=YOUR_KEY`
- `GET_FEATURES_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_features?code=YOUR_KEY`
- `GET_DECKS_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_decks?code=YOUR_KEY`
- `GET_CARDS_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_cards?code=YOUR_KEY`
- `ANALYZE_DECK_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/analyze_deck?code=YOUR_KEY`
- `CREATE_REPORT_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/create_report?code=YOUR_KEY`
- `OPTIMIZE_DECK_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/optimize_deck?code=YOUR_KEY`

**Note:** Replace `YOUR_KEY` with the actual function key from Azure Portal.

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
