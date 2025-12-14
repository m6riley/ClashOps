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

## Configuration Files

- `wrangler.toml` - Configures wrangler to deploy `Frontend/dist` as static assets
- `deploy.sh` - Combined build and deploy script (Option 2)

## Notes

- The `wrangler.toml` file in the root directory is configured to deploy the `Frontend/dist` directory as static assets
- Make sure the build command runs before the deploy command (if using Option 1)
- The build will create the `Frontend/dist` directory with your compiled React app
- Wrangler will then upload those static assets to Cloudflare Pages
