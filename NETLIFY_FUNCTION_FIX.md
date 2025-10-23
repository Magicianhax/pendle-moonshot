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

### 1. Fixed netlify.toml Configuration
- Added explicit `functions = "netlify/functions"` to `[build]` section
- Changed redirect rule to use `force = false` to allow Netlify to handle functions first
- Added CORS headers for function responses
- **Removed invalid redirect** for `/.netlify/functions/*` (Netlify doesn't allow this path in redirects)

### Final netlify.toml Configuration:
```toml
[build]
  command = ""
  publish = "."
  functions = "netlify/functions"

# SPA routing - redirect all non-function/non-file requests to index.html
# force = false allows Netlify to handle functions and static files first
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  force = false

[[headers]]
  # CORS headers for Netlify Functions
  for = "/.netlify/functions/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Headers = "Content-Type"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
```

## How It Works Now

1. **Netlify processes requests in this order:**
   - Static files (JS, CSS, images, etc.)
   - Netlify Functions (`/.netlify/functions/*`)
   - Then redirects (because `force = false`)

2. **Function calls now work:**
   - `fetch('/.netlify/functions/get-tvl-data')` → Executes the function
   - `/some/unknown/path` → Redirects to `index.html` for SPA routing

3. **CORS is properly configured** for function responses

## Testing
After deployment:
- Open browser console
- You should see: `🔄 Fetching TVL data...` followed by successful data fetch
- TVL breakdown table should populate with real data
- No more infinite "Loading TVL data..." state

## Key Takeaway
When using Netlify Functions with a SPA catch-all redirect, **always use `force = false`** to allow Netlify's internal routing to handle functions before applying redirects.

