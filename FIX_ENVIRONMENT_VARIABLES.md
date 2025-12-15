# Fix: "Variables cannot be added to a Worker that only has static assets"

## Problem

You're seeing this error because Cloudflare Pages isn't detecting your Functions, so it's treating your deployment as static-only.

## Solution: Use Git-Based Deployments

Cloudflare Pages **automatically detects** the `functions/` directory at the repo root when using **git-based deployments**. Manual deployments with `wrangler pages deploy` may not properly enable Functions.

### Steps to Fix:

1. **In Cloudflare Pages Dashboard:**
   - Go to **Settings** → **Builds & deployments**
   - Set the following:
     - **Build command:** `cd Frontend && npm install && npm run build && cd .. && cp -r functions Frontend/dist/`
     - **Build output directory:** `Frontend/dist`
     - **Deploy command:** `echo "Deployment handled by Cloudflare Pages"`

2. **Push your code to git** (if not already):
   ```bash
   git add .
   git commit -m "Add Pages Functions"
   git push
   ```

3. **Cloudflare Pages will automatically:**
   - Detect the `functions/` directory at repo root
   - Deploy it as a Pages Function
   - Enable environment variables

4. **After the deployment completes**, try adding environment variables again:
   - Go to **Settings** → **Environment Variables**
   - You should now be able to add variables

## Why This Works

- **Git-based deployments**: Cloudflare Pages scans your repo and automatically detects `functions/` at the root
- **Copying functions to build output**: Ensures functions are included even if automatic detection fails
- **Minimal deploy command**: Doesn't interfere with Cloudflare Pages' automatic deployment process
- **Manual deployments**: `wrangler pages deploy` may not properly register Functions, causing the "static assets only" error

## Verify Functions Are Detected

After deploying via git, check:
1. Go to **Settings** → **Functions**
2. You should see your function listed (e.g., `api/[...path]`)
3. If you see it, environment variables will work

## Alternative: If You Must Use Manual Deployment

If you need to use `wrangler pages deploy`, you may need to:
1. Use `wrangler pages project create` first to create the project
2. Then deploy with `--compatibility-date` and ensure Functions are included
3. But git-based is recommended and easier
