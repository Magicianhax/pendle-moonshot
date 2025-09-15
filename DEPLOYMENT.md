# Vercel Deployment Guide

This project is now ready for deployment to Vercel. Follow these steps to deploy your Pendle Moonshot Calculator.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new one
   - Choose your Git repository
   - Confirm build settings (should auto-detect as static site)

5. **Your app will be deployed** and you'll get a URL like `https://your-project.vercel.app`

### Option 2: Deploy via Vercel Dashboard

1. **Push your code to Git repository** (GitHub, GitLab, or Bitbucket)

2. **Go to [vercel.com/dashboard](https://vercel.com/dashboard)**

3. **Click "New Project"**

4. **Import your Git repository**

5. **Configure project**:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `.` (root directory)
   - Install Command: `npm install`

6. **Click "Deploy"**

## Configuration Files

The following files have been configured for Vercel deployment:

- **`vercel.json`**: Vercel configuration with routing and caching headers
- **`package.json`**: Updated with proper build scripts
- **`.gitignore`**: Excludes unnecessary files from deployment

## Features

- ✅ Static site deployment
- ✅ Proper caching headers for assets
- ✅ SPA routing support (all routes redirect to index.html)
- ✅ Optimized for performance

## Environment Variables

No environment variables are required for this deployment as all API endpoints are public.

## Custom Domain

After deployment, you can add a custom domain in the Vercel dashboard under your project settings.

## Troubleshooting

- **Build fails**: Ensure all files are committed to Git
- **404 errors**: Check that `vercel.json` routing is correct
- **API errors**: Verify API endpoints are accessible from browser

## Local Testing

Test your deployment configuration locally:

```bash
npm run build
npm run preview
```

Your Pendle Moonshot Calculator is now ready for production deployment! 🚀
