# Netlify Function Fix - October 23, 2025

## Problem
The Netlify serverless function (`/.netlify/functions/get-tvl-data`) was not working after deployment, even though it worked locally. The page showed "Loading TVL data..." indefinitely.

## Root Cause
The catch-all redirect rule in `netlify.toml` was redirecting **ALL** requests (including function calls) to `index.html`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This meant that when the frontend tried to fetch from `/.netlify/functions/get-tvl-data`, Netlify was returning `index.html` instead of executing the serverless function.

## Solution Applied

### 1. Created Custom API Route Mapping
The proper solution is to create a custom `/api/*` route that maps to Netlify Functions **BEFORE** the catch-all redirect. This ensures API calls are never intercepted.

### 2. Updated netlify.toml Configuration
- Added explicit `functions = "netlify/functions"` to `[build]` section
- Created `/api/*` to `/.netlify/functions/:splat` redirect rule (with `force = true`)
- Placed API redirect BEFORE catch-all SPA redirect
- Added CORS headers for both routes

### 3. Updated api.js
- Changed fetch URL from `/.netlify/functions/get-tvl-data` to `/api/get-tvl-data`
- This uses the cleaner custom route

### Final netlify.toml Configuration:
```toml
[build]
  command = ""
  publish = "."
  functions = "netlify/functions"

# Map /api/* requests to Netlify Functions (MUST come before catch-all)
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
  force = true

# SPA routing - redirect all other requests to index.html
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  force = false

[[headers]]
  # CORS headers for API routes
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Headers = "Content-Type"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
```

## How It Works Now

1. **Netlify processes redirects in order (top to bottom):**
   - `/api/*` → Maps to `/.netlify/functions/:splat` (with `force = true` to ensure it executes)
   - `/*` → Redirects to `index.html` for SPA routing (with `force = false`)

2. **API calls now work correctly:**
   - Frontend: `fetch('/api/get-tvl-data')` 
   - Netlify: Redirects to `/.netlify/functions/get-tvl-data`
   - Function executes and returns data ✅
   
3. **Unknown routes still work for SPA:**
   - `/some/unknown/path` → Redirects to `index.html` for SPA routing

4. **CORS is properly configured** for both `/api/*` and `/.netlify/functions/*` routes

## Testing
After deployment:
- Open browser console
- You should see: `🔄 Fetching TVL data...` followed by successful data fetch
- TVL breakdown table should populate with real data
- No more infinite "Loading TVL data..." state

## Key Takeaway
When using Netlify Functions with a SPA catch-all redirect, **always use `force = false`** to allow Netlify's internal routing to handle functions before applying redirects.

