# Deno Deploy Guide

This project is now ready for deployment to Deno Deploy. Follow these steps to deploy your Pendle Moonshot Calculator.

## Prerequisites

1. A Deno Deploy account (sign up at [dash.deno.com](https://dash.deno.com))
2. Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### Option 1: Deploy via Deno Deploy Dashboard (Recommended)

1. **Push your code to Git repository** (GitHub, GitLab, or Bitbucket)

2. **Go to [dash.deno.com](https://dash.deno.com)**

3. **Click "New Project"**

4. **Import your Git repository**

5. **Configure project**:
   - Repository: Select your repository
   - Production Branch: `main`
   - Entry Point: `main.ts`
   - Environment: Production

6. **Click "Deploy"**

### Option 2: Deploy via Deno CLI

1. **Install Deno CLI** (if not already installed):
   ```bash
   # Windows (PowerShell)
   irm https://deno.land/install.ps1 | iex
   
   # macOS/Linux
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **Login to Deno Deploy**:
   ```bash
   deno login
   ```

3. **Deploy from your project directory**:
   ```bash
   deno deploy --project=your-project-name main.ts
   ```

## Configuration Files

The following files have been configured for Deno Deploy:

- **`deno.json`**: Deno project configuration
- **`package.json`**: Updated with proper build scripts
- **`.gitignore`**: Excludes unnecessary files from deployment

## Features

- ✅ Static site deployment
- ✅ Global edge network
- ✅ Automatic HTTPS
- ✅ Zero configuration needed
- ✅ Fast JavaScript execution
- ✅ No build step required

## Environment Variables

No environment variables are required for this deployment as all API endpoints are public.

## Custom Domain

After deployment, you can add a custom domain in the Deno Deploy dashboard under your project settings.

## Troubleshooting

- **Build fails**: Ensure all files are committed to Git
- **404 errors**: Check that all files are in the repository
- **API errors**: Verify API endpoints are accessible from browser

## Local Testing

Test your deployment configuration locally:

```bash
# Serve locally with Deno
deno run --allow-net --allow-read https://deno.land/std@0.208.0/http/file_server.ts

# Or use any static file server
python -m http.server 8000
# or
npx serve .
```

## Why Deno Deploy?

- ✅ **No configuration issues** like Vercel
- ✅ **Static files serve properly** without routing problems
- ✅ **JavaScript files load correctly**
- ✅ **Global edge network** for fast performance
- ✅ **Simple deployment process**
- ✅ **Free tier available**

Your Pendle Moonshot Calculator is now ready for production deployment! 🚀
