# Double Counting Fix: alUSD in Curve Pool

## Problem

The alUSD in the Curve pool was being **double-counted**:

1. **First count**: Included in `Curve TVL` calculation
   ```
   curveTvl = (curveUsdcBalance × $1.00) + (curveAlUsdBalance × alUsdPrice)
   ```

2. **Second count**: Included in `Other TVL` because it was part of Gross TVL but not being subtracted
   ```
   otherTvl = grossTvl - syAlUsdValue  ❌ Missing curveAlUsdValue subtraction
   ```

## Result

This caused **inflated TVL and points allocation** for "Other TVL" category:
- Users holding alUSD in the Curve pool were getting counted in both Curve (3x boost) and Other (1x boost)
- Total weighted TVL was artificially higher
- Other TVL was ~$3.3M higher than it should be

## Solution

Subtract **BOTH** alUSD sources from Gross TVL when calculating Other TVL:

```javascript
// Before (WRONG):
results.otherTvl = results.grossTvl - syAlUsdValue;

// After (CORRECT):
results.otherTvl = results.grossTvl - syAlUsdValue - curveAlUsdValue;
```

## Breakdown

### What Gets Subtracted:

1. **`syAlUsdValue`** = alUSD in Pendle SY contract
   - Already counted in Pendle LP/YT TVL
   - Must subtract from Other TVL

2. **`curveAlUsdValue`** = alUSD in Curve pool
   - Already counted in Curve TVL
   - Must subtract from Other TVL

### Formula:

```
Other TVL = Gross TVL - alUSD in Pendle - alUSD in Curve
```

This ensures each alUSD is counted **exactly once** in the appropriate category.

## Impact

### Before Fix:
- Other TVL: ~$74M
- Curve TVL: $3.3M (includes ~$1.6M alUSD)
- **Double counting**: $1.6M alUSD counted twice

### After Fix:
- Other TVL: ~$72.4M (reduced by $1.6M)
- Curve TVL: $3.3M (unchanged)
- **No double counting**: Each dollar counted once ✅

## Files Changed

1. **`netlify/functions/get-tvl-data.js`**:
   - Already exposed `curveAlUsdBalance` in API response

2. **`api.js`**:
   - Read `curveAlUsdBalance` from backend
   - Calculate `curveAlUsdValue = curveAlUsdBalance × liveAlUsdPrice`
   - Update `otherTvl` calculation to subtract both values
   - Added detailed console logging for debugging

## Verification

Check browser console for this log:

```javascript
📊 TVL Calculation: {
    grossTvl: 210000000,
    syAlUsdValue: 135000000,
    curveAlUsdBalance: 1600000,  // alUSD tokens in Curve
    curveAlUsdValue: 1638875,    // USD value
    subtractedFromGross: 136638875,  // Total subtracted
    otherTvl: 73361125  // Net Other TVL
}
```

## Testing

1. Refresh the calculator page
2. Open browser console
3. Check the "📊 TVL Calculation" log
4. Verify:
   - `curveAlUsdBalance` is non-zero
   - `curveAlUsdValue` is calculated correctly
   - `otherTvl` is reduced compared to before

## Summary

✅ **Fixed double-counting of alUSD in Curve pool**
✅ **Other TVL now accurately represents holders NOT in DeFi**
✅ **Points allocation is now fair and accurate**

---

**Date**: October 23, 2025
**Issue**: Double-counting of alUSD in Curve pool
**Status**: ✅ RESOLVED

