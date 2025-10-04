# Almanak Points System - Pro-Rata Distribution

## Overview
The calculator now uses a **pro-rata points distribution system** with boost multipliers based on TVL position type.

## Daily Points Distribution
- **333,333 points** distributed daily
- Distribution is based on weighted TVL (pro-rata)
- Points are allocated until the pool maturity date (October 23, 2025)

## Boost Multipliers
| Position Type | Boost Multiplier | Gets Points? |
|--------------|------------------|--------------|
| YT (Yield Tokens) | **5x** | ✅ YES |
| Curve Pool | **3x** | ✅ YES |
| LP (Liquidity Provider) | **1.25x** | ✅ YES |
| Other TVL | **1x** | ✅ YES |
| **PT (Principal Tokens)** | **0x** | ❌ **NO POINTS** |

**⚠️ IMPORTANT:** PT (Principal Tokens) holders receive **ZERO** points. YT gets the highest boost at 5x!

## TVL Calculation

### Total TVL Sources
1. **DeFiLlama TVL**: `https://api.llama.fi/tvl/almanak`
2. **USDC Balance**: Etherscan API for address `0x6402D60bEE5e67226F19CFD08A1734586e6c3954`
3. **USDT Balance**: Etherscan API for address `0x70684224814a75e1b4b45de162f2456db4d66510`

**Total TVL = DeFiLlama TVL + USDC Balance + USDT Balance**

### TVL Breakdown
From the total TVL, we identify:
- **LP TVL**: From Pendle market `liquidity.usd`
- **YT TVL**: Fetched directly from YT token contract (`0xd7c3fc198Bd7A50B99629cfe302006E9224f087b`)
  - Uses Etherscan API to get `totalSupply` of YT tokens
  - YT TVL = `ytTotalSupply × $1.02` (1 YT = 1 alUSD = $1.02)
  - **YT holders get 5x boost**
- **Curve Pool TVL**: USDC + alUSD balances in Curve pool (`0xDCD0f5ab30856F28385F641580Bbd85f88349124`)
  - Curve TVL = `(USDC × $1.00) + (alUSD × $1.02)`
  - **Curve holders get 3x boost**
- **PT TVL**: From Pendle `totalPt × $1.02` (EXCLUDED from points)
  - **PT holders get ZERO points** - completely excluded from weighted TVL
- **Other TVL**: `Total TVL - LP TVL - YT TVL - Curve TVL - PT TVL`

### Weighted TVL Formula
```
Step 1: Calculate individual TVLs
YT TVL = ytTotalSupply × $1.02
PT TVL = totalPt × $1.02 (to exclude)
Curve TVL = (USDC × $1.00) + (alUSD × $1.02)
LP TVL = from Pendle liquidity.usd

Step 2: Calculate Other TVL (excluding PT, YT, LP, Curve)
Other TVL = Total TVL - LP TVL - YT TVL - Curve TVL - PT TVL

Step 3: Calculate Weighted TVL for points distribution
Weighted TVL = (Other TVL × 1) + (YT TVL × 5) + (Curve TVL × 3) + (LP TVL × 1.25)
```

**Note**: PT TVL is completely excluded. All values use $1.02 for alUSD pricing consistency.

## Points Calculation for YT Holders

### Step-by-Step
1. **User's Weighted Amount**: `YT amount × 5`
2. **User's Share**: `Weighted Amount / Total Weighted TVL`
3. **Daily Points**: `User's Share × 333,333`
4. **Total Points**: `Daily Points × Days to Maturity`
5. **USD Value**: `Total Points × Token Price`
   - Token Price = `FDV / 1,000,000,000` (1B total token supply)

### APY Calculation
```
APY = (USD Value / YT Amount) × (365 / Days to Maturity) × 100%
```

## Example Calculation

### Scenario
- User buys: **100 YT tokens**
- Days to maturity: **20 days**
- Total TVL: **$121,551,527**
- LP TVL: **$26,762,644**
- YT TVL: **$23,541,214**
- PT TVL: **$23,541,214** (EXCLUDED)
- Other TVL: **$47,706,455** (Total - LP - YT - PT)
- FDV Scenario: **$150M**

### Calculation
1. **Weighted TVL** (PT excluded):
   ```
   = ($47,706,455 × 1) + ($23,541,214 × 5) + ($26,762,644 × 1.25)
   = $47,706,455 + $117,706,070 + $33,453,305
   = $198,865,830
   ```

2. **User's Weighted Amount**: `100 × 5 = 500`

3. **User's Share**: `500 / $198,865,830 ≈ 0.00000251`

4. **Daily Points**: `0.00000251 × 333,333 ≈ 0.84 points/day`

5. **Total Points**: `0.84 × 20 = 16.8 points`

6. **Token Price at $150M FDV**: `$150,000,000 / 1,000,000,000 = $0.15`

7. **USD Value**: `16.8 × $0.15 = $2.52`

8. **APY**: `($2.52 / $100) × (365 / 20) × 100% = 46.0%`

**Note**: By excluding PT from the calculation, YT holders get a higher share of daily points!

## Implementation

### API Integration
The system automatically fetches live data from:
- DeFiLlama API
- Etherscan API (V2)
- Pendle Finance API

### Refresh Rates
- Market data (APY): Every 5 minutes
- TVL data: Every 10 minutes
- Countdown: Every 1 minute

### Data Files
- `pendle-market-data.json`: Latest Pendle market snapshot
- `tvl-data.json`: Latest TVL breakdown
- `tvl-summary.json`: Complete system documentation with formulas

## Key Features
- ✅ Real-time TVL tracking
- ✅ Pro-rata points distribution
- ✅ Boost multipliers (5x for YT, 1.25x for LP)
- ✅ Multiple FDV scenarios (90M - 500M)
- ✅ Automatic data refresh
- ✅ Live APY calculations

