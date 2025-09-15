# Netlify Deployment Guide

This project is now ready for deployment to Netlify. Follow these steps to deploy your Pendle Moonshot Calculator.

## Prerequisites

1. A Netlify account (sign up at [netlify.com](https://netlify.com))
2. Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Push your code to Git repository** (GitHub, GitLab, or Bitbucket)

2. **Go to [netlify.com](https://netlify.com)**

3. **Click "New site from Git"**

4. **Connect your Git provider** (GitHub, GitLab, or Bitbucket)

5. **Select your repository**: `Magicianhax/Pendle-Moonshot-Calculator`

6. **Configure build settings**:
   - Build command: (leave empty)
   - Publish directory: (leave empty - uses root)
   - Branch to deploy: `main`

7. **Click "Deploy site"**

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI** (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Deploy from your project directory**:
   ```bash
   netlify deploy --prod --dir .
   ```

### Option 3: Drag & Drop Deployment (Fastest)

1. **Go to [netlify.com](https://netlify.com)**

2. **Drag your project folder** to the deploy area

3. **Your site is live instantly!**

## Configuration Files

The following files have been configured for Netlify:

- **`netlify.toml`**: Netlify configuration with routing and caching
- **`.gitignore`**: Excludes unnecessary files from deployment

## Features

- ✅ Static site deployment
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ SPA routing support
- ✅ Optimized caching headers
- ✅ No build step required
- ✅ Form handling (if needed)
- ✅ Serverless functions (if needed)

## Environment Variables

No environment variables are required for this deployment as all API endpoints are public.

## Custom Domain

After deployment, you can add a custom domain in the Netlify dashboard under your site settings.

## Troubleshooting

- **Build fails**: Ensure all files are committed to Git
- **404 errors**: Check that `netlify.toml` routing is correct
- **API errors**: Verify API endpoints are accessible from browser
- **JavaScript errors**: Check browser console for issues

## Local Testing

Test your deployment configuration locally:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Serve locally
netlify dev

# Or use any static file server
python -m http.server 8000
# or
npx serve .
```

## Why Netlify?

- ✅ **Perfect for static sites** - No configuration issues
- ✅ **Static files serve properly** - JavaScript files load correctly
- ✅ **Global CDN** - Fast performance worldwide
- ✅ **Simple deployment** - Drag & drop or Git integration
- ✅ **Free tier** - No cost for your project
- ✅ **Automatic HTTPS** - Secure by default
- ✅ **Form handling** - Built-in form processing
- ✅ **Serverless functions** - If you need backend logic later

## Netlify vs Other Platforms

| Feature | Netlify | Vercel | Deno Deploy |
|---------|---------|--------|-------------|
| Static Sites | ✅ Excellent | ❌ Config issues | ❌ Complex setup |
| JavaScript Files | ✅ Works perfectly | ❌ Routing problems | ❌ Build issues |
| Deployment Speed | ✅ Fast | ❌ Slow | ❌ Very slow |
| Configuration | ✅ Simple | ❌ Complex | ❌ Very complex |
| Free Tier | ✅ Generous | ✅ Good | ✅ Good |

Your Pendle Moonshot Calculator is now ready for production deployment! 🚀
