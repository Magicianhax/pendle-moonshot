# Pendle Moonshot Calculator

A comprehensive calculator for evaluating returns from Pendle Finance YT (Yield Token) positions with Almanak points rewards integration.

## What It Does

This calculator helps users evaluate the potential returns from purchasing Yield Tokens (YT) on Pendle Finance by:

1. **Trade Simulation**: Calculate exact YT amounts received for a given alUSD investment
2. **Underlying Yield**: Track APY from the underlying asset (alUSD lending yield)
3. **Almanak Points**: Calculate points earned based on TVL-weighted distribution
4. **ROI Scenarios**: Show breakeven analysis across multiple FDV scenarios (90M - 2B)
5. **Multi-Market Support**: Track October 23 and December 11, 2025 markets
6. **Real-time TVL**: Aggregate TVL from multiple sources (Pendle, Curve, Lagoon Finance)

## Points Distribution System

### Daily Points Allocation
- **333,333 Almanak points** distributed daily (pro-rata based on weighted TVL)
- **316,666 points** to users (95%)
- **16,667 points** to referral program (5%)

### Boost Multipliers

| Position Type | Multiplier | Earns Points? | Notes |
|--------------|------------|---------------|-------|
| **YT (Yield Tokens)** | **5x** | ✅ YES | Highest boost, 5% Pendle fee applies |
| **LP Dec 11 (SY portion)** | **1.5x** | ✅ YES | Only SY (alUSD) portion gets points |
| **Curve Pool** | **3x** | ✅ YES | alUSD + USDC in Curve pool |
| **Other TVL** | **1x** | ✅ YES | General alUSD holders |
| **LP Oct 23** | **0x** | ❌ NO | Market matured, excluded from points |
| **PT (Principal Tokens)** | **0x** | ❌ NO | Never earn points |
| **LP PT portion** | **0x** | ❌ NO | PT side of LP excluded |

### Important Notes
- **October 23, 2025 market**: Completely excluded from points (0x boost)
- **Pendle Fee**: 5% of YT points go to Pendle (deducted from gross points)
- **LP Composition**: December 11 LP is split into SY (gets 1.5x) and PT (gets 0x) portions

## Formulas

### 1. TVL Calculation

```
Gross TVL = (alUSD Supply × alUSD Price) + (alpUSD Supply × alpUSD Price)

Net TVL = Gross TVL - (SY alUSD Balance × alUSD Price)
```

**Why subtract SY balance?**  
SY (Standardized Yield) is alUSD deposited into Pendle. Without subtraction, this would be double-counted in both Gross TVL and Pendle positions.

### 2. Weighted TVL Formula

```
Weighted TVL = (Other TVL × 1) + 
               (YT TVL × 5) + 
               (LP SY TVL × 1.5) + 
               (Curve TVL × 3)

Where:
- YT TVL = YT Token Total Supply × alUSD Price
- LP SY TVL = (LP Total SY × alUSD Price) from Pendle market data
- Curve TVL = (USDC Balance × $1.00) + (alUSD Balance × alUSD Price)
- Other TVL = Gross TVL - SY alUSD - Curve alUSD
```

**Exclusions:**
- PT TVL: Excluded (0x multiplier)
- LP PT portion: Excluded (0x multiplier)
- October 23 market: All positions excluded (0x multiplier)

### 3. Points Calculation

```
User's Weighted Amount = Position Amount × Boost Multiplier

User's Share = User's Weighted Amount / Total Weighted TVL

Daily Gross Points = User's Share × 316,666

Daily Pendle Fee = Daily Gross Points × 0.05  (YT only)

Daily Net Points = Daily Gross Points - Daily Pendle Fee

Total Points = Daily Net Points × Days to Maturity
```

### 4. ROI Calculation

```
Daily Underlying Yield = YT Amount × (Underlying APY / 365)

Total Underlying Yield = Daily Underlying Yield × Days to Maturity

Points USD Value = Total Net Points × Token Price

Total Earnings = Points USD Value + Total Underlying Yield

ROI % = ((Total Earnings - Initial Investment) / Initial Investment) × 100
```

**Note:** YT tokens go to $0 at maturity, so you only keep the yield earnings.

### 5. Breakeven Formula

```
Daily Total Earnings = (Daily Net Points × Token Price) + Daily Underlying Yield

Breakeven Days = Initial Investment / Daily Total Earnings
```

### 6. Token Price Calculation

```
Token Price = (FDV in USD / 1,000,000,000)

Example:
- At $150M FDV: Token Price = $150,000,000 / 1,000,000,000 = $0.15
- At $1B FDV: Token Price = $1,000,000,000 / 1,000,000,000 = $1.00
```

## Contract Addresses

### Pendle Markets (Ethereum Mainnet)

#### October 23, 2025 Market (EXCLUDED FROM POINTS)
```
Market Address: 0x79f06a8dc564717a9ad418049d0be9a60f2646c0
YT Token: 0xd7c3fc198Bd7A50B99629cfe302006E9224f087b
Status: Matured - No points earned
```

#### December 11, 2025 Market (ACTIVE)
```
Market Address: 0x233062c1de76a38a4f41ab7c32e7bdb80a1dfc02
YT Token: 0xBA31C7c0189E9B6ab6CF6b27CD3D1A4D6d3d0Fd6
Status: Active - Earning points
```

### Token Contracts

```
alUSD Token: 0xDCD0f5ab30856F28385F641580Bbd85f88349124
alpUSD Token: 0x5a97b0b97197299456af841f8605543b13b12ee3
USDC Token: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
USDT Token: 0xdAC17F958D2ee523a2206206994597C13D831ec7
```

### Tracking Addresses

```
SY Contract: 0x8e5e017d6b3F567623B5d4a690a2a686bF7BA515
Curve Pool: 0x463626cF9028d96eAd5084954FF634f813D5fFB9
```

### Etherscan Balance Tracking (for TVL)

```
USDC Balance Wallet: 0x6402D60bEE5e67226F19CFD08A1734586e6c3954
USDT Balance Wallet: 0x70684224814a75e1b4b45de162f2456db4d66510
```

## API Endpoints

### Pendle Finance
```
Market Order API: https://api-v2.pendle.finance/limit-order/v2/limit-order/market-order
Market Data API: https://api-v2.pendle.finance/core/v2/1/markets/{address}/data
```

### Lagoon Finance (Live Prices)
```
alUSD Price: https://app.lagoon.finance/api/vaults?chainId=1&vault=0xDCD0f5ab30856F28385F641580Bbd85f88349124
alpUSD Price: https://app.lagoon.finance/api/vaults?chainId=1&vault=0x5a97B0B97197299456Af841F8605543b13b12eE3
```

### Etherscan API
```
Used for: Token balances, total supplies, contract calls
API Key: Configured in serverless functions
```

## Project Structure

```
pendle-moonshot/
├── index.html                      # Main HTML file with UI
├── api.js                          # Pendle API integration + calculations
├── main.js                         # DOM manipulation & UI logic
├── netlify/
│   └── functions/                  # Serverless functions
│       ├── get-pendle-market.js    # Pendle market data proxy
│       └── get-tvl-data.js         # TVL data aggregation
├── netlify.toml                    # Netlify configuration
├── package.json                    # NPM configuration
└── README.md                       # This file
```

## Features

- **Real-time Data**: Live market data, APY tracking, TVL aggregation
- **Multi-Market Support**: Track both October 23 and December 11 markets
- **Points Calculator**: Pro-rata distribution with boost multipliers
- **ROI Scenarios**: 18 FDV scenarios from $90M to $2B
- **Breakeven Analysis**: Calculate days needed to recover investment
- **Trade Simulation**: Calculate exact YT amounts before trading
- **Existing Position Tracking**: Calculate returns for current YT holders
- **Download Tables**: Export calculations as PNG images
- **High Contrast UI**: Black and white design for clarity

## How It Works

### 1. New Trade Flow
1. User enters investment amount (e.g., 100 alUSD)
2. System calls Pendle API to get exact YT amount
3. Calculates underlying yield based on current APY
4. Calculates Almanak points based on weighted TVL share
5. Shows ROI across multiple FDV scenarios with breakeven

### 2. Existing Position Flow
1. User enters current YT amount and original cost
2. System calculates remaining yield until maturity
3. Calculates points based on current TVL weights
4. Shows ROI scenarios and breakeven analysis

### 3. TVL Aggregation (Backend)
1. Fetch alUSD/alpUSD supply from Etherscan
2. Get live prices from Lagoon Finance API
3. Calculate Gross TVL from token supplies
4. Fetch SY balance to subtract (avoid double counting)
5. Get Pendle market data (LP, YT, PT amounts)
6. Get Curve pool balances
7. Calculate weighted TVL with boost multipliers
8. Return complete TVL breakdown

### 4. Points Distribution
1. Calculate user's weighted position (amount × boost)
2. Divide by total weighted TVL to get share percentage
3. Multiply by daily points (316,666)
4. Subtract Pendle fee if YT position (5%)
5. Multiply by days to maturity for total points
6. Convert to USD using token price

## Development Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`.

### Local Development with Netlify Functions

Install Netlify CLI:
```bash
npm install -g netlify-cli
```

Run with Netlify Dev:
```bash
netlify dev
```

This runs both the frontend and serverless functions locally.

## Deployment

The app is deployed on Netlify with automatic deployments from the main branch.

### Environment Variables
No environment variables needed - all API calls use public endpoints.

### Netlify Functions
Two serverless functions handle backend logic:
- `get-pendle-market`: Proxies Pendle API calls (CORS workaround)
- `get-tvl-data`: Aggregates TVL from multiple sources

## Usage Examples

### Example 1: Calculate New Trade
**Input:** 100 alUSD  
**Market:** December 11, 2025  
**Days to Maturity:** 49 days  

**Output:**
- YT Amount: ~98.5 YT
- Underlying Yield: ~0.93 USDC (7.7% APY)
- Daily Points: ~42 NET points
- Total Points: ~2,058 NET points
- At $150M FDV: ROI = -13.24% (needs higher FDV)
- Breakeven: ~286 days (exceeds maturity)

### Example 2: Higher FDV Scenario
**Input:** Same as above  
**FDV:** $500M  

**Output:**
- Points Value: $1,029
- Total Earnings: $1,029 + $0.93 = $1,029.93
- ROI: +2.99% ✅ Profit
- Breakeven: 86 days ✅ Within maturity

## Technical Details

### Wei Conversion
Amounts are converted to wei (18 decimals) for Pendle API:
```javascript
function toWei(amount) {
    const [integer, decimal = ''] = amount.toString().split('.');
    const paddedDecimal = decimal.padEnd(18, '0').substring(0, 18);
    return integer + paddedDecimal;
}
```

### Maturity Handling
Markets are considered matured at 00:00 UTC on maturity date:
```javascript
function isMarketMatured(marketKey) {
    const now = new Date();
    const maturityDate = new Date(PENDLE_CONFIG[marketKey].maturityDate);
    return now >= maturityDate; // True on maturity date itself
}
```

### Days to Maturity
Calculates earning days remaining (0 on maturity date):
```javascript
function getDaysToMaturity(marketKey) {
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const maturity = new Date(Date.UTC(maturityDate.getUTCFullYear(), maturityDate.getUTCMonth(), maturityDate.getUTCDate()));
    
    if (today >= maturity) return 0;
    
    return Math.round((maturity - today) / (1000 * 60 * 60 * 24));
}
```

## Refresh Rates

- **Market Data (APY)**: Every 5 minutes
- **TVL Data**: Every 10 minutes  
- **Countdown**: Every 1 minute
- **User Interactions**: On-demand

## Known Limitations

1. **Slippage**: Trade calculations don't account for slippage (use Pendle UI for final trade)
2. **Gas Fees**: ROI calculations don't include Ethereum gas fees
3. **Price Changes**: alUSD price may fluctuate (currently fetched live from Lagoon)
4. **Market Depth**: Large trades may experience different execution than calculated

## Support

For issues or questions:
- Check the Pendle Finance documentation
- Review contract addresses on Etherscan
- Verify market maturity dates in `PENDLE_CONFIG`

## License

ISC

---

**Disclaimer**: This calculator is for informational purposes only. Always verify calculations independently and understand the risks before trading. YT tokens lose all value at maturity - you only keep the yield earned.
