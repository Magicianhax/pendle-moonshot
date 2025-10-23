# Netlify Function Fix - October 23, 2025

## Problems Identified

### Problem 1: Netlify Functions Not Executing
The Netlify serverless function (`/.netlify/functions/get-tvl-data`) was not working after deployment, even though it worked locally. The page showed "Loading TVL data..." indefinitely.

### Problem 2: Pendle Market APIs Blocked by CORS
Even after fixing the TVL function, the Pendle market API calls (`https://api-v2.pendle.finance/core/v2/1/markets/{address}/data`) were not being triggered at all in production due to CORS restrictions, causing "Loading..." to display indefinitely for APY data.

## Root Causes

### Root Cause 1: Redirect Rule Conflict
The catch-all redirect rule in `netlify.toml` was redirecting **ALL** requests (including function calls) to `index.html`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This meant that when the frontend tried to fetch from `/.netlify/functions/get-tvl-data`, Netlify was returning `index.html` instead of executing the serverless function.

### Root Cause 2: Direct External API Calls Blocked by CORS
When the browser directly called Pendle's external API:
- **Locally:** Browser developer mode or local CORS policies allowed the calls
- **Production:** Strict CORS policies blocked cross-origin requests to Pendle API
- **Result:** Market data never loaded, APY showed "Loading..." forever

## Solutions Applied

### 1. Created Custom API Route Mapping
The proper solution is to create a custom `/api/*` route that maps to Netlify Functions **BEFORE** the catch-all redirect. This ensures API calls are never intercepted.

### 2. Created Serverless Proxy for Pendle Market API
Created `netlify/functions/get-pendle-market.js` to proxy Pendle API calls server-side, avoiding CORS completely.

### 3. Updated netlify.toml Configuration
- Added explicit `functions = "netlify/functions"` to `[build]` section
- Created `/api/*` to `/.netlify/functions/:splat` redirect rule (with `force = true`)
- Placed API redirect BEFORE catch-all SPA redirect
- Added CORS headers for both routes

### 4. Updated api.js
- **TVL Data:** Changed from `/.netlify/functions/get-tvl-data` to `/api/get-tvl-data`
- **Market Data:** Changed from direct Pendle API to `/api/get-pendle-market?market={address}`
- Both now use serverless proxies, eliminating all CORS issues

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

### API Call Flow (Correct Order)

**1. Pendle Market APIs (Called First)**
```
Frontend: fetch('/api/get-pendle-market?market=0x233062...')
    ↓
Netlify: /api/* → /.netlify/functions/get-pendle-market
    ↓
Serverless Function: Fetches from Pendle API (server-side, no CORS)
    ↓
Returns: Market data with APY ✅
```

**2. TVL Data API (Called After Market Data)**
```
Frontend: fetch('/api/get-tvl-data')
    ↓
Netlify: /api/* → /.netlify/functions/get-tvl-data
    ↓
Serverless Function: Fetches from Etherscan + Lagoon (server-side)
    ↓
Returns: TVL breakdown data ✅
```

### Netlify Routing

1. **Netlify processes redirects in order (top to bottom):**
   - `/api/*` → Maps to `/.netlify/functions/:splat` (with `force = true`)
   - `/*` → Redirects to `index.html` for SPA routing (with `force = false`)

2. **Unknown routes still work for SPA:**
   - `/some/unknown/path` → Redirects to `index.html`

3. **CORS is properly configured** for both `/api/*` and `/.netlify/functions/*` routes

## Testing
After deployment, open browser console and you should see (in order):

1. **Pendle Market Data loads first:**
   ```
   📊 Fetching market data for: 0x79f06a8dc564717a9ad418049d0be9a60f2646c0
   ✅ Market data loaded: 0x79f06a8d... | Underlying APY: X.XX% | Implied APY: Y.YY%
   📊 Fetching market data for: 0x233062c1de76a38a4f41ab7c32e7bdb80a1dfc02
   ✅ Market data loaded: 0x233062c1... | Underlying APY: X.XX% | Implied APY: Y.YY%
   ```

2. **TVL Data loads second:**
   ```
   🔄 Fetching TVL data...
   📊 Fetching TVL data from serverless function...
   ✅ All data fetched successfully
   ```

3. **Page displays correctly:**
   - Both market APYs show percentage values (not "Loading...")
   - TVL breakdown table populates with real data
   - No CORS errors in console

## Key Takeaways
1. **Proxy external APIs** through Netlify Functions to avoid CORS issues in production
2. **Use custom `/api/*` routes** that map to `/.netlify/functions/:splat` 
3. **Place API redirects BEFORE catch-all SPA redirect** in `netlify.toml`
4. **Always use `force = false`** for SPA catch-all to allow Netlify's internal routing to work

