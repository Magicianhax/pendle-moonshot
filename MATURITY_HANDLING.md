# Pendle Market Maturity Handling

## Overview
This document explains how the Pendle Moonshot Calculator handles matured markets after their expiry date (e.g., October 23, 2025).

## Implementation Date
Implemented: October 17, 2025

## Important: Points Stop on Maturity Date
**For a maturity date of October 23, 2025:**
- ✅ **Last earning day:** October 22, 2025
- ❌ **No points earned:** October 23, 2025 (maturity date itself)

The maturity date marks the end of the earning period. Points calculation stops at 00:00 UTC on the maturity date.

## Key Changes

### 1. Maturity Detection
- Added `isMarketMatured(marketKey)` function to check if a market has reached maturity
- Checks are performed on both October 23 and December 11 markets
- Uses UTC date comparison for consistency

### 2. TVL Tracking for Matured Markets
When a market matures:
- **YT Value**: Displayed as $0 (because YT tokens become worthless at maturity)
- **Locked TVL**: Still tracked separately (`lockedLpTvl`, `lockedYtTvl`) for visibility
- **LP TVL**: Still displayed for migration tracking
- **PT TVL**: Already excluded (no changes)

### 3. Points Distribution Changes
After maturity:
- **0x boost** for both LP and YT (no points earned)
- Matured market TVL is **excluded from points calculations**
- Other active markets continue earning normal points
- **NEW: Dynamic LP Boost** - When only one market remains active, LP boost increases from 1.25x to 1.5x (see DYNAMIC_LP_BOOST.md)

### 4. Other TVL Calculation
Updated formula to avoid double counting:
```
Other TVL = Gross TVL - SY alUSD - Matured Market Locked TVL
```

This ensures:
- Assets still locked in matured pools are not counted as "Other TVL"
- No double counting when users migrate to new pools
- Accurate TVL distribution for points

### 5. UI Changes
Matured markets are displayed with:
- ⚠️ **MATURED** warning label in header
- Orange/yellow color scheme instead of blue/green
- Grayed out rows (60% opacity)
- "0x (Matured)" boost labels
- Warning message: "Market has matured. No points earned. Please migrate to active markets."
- Locked TVL shown in parentheses

## Why This Matters

### Problem Without Maturity Handling:
1. Users would earn points on worthless YT tokens after maturity
2. TVL would be double-counted (in matured pool + migrated to new pool)
3. Users wouldn't know to migrate to active markets
4. Points distribution would be inaccurate

### Solution With Maturity Handling:
1. ✅ No points earned after maturity (fair to all users)
2. ✅ Accurate TVL calculations (no double counting)
3. ✅ Clear visual warnings to migrate
4. ✅ Locked assets tracked for visibility
5. ✅ Smooth transition to new markets

## Example Scenarios

### October 21, 2025 (2 Days Before Maturity)
```
📅 October 23, 2025 Market - Active
Days to Maturity: 2 (Oct 21 + Oct 22)
YT Oct 23: $3.2M → 5x Boost → 4,638 points/day ✅
LP Oct 23: $5.0M → 1.25x Boost → 1,250 points/day ✅
```

### October 22, 2025 (Last Earning Day)
```
📅 October 23, 2025 Market - Active (Last Day!)
Days to Maturity: 1 (Oct 22 only)
YT Oct 23: $3.2M → 5x Boost → 4,638 points/day ✅
LP Oct 23: $5.0M → 1.25x Boost → 1,250 points/day ✅
```

### October 23, 2025 (Maturity Date - No Points)
```
📅 October 23, 2025 Market ⚠️ MATURED
⚠️ Market has matured. No points earned. Please migrate to active markets.
Days to Maturity: 0

YT Oct 23: $0.00 (Locked: $3.2M) → 0x → 0 points/day ❌
LP Oct 23: $5.0M (Locked) → 0x → 0 points/day ❌

📅 December 11, 2025 Market - ACTIVE (Only market remaining)
YT Dec 11: $2.8M → 5x Boost → Points earned ✅
LP Dec 11: $4.0M → 1.5x Boost → Points earned ✅ (BOOSTED from 1.25x!)
```

## Technical Implementation

### Files Modified
1. **api.js**
   - Added `isMarketMatured()` function
   - Modified `fetchTvlData()` to track maturity status
   - Modified `calculateWeightedTvl()` to apply 0x boost for matured markets
   - Updated exports to include `isMarketMatured`

2. **main.js**
   - Updated `displayTvlBreakdown()` to show matured market warnings
   - Added conditional styling based on maturity status
   - Added locked TVL display

3. **netlify/functions/get-tvl-data.js**
   - No changes needed (maturity check happens client-side)

## Migration Path for Users
When October 23 market matures:
1. User sees ⚠️ MATURED warning
2. YT value shows $0 (accurate)
3. User knows to redeem YT yield from Pendle
4. User migrates to December 11 or later markets
5. Starts earning points again on active markets

## Future Considerations
- When adding new markets, they will automatically support maturity handling
- Maturity dates are defined in `PENDLE_CONFIG.MARKET_XXX.maturityDate`
- No manual intervention needed when markets mature
- System automatically transitions users to active markets through UI warnings

## Testing
To test maturity handling:
1. Temporarily change maturity date to past date
2. Refresh page
3. Verify:
   - ⚠️ MATURED label appears
   - YT shows $0
   - Boost shows 0x
   - Daily points show 0
   - Warning message displays
   - Locked TVL is visible

## Summary
This implementation ensures fair points distribution, accurate TVL tracking, and clear user communication when Pendle markets mature. Users are automatically guided to migrate to active markets without losing visibility of their locked assets.

