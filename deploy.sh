#!/bin/bash
set -e

# Build the frontend
echo "Building frontend..."
cd Frontend
npm install
npm run build
cd ..

# Note: For Cloudflare Pages Functions to work with environment variables,
# you should use git-based deployments (not manual wrangler deploy).
# The functions/ directory at repo root will be automatically detected.

# Copy functions directory to build output (for manual deployment only)
echo "Copying functions to build output..."
cp -r functions Frontend/dist/

# Deploy using wrangler
echo "Deploying to Cloudflare Pages..."
echo "⚠️  WARNING: Manual deployment may not enable Functions/environment variables."
echo "⚠️  Use git-based deployments in Cloudflare Pages dashboard instead."
npx wrangler pages deploy Frontend/dist --project-name=clashops
