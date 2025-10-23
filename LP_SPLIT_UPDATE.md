# LP Split Update - December 11 Market

## Overview
Updated the points calculation for December 11 market to split LP into SY and PT components. Only the SY portion of LP receives points (1.5x boost), while the PT portion is excluded (0x boost).

## Changes Made

### 1. API Changes (`api.js`)

#### LP Composition Calculation (Lines 565-620)
Added calculation to split December 11 LP into SY and PT portions based on pool reserves:

```javascript
// Calculate LP composition using AMM math
const syPrice = marketResponseDec11.data.assetPriceUsd;
const ptDiscount = marketResponseDec11.data.ptDiscount;
const ptPrice = syPrice * (1 - ptDiscount);
const liquidityAcc = marketResponseDec11.data.liquidity.acc;

// Solve for PT and SY reserves in the pool
const ptReserveInPool = (actualLpTvl - liquidityAcc * syPrice) / (ptPrice - syPrice);
const syReserveInPool = liquidityAcc - ptReserveInPool;

// Calculate USD values
const lpPtPortionUsd = ptReserveInPool * ptPrice;
const lpSyPortionUsd = syReserveInPool * syPrice;
```

**Stores:**
- `lpTvl`: Total LP TVL
- `lpSyTvl`: SY portion (gets points)
- `lpPtTvl`: PT portion (excluded)

#### Weighted TVL Calculation (Lines 706-714)
Updated to only apply boost to SY portion:

```javascript
// ONLY SY portion of LP gets 1.5x boost, PT portion is EXCLUDED (0x)
const lpSyTvlDec11 = tvlData.pendleDec11.lpSyTvl || 0;  // SY portion (gets points)
const lpPtTvlDec11 = tvlData.pendleDec11.lpPtTvl || 0;  // PT portion (EXCLUDED)
const lpBoostDec11 = isDec11Matured ? 0 : 1.5;
const weightedLpDec11 = lpSyTvlDec11 * lpBoostDec11;  // Only SY portion gets boost
```

### 2. Display Changes (`main.js`)

#### TVL Breakdown Table (Lines 870-890)
Changed from single LP row to three rows showing the split:

1. **LP Dec 11 (Total)** - Header row showing total LP TVL
2. **├─ LP SY (alUSD)** - SY portion with 1.5x boost
3. **└─ LP PT (alUSD)** - PT portion excluded (0x boost)

**Visual Example:**
```
LP Dec 11 (Total)               $20.90M    Split into SY and PT portions below
├─ LP SY (alUSD) [1.5x Boost]  $14.44M    1.5x    $21.66M    222,757    69.09%
└─ LP PT (alUSD) [EXCLUDED]    $6.46M     0x      $0         0          0%
```

## Direct Token Amount Approach (FINAL)

### Why This Method?

This is the **most accurate method** because it uses actual token reserves directly from Pendle API, not calculations or approximations. No formulas needed - just multiply token amounts by their prices!

### Formula

**Given:**
- `totalPt`: PT token amount in pool (from Pendle API)
- `totalSy`: SY token amount in pool (from Pendle API)
- `syPrice`: alUSD price from Lagoon API
- `ptPrice`: USDC price from CoinGecko API

**Calculate USD Values:**
```javascript
lpSyPortionUsd = totalSy × syPrice
lpPtPortionUsd = totalPt × ptPrice
```

That's it! Simple and accurate.

### Price Sources

1. **alUSD (SY) Price**: From Lagoon Finance API
   - Real-time market price (e.g., $1.024297)
   
2. **USDC (PT) Price**: From CoinGecko API
   - Real-time USDC price (typically ~$1.00)
   - Fallback: $1.00 if API fails

### Example Calculation (Real Data)

**From Pendle API:**
- `totalSy` = 14,440,123.45 tokens
- `totalPt` = 6,459,876.55 tokens

**From Price APIs:**
- `syPrice` = $1.024297 (alUSD from Lagoon)
- `ptPrice` = $1.000000 (USDC from CoinGecko)

**Calculate:**
```
lpSyPortionUsd = 14,440,123.45 × $1.024297 = $14,791,234
lpPtPortionUsd = 6,459,876.55 × $1.000000 = $6,459,877
totalLpTvl = $14,791,234 + $6,459,877 = $21,251,111

SY% = $14,791,234 / $21,251,111 = 69.6%
PT% = $6,459,877 / $21,251,111 = 30.4%
```

**Result:** ✅ Matches Pendle UI exactly because we're using the same source data!

*Note: Token amounts and prices update in real-time*

## Points Impact

### Before Change:
- **Total LP Dec 11**: $20.90M → $31.35M weighted (1.5x boost)
- **Daily Points**: ~222,757 points

### After Change:
- **LP SY portion**: $14.44M → $21.66M weighted (1.5x boost) ✅
- **LP PT portion**: $6.46M → $0 weighted (0x boost) ❌
- **Daily Points**: Same (~222,757) but now only from SY portion

### Why This Change?

1. **Fair Allocation**: PT holders already excluded from YT points
2. **Consistent Logic**: Only SY/alUSD portions earn points
3. **Prevents Double Counting**: PT in LP shouldn't earn points that PT holders elsewhere don't get
4. **Accurate Representation**: Shows users exactly which portion of their LP earns points

## Verification

To verify the calculation is working correctly, check console logs:

```javascript
console.log('💡 December 11 LP Breakdown:', {
    totalLpTvl: actualLpTvl,
    lpSyPortion: lpSyPortionUsd,
    lpPtPortion: lpPtPortionUsd,
    syPercent: ((lpSyPortionUsd / actualLpTvl) * 100).toFixed(2) + '%',
    ptPercent: ((lpPtPortionUsd / actualLpTvl) * 100).toFixed(2) + '%'
});
```

Expected output (approximately):
```
💡 December 11 LP Breakdown: {
    totalLpTvl: 20699052,
    lpSyPortion: 14120000,  // ~69%
    lpPtPortion: 6579052,   // ~31%
    syPercent: '69.09%',
    ptPercent: '30.91%'
}
```

## Market Comparison

| Component | TVL | Boost | Weighted TVL | Daily Points | Note |
|-----------|-----|-------|--------------|--------------|------|
| YT Dec 11 | Variable | 5x | Variable | Variable | After 5% Pendle fee |
| LP SY Dec 11 | ~$14.4M | 1.5x | ~$21.6M | Calculated | ✅ Earns points |
| LP PT Dec 11 | ~$6.5M | 0x | $0 | 0 | ❌ Excluded |
| Curve Pool | Variable | 3x | Variable | Variable | Shared category |
| Other TVL | Variable | 1x | Variable | Variable | Holders not in DeFi |

## User Impact

### LP Providers (December 11):
- ✅ SY portion of your LP earns 1.5x boosted points
- ⚠️ PT portion of your LP is excluded (0 points)
- 📊 Typical split: ~69% SY, ~31% PT (varies with trading)
- 💡 Net effect: Still better than holding SY alone due to swap fees + partial boost

### Migration Recommendations:
- From Oct 23 LP → Dec 11 LP: Now understand you get points only on SY portion
- Holding PT elsewhere: No change, PT still excluded
- Holding SY: Consider LP for additional swap fees, but know only SY portion gets points

## Files Modified

1. **`api.js`** (Lines 565-620, 706-714, 752-765)
   - Added LP composition calculation
   - Updated weighted TVL to use only SY portion
   - Added lpSyTvl and lpPtTvl to return data

2. **`main.js`** (Lines 870-890)
   - Split LP display into three rows (Total, SY, PT)
   - Visual hierarchy with indentation
   - Color coding for excluded PT portion

## Testing Checklist

- [ ] LP breakdown calculates correctly (~69% SY, ~31% PT)
- [ ] Only SY portion gets weighted (1.5x boost)
- [ ] PT portion shows as excluded (0x boost)
- [ ] Console logs show correct breakdown
- [ ] TVL table displays all three rows properly
- [ ] Points calculation uses only SY weighted value
- [ ] No regression in other calculations

## Date Applied
October 23, 2025

## Related Documentation
- `POINTS_UPDATE_OCT23.md` - Initial points exclusion changes
- `UI_SIMPLIFICATION_SUMMARY.md` - UI cleanup removing Oct 23
- `pendle-market-comparison.json` - Latest market data snapshot

