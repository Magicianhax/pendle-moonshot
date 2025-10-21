# Dynamic LP Boost System

## Overview
The LP (Liquidity Provider) boost automatically adjusts based on the number of active Pendle markets, incentivizing liquidity in the remaining active markets when others mature.

## Implementation Date
Implemented: October 21, 2025

## How It Works

### LP Boost Rules
- **Multiple Active Markets (2+)**: LP receives **1.25x** boost
- **Single Active Market (1)**: LP receives **1.5x** boost
- **Matured Markets**: LP receives **0x** boost (no points)

### Example Timeline

#### Before October 23, 2025 (Both Markets Active)
```
📅 October 23, 2025 Market - Active
LP Oct 23: $5.0M → 1.25x Boost → Points earned ✅

📅 December 11, 2025 Market - Active
LP Dec 11: $3.0M → 1.25x Boost → Points earned ✅

Active Markets: 2
LP Boost: 1.25x
```

#### After October 23, 2025 (Only December 11 Active)
```
📅 October 23, 2025 Market - ⚠️ MATURED
LP Oct 23: $5.0M (Locked) → 0x → No points ❌

📅 December 11, 2025 Market - Active
LP Dec 11: $3.0M → 1.5x Boost → Points earned ✅ (INCREASED!)

Active Markets: 1
LP Boost: 1.5x (AUTOMATIC INCREASE)
```

## Why This Matters

### Incentive Structure
1. **Early Stage**: When multiple markets are active, LP earns 1.25x
2. **Late Stage**: When only one market remains, LP earns 1.5x
3. **Post-Maturity**: Users are incentivized to migrate and provide liquidity to the active market

### Benefits
- ✅ Rewards loyal LPs who stay in active markets
- ✅ Maintains liquidity depth as markets mature
- ✅ Automatic adjustment (no manual intervention needed)
- ✅ Transparent and predictable boost changes

## Technical Implementation

### Files Modified

#### 1. `api.js`
**Changes:**
- Added `lpSingleMarket: 1.5` to `ALMANAK_POINTS_CONFIG.boosts`
- Updated `calculateWeightedTvl()` to:
  - Count active markets
  - Apply dynamic LP boost based on count
  - Log boost decisions for transparency
- Return `lpBoost` value for each market in weighted TVL object

**Key Logic:**
```javascript
// Count active markets (not matured)
const activeMarketsCount = (isOct23Matured ? 0 : 1) + (isDec11Matured ? 0 : 1);

// Apply appropriate boost
const lpBoostMultiplier = activeMarketsCount === 1 
    ? ALMANAK_POINTS_CONFIG.boosts.lpSingleMarket  // 1.5x
    : ALMANAK_POINTS_CONFIG.boosts.lp;             // 1.25x
```

#### 2. `main.js`
**Changes:**
- Updated TVL breakdown table to display dynamic boost
- Changed hardcoded "1.25x Boost" to `weighted.oct23.lpBoost + 'x Boost'`
- Changed hardcoded "1.25x" multiplier to `weighted.oct23.lpBoost + 'x'`
- Applied same changes for December 11 market
- Updated combined LP row to show active market's boost

#### 3. `index.html`
**Changes:**
- Added CSS class for `boost-1-5x` badge with blue styling
- Maintains visual distinction between boost levels:
  - 5x: Green (YT)
  - 1.5x: Blue (LP single market)
  - 1.25x: Yellow (LP multiple markets)
  - 1x: Gray (Other TVL)

## Points Calculation Example

### Scenario: After October 23 Matured

**TVL Distribution:**
- October 23 LP (Matured): $5.0M → 0x → $0 weighted TVL
- December 11 LP (Active): $3.0M → 1.5x → $4.5M weighted TVL
- Total Weighted TVL: $20M (example)

**Daily Points for December 11 LP:**
- LP Share: $4.5M / $20M = 22.5%
- Daily Points: 316,666 × 22.5% = **71,250 points/day**

**Comparison with 1.25x:**
- If still 1.25x: $3.0M × 1.25 = $3.75M weighted
- Daily Points: 316,666 × ($3.75M / $20M) = 59,375 points/day
- **Increase: +20% more points with 1.5x boost!**

## User Experience

### What Users See

#### Before Maturity (1.25x)
```
LP Dec 11: $3.0M   |   1.25x   |   $3.75M   |   59,375 pts/day
```

#### After Maturity (1.5x)
```
LP Dec 11: $3.0M   |   1.5x   |   $4.5M   |   71,250 pts/day
```

The boost badge color changes from yellow (1.25x) to blue (1.5x) automatically.

### Console Logging
For transparency, the system logs boost decisions:
```
🎯 LP Boost Calculation:
  activeMarkets: 1
  oct23Matured: true
  dec11Matured: false
  lpBoostApplied: 1.5x
```

## Future Considerations

### Adding More Markets
When new markets are added:
- If 2+ markets are active: All use 1.25x LP boost
- When only 1 remains: That market gets 1.5x LP boost
- System automatically adjusts without code changes

### Potential Extensions
- Could add 2x boost when market is within last 7 days before maturity
- Could add graduated boosts based on TVL thresholds
- Could add time-based boosts during specific periods

## Testing

To verify dynamic boost is working:

1. **Check Current Status** (Both Markets Active):
   - Open the calculator
   - Check TVL table
   - Both markets should show 1.25x LP boost
   - Check console for: `lpBoostApplied: 1.25x`

2. **Simulate One Market Matured**:
   - Temporarily change October 23 maturity to past date in `PENDLE_CONFIG`
   - Refresh page
   - December 11 market should show 1.5x LP boost
   - October 23 should show 0x (Matured)
   - Check console for: `lpBoostApplied: 1.5x`

3. **Verify Points Calculation**:
   - Calculate expected daily points with 1.5x
   - Compare with displayed points
   - Should match the increased boost

## Summary

The dynamic LP boost system ensures that:
1. ✅ Liquidity is incentivized in active markets
2. ✅ Users are rewarded for staying in the last active market
3. ✅ The transition is automatic and transparent
4. ✅ Points calculations remain fair and consistent

This creates a better user experience and maintains protocol health as markets naturally mature over time.

