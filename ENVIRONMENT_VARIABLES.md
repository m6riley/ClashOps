# Required Environment Variables for Cloudflare Pages

Add these environment variables in **Cloudflare Pages → Your Project → Settings → Environment Variables**.

Each variable should contain the **full Azure Function URL** including the `?code=` parameter.

## Base URL
```
https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api
```

## Environment Variables (18 total)

### Account Management (4)
- `ADD_ACCOUNT_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/add_account?code=YOUR_KEY`
- `GET_ACCOUNT_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_account?code=YOUR_KEY`
- `EDIT_ACCOUNT_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/edit_account?code=YOUR_KEY`
- `DELETE_ACCOUNT_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/delete_account?code=YOUR_KEY`

### Deck Management (4)
- `GET_PLAYER_DECKS_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_player_decks?code=YOUR_KEY`
- `SAVE_DECK_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/save_deck?code=YOUR_KEY`
- `EDIT_DECK_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/edit_deck?code=YOUR_KEY`
- `DELETE_DECK_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/delete_deck?code=YOUR_KEY`

### Category Management (4)
- `GET_CATEGORIES_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_categories?code=YOUR_KEY`
- `SAVE_CATEGORY_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/save_category?code=YOUR_KEY`
- `EDIT_CATEGORY_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/edit_category?code=YOUR_KEY`
- `DELETE_CATEGORY_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/delete_category?code=YOUR_KEY`

### Data Loading (3)
- `GET_FEATURES_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_features?code=YOUR_KEY`
- `GET_DECKS_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_decks?code=YOUR_KEY`
- `GET_CARDS_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_cards?code=YOUR_KEY`

### Analysis (3)
- `ANALYZE_DECK_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/analyze_deck?code=YOUR_KEY`
- `CREATE_REPORT_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/create_report?code=YOUR_KEY`
- `OPTIMIZE_DECK_URL` = `https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/optimize_deck?code=YOUR_KEY`

## How to Get Your Function Keys

1. Go to **Azure Portal** → **Function App** → **clashopsfunctionapp-ghhmfad4f3ctgdcs**
2. Click on each function (e.g., `add_account`)
3. Go to **Function Keys** tab
4. Copy the **default** key value
5. Replace `YOUR_KEY` in the URL above with the actual key

## Example

If your `add_account` function key is `Z7f1S2AuqLIj9H3HvicdkS351FORRERoGVx1RcvNu0TTAzFuQ0VEDg==`, then:

```
ADD_ACCOUNT_URL = https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/add_account?code=Z7f1S2AuqLIj9H3HvicdkS351FORRERoGVx1RcvNu0TTAzFuQ0VEDg==
```
