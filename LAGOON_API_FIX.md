# Lagoon Finance API Fix

## Issue
The Lagoon Finance API for fetching live alUSD and alpUSD prices was not working correctly.

## Root Cause
The API response structure was misunderstood. The code was trying to access `data.pricePerShare` directly, but the actual API response structure is:

```json
{
  "vaults": [
    {
      "id": "1-0xdcd0f5ab30856f28385f641580bbd85f88349124",
      "address": "0xdcd0f5ab30856F28385F641580Bbd85f88349124",
      "symbol": "alUSD",
      "state": {
        "pricePerShare": "1024359999999999925",
        "pricePerShareUsd": 1.0243596582936893
      }
    },
    {
      "id": "1-0x5a97b0b97197299456af841f8605543b13b12ee3",
      "address": "0x5a97b0b97197299456af841f8605543b13b12ee3",
      "symbol": "alpUSD",
      "state": {
        "pricePerShare": 1010339,
        "pricePerShareUsd": 1.01060858875537
      }
    }
    // ... more vaults
  ],
  "totalCount": 23,
  "hasNextPage": true
}
```

The API returns **all vaults** as an array, not a single vault.

## Fix Applied

### Before (Broken):
```javascript
const data = await response.json();

if (data.pricePerShare) {
    const price = parseFloat(data.pricePerShare) / 1000000;
    return price;
}
```

### After (Fixed):
```javascript
const data = await response.json();

// Lagoon API returns: { vaults: [...], totalCount, hasNextPage }
// Find the alUSD vault by address
if (data.vaults && Array.isArray(data.vaults)) {
    const alUsdVault = data.vaults.find(v => 
        v.address.toLowerCase() === ALMANAK_CONFIG.alUsdToken.toLowerCase()
    );
    
    if (alUsdVault && alUsdVault.state && alUsdVault.state.pricePerShareUsd) {
        const price = alUsdVault.state.pricePerShareUsd;
        return price;
    }
}
```

## Key Changes

1. **Check for `vaults` array**: Verify `data.vaults` exists and is an array
2. **Find specific vault**: Use `.find()` to locate vault by address (case-insensitive)
3. **Access correct field**: Use `state.pricePerShareUsd` instead of `pricePerShare`
4. **No division needed**: `pricePerShareUsd` is already in USD (no need to divide by 1,000,000)

## Testing Results

✅ **Successfully fetching live prices:**
- alUSD Price: $1.026656
- alpUSD Price: $1.010609

Both prices are within expected range (1.0 - 1.05 USD).

## Files Modified

### `netlify/functions/get-tvl-data.js`
- Updated `fetchLiveAlUsdPrice()` function
- Updated `fetchLiveAlpUsdPrice()` function
- Added proper error handling and logging

## Benefits

1. ✅ **Live Prices**: Now fetches real-time prices from Lagoon Finance
2. ✅ **Accurate TVL**: TVL calculations use live market prices
3. ✅ **Fallback Support**: Still uses fallback prices if API fails
4. ✅ **Better Logging**: Enhanced error messages for debugging
5. ✅ **Robust Parsing**: Properly handles API response structure

## API Endpoints

### alUSD Price
```
GET https://app.lagoon.finance/api/vaults?chainId=1&vault=0xDCD0f5ab30856F28385F641580Bbd85f88349124
```

### alpUSD Price
```
GET https://app.lagoon.finance/api/vaults?chainId=1&vault=0x5a97B0B97197299456Af841F8605543b13b12eE3
```

## Example Usage in Code

```javascript
// Fetch alUSD price
const alUsdPrice = await fetchLiveAlUsdPrice();
console.log('alUSD Price:', alUsdPrice); // 1.026656

// Fetch alpUSD price
const alpUsdPrice = await fetchLiveAlpUsdPrice();
console.log('alpUSD Price:', alpUsdPrice); // 1.010609

// Calculate TVL with live prices
const grossTvl = (alUsdSupply * alUsdPrice) + (alpUsdSupply * alpUsdPrice);
```

## Fallback Mechanism

If the Lagoon Finance API fails for any reason:
1. Error is logged to console with details
2. Function returns fallback price from config:
   - alUSD: $1.0243
   - alpUSD: $1.01
3. TVL calculation continues without interruption

## Verification Steps

To verify the fix is working:

1. **Check Netlify Function Logs**:
   - Look for "✅ Live alUSD price from Lagoon: X.XXXXXX"
   - Look for "✅ Live alpUSD price from Lagoon: X.XXXXXX"

2. **Check Frontend Console**:
   - TVL data should show `liveAlUsdPrice` and `liveAlpUsdPrice` fields
   - Prices should be close to $1.00-$1.05 range

3. **Check TVL Calculations**:
   - Gross TVL should use live prices
   - Points distribution should reflect accurate TVL

## Future Considerations

### API Changes
If Lagoon Finance changes their API structure:
1. Update vault finding logic
2. Adjust price field access
3. Update error handling

### Rate Limiting
The API doesn't require authentication but monitor for:
- Rate limit headers
- Response times
- Error rates

### Caching
Consider caching prices for 1-5 minutes to reduce API calls:
```javascript
let cachedPrice = { value: null, timestamp: null };
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

if (cachedPrice.value && Date.now() - cachedPrice.timestamp < CACHE_DURATION) {
    return cachedPrice.value;
}
```

## Summary

✅ **Issue:** Lagoon Finance API not working  
✅ **Cause:** Incorrect response structure parsing  
✅ **Fix:** Updated to parse vaults array correctly  
✅ **Result:** Live prices now fetching successfully  
✅ **Impact:** More accurate TVL and points calculations  

The Lagoon Finance API integration is now working correctly and providing real-time price data for alUSD and alpUSD tokens! 🎉

