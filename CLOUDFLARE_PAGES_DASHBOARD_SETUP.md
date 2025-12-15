# Cloudflare Pages Dashboard Setup Guide

## Step-by-Step Instructions

### 1. Navigate to Your Project Settings

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click on **Workers & Pages** in the left sidebar
3. Click on your Pages project (e.g., `clashops`)

### 2. Access Build Configuration

1. Click on the **Settings** tab at the top of the page
2. Scroll down to find the **Builds & deployments** section
3. Click on **Builds & deployments** to expand it

### 3. Configure Build Settings

You'll see three fields to configure:

#### **Build command:**
```
cd Frontend && npm install && npm run build && cd .. && cp -r functions Frontend/dist/
```

#### **Build output directory:**
```
Frontend/dist
```

#### **Deploy command:**
```
echo "Deployment handled by Cloudflare Pages"
```

### 4. Save Changes

- Click **Save** or the checkmark button to save your changes
- Cloudflare Pages will automatically trigger a new deployment with these settings

## Visual Guide

The settings page should look like this:

```
┌─────────────────────────────────────────┐
│ Settings                                 │
├─────────────────────────────────────────┤
│                                         │
│  Builds & deployments                   │
│  ┌───────────────────────────────────┐ │
│  │ Build command:                    │ │
│  │ [cd Frontend && npm install...]   │ │
│  │                                   │ │
│  │ Build output directory:           │ │
│  │ [Frontend/dist              ]     │ │
│  │                                   │ │
│  │ Deploy command:                   │ │
│  │ [echo "Deployment handled..."]    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Environment Variables                  │
│  [Add variable]                         │
│                                         │
└─────────────────────────────────────────┘
```

## Important Notes

- **Build output directory** is the folder where your build command creates the final static files
- For this project, it's `Frontend/dist` because Vite builds to the `dist` folder inside the `Frontend` directory
- The path is relative to your repository root
- After saving, Cloudflare Pages will use these settings for all future deployments

## After Configuration

1. **Push your code** to trigger a new deployment:
   ```bash
   git add .
   git commit -m "Configure Cloudflare Pages build settings"
   git push
   ```

2. **Wait for deployment** to complete (check the **Deployments** tab)

3. **Verify Functions are detected**:
   - Go back to **Settings**
   - Look for a **Functions** section
   - You should see `api/[...path]` listed if Functions are detected

4. **Add environment variables**:
   - In **Settings** → **Environment Variables**
   - Click **Add variable**
   - Add each variable from `ENVIRONMENT_VARIABLES.md`
