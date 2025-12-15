# Cloudflare Pages Configuration

## Option 1: Separate Build and Deploy Commands (Recommended)

In your Cloudflare Pages dashboard, configure the following:

**Build command:**
```
cd Frontend && npm install && npm run build
```

**Build output directory:**
```
Frontend/dist
```

**Deploy command:**
```
npx wrangler versions upload
```

## Option 2: Combined Build and Deploy Script

**Deploy command:**
```
./deploy.sh
```

This script will:
1. Build the frontend (install dependencies and run build)
2. Deploy using wrangler

## Environment Variables (REQUIRED for Azure Functions to work)

**You MUST set these environment variables in Cloudflare Pages** for the Azure Functions to work. 

### Where to Add Environment Variables:

1. Go to **Cloudflare Dashboard** → **Pages** → **Your Project**
2. Click **Settings**
3. Scroll down to **Environment Variables** section
4. Click **Add variable** for each one below
5. Make sure to set them for **Production** environment (or all environments)

**Important:** With the Pages Function proxy setup, these are **runtime** environment variables available to the `functions/api/[...path].js` Worker (located at repo root). This keeps your keys server-side and secure.

### Required Environment Variables:

- `ADD_ACCOUNT_KEY`
- `GET_ACCOUNT_KEY`
- `EDIT_ACCOUNT_KEY`
- `DELETE_ACCOUNT_KEY`
- `GET_PLAYER_DECKS_KEY`
- `SAVE_PLAYER_DECK_KEY`
- `EDIT_PLAYER_DECK_KEY`
- `DELETE_PLAYER_DECK_KEY`
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

The build process will automatically generate `config.js` from `config.example.js` and replace placeholders with environment variables if they're set.

## Configuration Files

- `wrangler.toml` - Configures wrangler to deploy `Frontend/dist` as static assets
- `deploy.sh` - Combined build and deploy script (Option 2)
- `Frontend/generate-config.js` - Script that creates config.js before build

## Notes

- The `wrangler.toml` file in the root directory is configured to deploy the `Frontend/dist` directory as static assets
- Make sure the build command runs before the deploy command (if using Option 1)
- The build will create the `Frontend/dist` directory with your compiled React app
- Wrangler will then upload those static assets to Cloudflare Pages
- The `prebuild` script automatically generates `config.js` from `config.example.js` before building
