# Points System Update - October 23, 2025

## Changes Made

### 1. October 23 Market - EXCLUDED from Points
**Location:** `api.js` - Lines 667-673

**Change:**
- October 23 market now gets **0x boost** for both YT and LP positions
- Previously: Dynamic boost based on maturity status
- Now: Always excluded from points regardless of maturity status

**Code:**
```javascript
// Calculate weighted values for October 23 market
// EXCLUDED FROM POINTS - Always 0x boost
const lpBoostOct23 = 0;  // EXCLUDED - Always 0x boost
const ytBoostOct23 = 0;  // EXCLUDED - Always 0x boost
```

### 2. December 11 LP Boost - Increased to 1.5x
**Location:** `api.js` - Line 678

**Change:**
- December 11 LP positions now get **1.5x boost** (up from 1.25x)
- Previously: 1.25x when multiple markets active, 1.5x when single market
- Now: Always 1.5x for December 11 LP (unless matured)

**Code:**
```javascript
// Calculate weighted values for December 11 market
// LP gets 1.5x boost, if matured: 0x boost (no points earned)
const lpBoostDec11 = isDec11Matured ? 0 : 1.5;  // 1.5x boost for Dec 11 LP, 0x if matured
```

### 3. UI Updates - Removed October 23 Market Display
**Location:** `index.html` and `main.js`

**Changes:**
1. **Removed October 23 Market Card** (lines 833-855 in index.html)
   - Removed the entire market info card showing October 23 countdown, underlying APY, and implied APY
   
2. **Removed Market Selector** (lines 924-935 in index.html)
   - Removed the "SELECT MARKET" section with buttons for Oct 23 and Dec 11
   - Calculator now defaults to December 11 market only
   
3. **Updated JavaScript** (main.js)
   - Set default market to `'dec11'`
   - Removed market selector button event listeners
   - Commented out October 23 UI element references
   - Updated console logs to reflect "December 11 market only"
   
4. **Updated Text Content**
   - Added warnings that October 23 market is excluded from points
   - Added note that December 11 LP gets 1.5x boost
   - "YT 5x, LP Dec 11 1.5x, Other 1x"

**Rationale:**
Since October 23 is excluded from points, showing it in the UI would confuse users. The calculator now focuses solely on December 11 market.

### 4. Removed Combined YT Summary Section
**Location:** `main.js` - Lines 906-941 (removed)

**Change:**
- Removed the "COMBINED YT SUMMARY" section from TVL breakdown table
- This section showed combined totals for both markets, which is no longer relevant since October 23 is excluded from points
- Removed sections:
  - Total YT (Both Markets)
  - Pendle Fee (5%) breakdown
  - YT NET Points
  - Total LP (Both Markets)

**Reason:**
Since October 23 market no longer earns any points (0x boost), showing a combined summary is misleading and unnecessary. Users should only focus on December 11 market data.

## Impact

### October 23 Market Holders
- ❌ YT holders: No longer earn any points
- ❌ LP holders: No longer earn any points
- ⚠️ These positions should migrate to December 11 market to earn points

### December 11 Market Holders
- ✅ YT holders: Continue to earn 5x boosted points
- ✅ LP holders: Now earn 1.5x boosted points (increased from 1.25x)
- ✅ More attractive for LP providers

### Points Distribution
The daily 316,666 points (95% of 333,333) are now distributed as follows:
- **YT Dec 11:** 5x boost
- **LP Dec 11:** 1.5x boost (NEW)
- **Curve Pool:** 3x boost
- **Other TVL:** 1x boost
- **October 23 positions:** 0x boost (EXCLUDED)

## Date Applied
October 23, 2025

## Files Modified
1. `api.js` - Core points calculation logic
2. `index.html` - UI descriptions and warnings
3. `main.js` - Removed "Combined YT Summary" section from TVL breakdown table

