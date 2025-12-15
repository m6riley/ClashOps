# Configuration Setup

This project uses a configuration file to store Azure Function URLs and keys securely.

## Setup Instructions

1. **Copy the example configuration file:**
   ```bash
   cp src/config.example.js src/config.js
   ```

2. **Edit `src/config.js` and replace all placeholder values with your actual Azure Function keys:**
   - Replace `YOUR_ADD_ACCOUNT_FUNCTION_KEY` with your actual function key
   - Replace `YOUR_GET_ACCOUNT_FUNCTION_KEY` with your actual function key
   - And so on for all function keys...

3. **Important:** 
   - `config.js` is already in `.gitignore` and will NOT be committed to version control
   - `config.example.js` is a template file that IS committed (without real keys)
   - Never commit `config.js` with real function keys

## Function Keys Required

You need to provide function keys for:
- Account management: `add_account`, `get_account`, `edit_account`, `delete_account`
- Deck management: `get_player_decks`, `save_player_deck`, `edit_player_deck`, `delete_player_deck`
- Category management: `get_categories`, `save_category`, `edit_category`, `delete_category`
- Data loading: `get_features`, `get_decks`, `get_cards`
- Analysis: `analyze_deck`, `create_report`, `optimize_deck`

## Getting Your Function Keys

Function keys can be found in the Azure Portal:
1. Navigate to your Function App
2. Go to "Functions" in the left menu
3. Click on a function
4. Go to "Function Keys" tab
5. Copy the "default" key or create a new one

