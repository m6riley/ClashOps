#!/bin/bash
set -e

# Build the frontend
echo "Building frontend..."
cd Frontend
npm install
npm run build
cd ..

# Deploy using wrangler
echo "Deploying to Cloudflare Pages..."
npx wrangler versions upload
