// Pendle API Integration Module

/**
 * Configuration for Pendle API - Multiple Markets Support
 */
const PENDLE_CONFIG = {
    API_URL: "https://api-v2.pendle.finance/limit-order/v2/limit-order/market-order",
    MARKET_API_URL: "https://api-v2.pendle.finance/core/v2/1/markets",
    CHAIN_ID: 1,
    TYPE: 2,
    
    // October 23, 2025 Market
    MARKET_OCT23: {
        address: "0x79f06a8dc564717a9ad418049d0be9a60f2646c0",
        cappedAmount: "138107596043615446631225",
        maturityDate: "2025-10-23T00:00:00.000Z",
        name: "October 23, 2025",
        ytToken: "0xd7c3fc198Bd7A50B99629cfe302006E9224f087b"
    },
    
    // December 11, 2025 Market
    MARKET_DEC11: {
        address: "0x233062c1de76a38a4f41ab7c32e7bdb80a1dfc02",
        cappedAmount: "138107596043615446631225", // Using same capped amount, adjust if needed
        maturityDate: "2025-12-11T00:00:00.000Z",
        name: "December 11, 2025",
        ytToken: "0xBA31C7c0189E9B6ab6CF6b27CD3D1A4D6d3d0Fd6"
    },
    
    // Default market for backward compatibility
    get MARKET() { return this.MARKET_OCT23.address; },
    get CAPPED_AMOUNT() { return this.MARKET_OCT23.cappedAmount; },
    get MATURITY_DATE() { return this.MARKET_OCT23.maturityDate; }
};

/**
 * Convert human readable amount to wei (18 decimals)
 * @param {number|string} amount - Amount in alUSD
 * @returns {string} Amount in wei
 */
function toWei(amount) {
    // Use string manipulation for precise large number conversion
    const amountStr = amount.toString();
    const [integerPart, decimalPart = ''] = amountStr.split('.');
    
    // Pad decimal part to 18 places or truncate if longer
    const paddedDecimal = decimalPart.padEnd(18, '0').substring(0, 18);
    
    // Combine integer and decimal parts
    const weiString = integerPart + paddedDecimal;
    
    // Remove leading zeros but keep at least one digit
    return weiString.replace(/^0+/, '') || '0';
}

/**
 * Convert wei to human readable format
 * @param {string|number} weiAmount - Amount in wei
 * @param {number} decimals - Number of decimals (default 18)
 * @returns {string} Formatted number
 */
function formatFromWei(weiAmount, decimals = 18) {
    const value = parseFloat(weiAmount) / Math.pow(10, decimals);
    return value.toFixed(6);
}

/**
 * Calculate moonshot potential using Pendle API
 * @param {number|string} amount - Amount in alUSD
 * @param {string} marketKey - Market key ('oct23' or 'dec11'), defaults to 'oct23'
 * @returns {Promise<Object>} API response with trade data
 */
async function calculateMoonshot(amount, marketKey = 'oct23') {
    try {
        // Validate input
        if (!amount || amount <= 0) {
            throw new Error('Please enter a valid amount');
        }
        
        // Check for reasonable amount limits (prevent extremely large numbers)
        const numAmount = parseFloat(amount);
        if (numAmount > 10000000) { // 10M alUSD limit
            throw new Error('Amount too large. Please enter a reasonable amount (max 10,000,000 alUSD).');
        }

        // Convert amount to wei
        const netFromTakerWei = toWei(amount);
        
        // Get market configuration based on selected market
        const marketConfig = marketKey === 'dec11' ? PENDLE_CONFIG.MARKET_DEC11 : PENDLE_CONFIG.MARKET_OCT23;
        
        // Debug logging for large amounts
        if (numAmount >= 1000) {
            console.log('Large amount conversion:', {
                input: amount,
                market: marketConfig.name,
                wei: netFromTakerWei,
                weiLength: netFromTakerWei.length
            });
        }
        
        // Prepare API request payload
        const payload = {
            chainId: PENDLE_CONFIG.CHAIN_ID,
            market: marketConfig.address,
            netFromTaker: netFromTakerWei,
            type: PENDLE_CONFIG.TYPE,
            cappedAmountToMarket: marketConfig.cappedAmount
        };

        // Make API call
        const response = await fetch(PENDLE_CONFIG.API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        // Check if response is OK
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        // Parse response
        const data = await response.json();
        
        // Validate response structure
        if (!data.marketTrade && !data.totalTrade) {
            throw new Error('Invalid response structure from API');
        }

        return {
            success: true,
            data: data,
            inputAmount: amount
        };

    } catch (error) {
        console.error('Pendle API Error:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred'
        };
    }
}

/**
 * Format API response for display
 * @param {Object} apiResponse - Response from calculateMoonshot
 * @returns {Object} Formatted data for UI display
 */
function formatApiResponse(apiResponse) {
    if (!apiResponse.success) {
        return {
            success: false,
            error: apiResponse.error
        };
    }

    const { data, inputAmount } = apiResponse;
    // Use totalTrade (full order including limit orders + market), fallback to marketTrade if unavailable
    const tradeData = data.totalTrade || data.marketTrade;

    // Calculate return metrics from totalTrade
    const netFromTaker = parseFloat(tradeData.netFromTaker);
    const netToTaker = parseFloat(tradeData.netToTaker);
    const fee = parseFloat(tradeData.fee);

    return {
        success: true,
        formatted: {
            inputAmount: `${inputAmount} alUSD`,
            netFromTaker: `${formatFromWei(tradeData.netFromTaker)} alUSD`,
            netToTaker: `${formatFromWei(tradeData.netToTaker, 6)} YT`,
            fee: `${formatFromWei(tradeData.fee)} alUSD`,
            rawData: {
                netFromTaker: netFromTaker,
                netToTaker: netToTaker,
                fee: fee
            }
        }
    };
}

/**
 * Get market data including APY and maturity information
 * @param {string} marketAddress - Market address (defaults to October 23 market)
 * @returns {Promise<Object>} Market data response
 */
async function getMarketData(marketAddress = PENDLE_CONFIG.MARKET_OCT23.address) {
    try {
        const response = await fetch(`${PENDLE_CONFIG.MARKET_API_URL}/${marketAddress}/data`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Market API Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
            success: true,
            data: {
                underlyingApy: data.underlyingApy || 0,
                underlyingInterestApy: data.underlyingInterestApy || 0,
                impliedApy: data.impliedApy || 0,
                aggregatedApy: data.aggregatedApy || 0,
                timestamp: data.timestamp,
                liquidity: data.liquidity,
                tradingVolume: data.tradingVolume,
                totalPt: data.totalPt || 0, // Include PT total for points calculation
                totalSy: data.totalSy || 0,
                assetPriceUsd: data.assetPriceUsd || 0
            }
        };

    } catch (error) {
        console.error('Market API Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch market data'
        };
    }
}

/**
 * Get market data for all markets
 * @returns {Promise<Object>} Market data for both markets
 */
async function getAllMarketsData() {
    try {
        const [oct23Data, dec11Data] = await Promise.all([
            getMarketData(PENDLE_CONFIG.MARKET_OCT23.address),
            getMarketData(PENDLE_CONFIG.MARKET_DEC11.address)
        ]);
        
        return {
            success: true,
            oct23: oct23Data.success ? oct23Data.data : null,
            dec11: dec11Data.success ? dec11Data.data : null
        };
    } catch (error) {
        console.error('Failed to fetch all markets data:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Check if a market has reached maturity
 * @param {string} marketKey - Market key ('oct23' or 'dec11')
 * @returns {boolean} True if market is matured
 */
function isMarketMatured(marketKey = 'oct23') {
    const now = new Date();
    const maturityDateString = marketKey === 'dec11' 
        ? PENDLE_CONFIG.MARKET_DEC11.maturityDate 
        : PENDLE_CONFIG.MARKET_OCT23.maturityDate;
    
    const maturityDate = new Date(maturityDateString);
    
    // Get UTC dates at start of day
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const maturityUTC = new Date(Date.UTC(maturityDate.getUTCFullYear(), maturityDate.getUTCMonth(), maturityDate.getUTCDate()));
    
    return todayUTC >= maturityUTC;
}

/**
 * Calculate days remaining until maturity using UTC time
 * @param {string} marketKey - Market key ('oct23' or 'dec11'), defaults to 'oct23'
 * @returns {number} Days remaining
 */
function getDaysToMaturity(marketKey = 'oct23') {
    // Get current UTC date
    const now = new Date();
    
    // Get maturity date for the specified market
    const maturityDateString = marketKey === 'dec11' 
        ? PENDLE_CONFIG.MARKET_DEC11.maturityDate 
        : PENDLE_CONFIG.MARKET_OCT23.maturityDate;
    
    // Parse maturity date (already in UTC)
    const maturityDate = new Date(maturityDateString);
    
    // Get UTC dates at start of day
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const maturityUTC = new Date(Date.UTC(maturityDate.getUTCFullYear(), maturityDate.getUTCMonth(), maturityDate.getUTCDate()));
    
    // Calculate difference in days
    const timeDiff = maturityUTC.getTime() - todayUTC.getTime();
    const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysDiff);
}

/**
 * Calculate projected APY at maturity based on underlying APY and days remaining
 * @param {number} underlyingApy - Annual underlying APY (as decimal, e.g., 0.077 for 7.7%)
 * @param {number} daysToMaturity - Days remaining until maturity
 * @returns {number} Projected APY at maturity (as decimal)
 */
function calculateMaturityApy(underlyingApy, daysToMaturity) {
    if (daysToMaturity <= 0) return 0;
    
    // Calculate the projected return based on compounding for remaining days
    const dailyRate = underlyingApy / 365;
    const projectedReturn = Math.pow(1 + dailyRate, daysToMaturity) - 1;
    
    return projectedReturn;
}

/**
 * Calculate earnings at maturity for a given YT amount
 * @param {number} ytAmount - YT amount received from trade
 * @param {number} maturityReturn - Projected return at maturity (as decimal)
 * @param {number} underlyingApy - Annual underlying APY (as decimal)
 * @param {number} daysToMaturity - Days remaining until maturity
 * @param {number} initialInvestment - Initial alUSD investment amount
 * @returns {Object} Earnings calculation
 */
function calculateMaturityEarnings(ytAmount, maturityReturn, underlyingApy, daysToMaturity, initialInvestment) {
    // YT tokens turn to 0 at maturity, you only get the yield
    const earnings = ytAmount * maturityReturn;
    const totalValue = earnings; // Only the yield, not principal + yield
    
    // Calculate ROI based on earnings vs initial investment
    // ROI = (earnings / initialInvestment) * 100
    const roi = initialInvestment > 0 ? (earnings / initialInvestment) * 100 : 0;
    
    // Calculate breakeven time (days until earnings equal initial investment)
    // Daily earnings = ytAmount × (underlyingApy / 365)
    // breakeven_days = initialInvestment / daily_earnings
    const dailyYield = ytAmount * (underlyingApy / 365);
    const breakevenDays = dailyYield > 0 ? initialInvestment / dailyYield : Infinity;
    
    return {
        initialAmount: ytAmount,
        initialInvestment: initialInvestment,
        earnings: earnings,
        totalValue: totalValue, // This is just the yield amount
        roiPercentage: roi.toFixed(3),
        breakevenDays: breakevenDays,
        maturityReturnPercentage: (maturityReturn * 100).toFixed(3)
    };
}

/**
 * Almanak Points APY Configuration
 * New system: 333,333 points distributed daily based on pro-rata TVL with boosts
 * Points are separate from underlying yield - 1 point = 1 Almanak token
 * Total supply: 1B tokens
 * Note: 5% reserved for referral program, so 316,666 points for direct distribution
 */
const ALMANAK_POINTS_CONFIG = {
    dailyPoints: 316666, // Points distributed per day (333,333 - 5% for referrals)
    totalSupply: 1000000000, // 1B tokens
    fdvScenarios: [90, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1600, 1800, 2000], // FDV scenarios in millions
    boosts: {
        other: 1,    // 1x points for other TVL
        yt: 5,       // 5x points for YT tokens
        lp: 1.25,    // 1.25x points for LP tokens
        curve: 3     // 3x points for Curve pool
    },
    // API endpoints
    etherscanApiKey: "NDP4JRZEF2QUCXSQMGNVRUG81KTHEPMCH6",
    usdcAddress: "0x6402D60bEE5e67226F19CFD08A1734586e6c3954",
    usdtAddress: "0x70684224814a75e1b4b45de162f2456db4d66510",
    usdcToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    usdtToken: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    // Pendle YT tokens for both markets
    ytTokenOct23: "0xd7c3fc198Bd7A50B99629cfe302006E9224f087b", // YT-alUSD October 23 token
    ytTokenDec11: "0xBA31C7c0189E9B6ab6CF6b27CD3D1A4D6d3d0Fd6", // YT-alUSD December 11 token
    // Curve pool tracking
    curvePoolAddress: "0x463626cF9028d96eAd5084954FF634f813D5fFB9", // Curve pool address for balance tracking (gets 3x points)
    alUsdToken: "0xDCD0f5ab30856F28385F641580Bbd85f88349124", // alUSD token contract for tracking
    alpUsdToken: "0x5a97b0b97197299456af841f8605543b13b12ee3", // alpUSD token contract
    syContractAddress: "0x8e5e017d6b3F567623B5d4a690a2a686bF7BA515", // SY contract where alUSD is deposited (to subtract from TVL)
    lagoonAlUsdApiUrl: "https://app.lagoon.finance/api/vaults?chainId=1&vault=0xDCD0f5ab30856F28385F641580Bbd85f88349124", // Lagoon Finance API for live alUSD price
    lagoonAlpUsdApiUrl: "https://app.lagoon.finance/api/vaults?chainId=1&vault=0x5a97B0B97197299456Af841F8605543b13b12eE3", // Lagoon Finance API for live alpUSD price
    alUsdPrice: 1.0243, // alUSD price - will be updated with live price from Lagoon API
    alpUsdPrice: 1.01, // alpUSD price - will be updated with live price from Lagoon API
    usdcPrice: 1.00 // USDC = $1.00
};

/**
 * Note: Live alUSD and alpUSD prices are fetched by the serverless function
 * to avoid CORS issues. The prices are returned as part of the TVL data.
 * The serverless function handles both Lagoon Finance API calls.
 */

/**
 * Fetch TVL data from backend API
 * @returns {Promise<Object>} TVL breakdown data
 */
async function fetchTvlData() {
    try {
        // Note: Live prices are fetched by the serverless function to avoid CORS
        console.log('📊 Fetching TVL data from serverless function...');
        
        // Fetch data from backend API FIRST to get live prices
        console.log('🚀 Fetching TVL data from backend API...');
        const backendResponse = await fetch('/.netlify/functions/get-tvl-data');
        const backendData = await backendResponse.json();
        
        if (!backendData.success || !backendData.data) {
            console.error('❌ Backend API returned error:', backendData.error);
            throw new Error(backendData.error || 'Backend API failed');
        }
        
        console.log('✅ Backend API response:', backendData.data);
        
        // Extract live prices from backend response and update config
        const liveAlUsdPrice = backendData.data.liveAlUsdPrice || ALMANAK_POINTS_CONFIG.alUsdPrice;
        const liveAlpUsdPrice = backendData.data.liveAlpUsdPrice || ALMANAK_POINTS_CONFIG.alpUsdPrice;
        
        // Update the config with live prices
        ALMANAK_POINTS_CONFIG.alUsdPrice = liveAlUsdPrice;
        ALMANAK_POINTS_CONFIG.alpUsdPrice = liveAlpUsdPrice;
        
        console.log('✅ Using live alUSD price:', liveAlUsdPrice);
        console.log('✅ Using live alpUSD price:', liveAlpUsdPrice);
        
        // Extract data from backend
        const alUsdSupply = backendData.data.alUsdSupply || 0;
        const alpUsdSupply = backendData.data.alpUsdSupply || 0;
        const syAlUsdBalance = backendData.data.syAlUsdBalance || 0;
        const ytTotalSupplyOct23 = backendData.data.ytTotalSupplyOct23 || 0;
        const ytTotalSupplyDec11 = backendData.data.ytTotalSupplyDec11 || 0;
        const curveTvl = backendData.data.curveTvl || 0;
        
        console.log('✅ YT Supply (Oct 23) from backend:', ytTotalSupplyOct23);
        console.log('✅ YT Supply (Dec 11) from backend:', ytTotalSupplyDec11);
        
        // Check maturity status for each market
        const isOct23Matured = isMarketMatured('oct23');
        const isDec11Matured = isMarketMatured('dec11');
        
        console.log('📅 Market Maturity Status:', {
            oct23Matured: isOct23Matured,
            dec11Matured: isDec11Matured
        });
        
        // Now create results object with all the data
        const results = {
            alUsdSupply: alUsdSupply,
            alpUsdSupply: alpUsdSupply,
            syAlUsdBalance: syAlUsdBalance,
            defiLlamaTvl: 0, // Will be calculated below
            usdcBalance: 0,
            usdtBalance: 0,
            curveTvl: curveTvl,
            // Separate data for each market
            pendleOct23: {
                lpTvl: 0,
                ytTvl: 0,
                ptTvl: 0,
                isMatured: isOct23Matured,
                // Track actual locked TVL even if matured (for visibility & calculations)
                lockedLpTvl: 0,
                lockedYtTvl: 0
            },
            pendleDec11: {
                lpTvl: 0,
                ytTvl: 0,
                ptTvl: 0,
                isMatured: isDec11Matured,
                lockedLpTvl: 0,
                lockedYtTvl: 0
            },
            // Legacy fields (sum of both markets for backward compatibility)
            pendleLpTvl: 0,
            pendleYtTvl: 0,
            pendlePtTvl: 0,
            otherTvl: 0,
            totalTvl: 0,
            liveAlUsdPrice: liveAlUsdPrice,
            liveAlpUsdPrice: liveAlpUsdPrice
        };
        
        // Calculate gross TVL from token supplies (before SY subtraction)
        // Formula: (alUSD supply × live alUSD price) + (alpUSD supply × live alpUSD price)
        results.defiLlamaTvl = (alUsdSupply * liveAlUsdPrice) + 
                               (alpUsdSupply * liveAlpUsdPrice);
        
        // Store gross TVL before SY subtraction
        results.grossTvl = results.defiLlamaTvl;
        
        // Get Pendle market data for BOTH markets
        try {
            // Fetch October 23 market data
            const marketResponseOct23 = await getMarketData(PENDLE_CONFIG.MARKET_OCT23.address);
            if (marketResponseOct23.success && marketResponseOct23.data.liquidity) {
                const totalPtOct23 = marketResponseOct23.data.totalPt || 0;
                const ptPriceOct23 = marketResponseOct23.data.assetPriceUsd || liveAlUsdPrice;
                const actualLpTvl = marketResponseOct23.data.liquidity.usd || 0;
                const actualYtTvl = ytTotalSupplyOct23 * liveAlUsdPrice;
                
                // Store actual locked TVL for visibility
                results.pendleOct23.lockedLpTvl = actualLpTvl;
                results.pendleOct23.lockedYtTvl = actualYtTvl;
                
                // If matured: YT shows as $0, LP shows actual (for migration tracking)
                if (isOct23Matured) {
                    results.pendleOct23.lpTvl = actualLpTvl; // Keep showing LP TVL for visibility
                    results.pendleOct23.ytTvl = 0; // YT value is $0 at maturity
                    console.log('⚠️ October 23 Market MATURED - Locked LP:', actualLpTvl, 'Locked YT:', actualYtTvl, '(shown as $0)');
                } else {
                    results.pendleOct23.lpTvl = actualLpTvl;
                    results.pendleOct23.ytTvl = actualYtTvl;
                    console.log('✅ October 23 Market - LP:', results.pendleOct23.lpTvl, 'YT:', results.pendleOct23.ytTvl);
                }
                
                results.pendleOct23.ptTvl = totalPtOct23 * ptPriceOct23; // EXCLUDED from points
            }
            
            // Fetch December 11 market data
            const marketResponseDec11 = await getMarketData(PENDLE_CONFIG.MARKET_DEC11.address);
            if (marketResponseDec11.success && marketResponseDec11.data.liquidity) {
                const totalPtDec11 = marketResponseDec11.data.totalPt || 0;
                const ptPriceDec11 = marketResponseDec11.data.assetPriceUsd || liveAlUsdPrice;
                const actualLpTvl = marketResponseDec11.data.liquidity.usd || 0;
                const actualYtTvl = ytTotalSupplyDec11 * liveAlUsdPrice;
                
                // Store actual locked TVL for visibility
                results.pendleDec11.lockedLpTvl = actualLpTvl;
                results.pendleDec11.lockedYtTvl = actualYtTvl;
                
                // If matured: YT shows as $0, LP shows actual (for migration tracking)
                if (isDec11Matured) {
                    results.pendleDec11.lpTvl = actualLpTvl;
                    results.pendleDec11.ytTvl = 0; // YT value is $0 at maturity
                    console.log('⚠️ December 11 Market MATURED - Locked LP:', actualLpTvl, 'Locked YT:', actualYtTvl, '(shown as $0)');
                } else {
                    results.pendleDec11.lpTvl = actualLpTvl;
                    results.pendleDec11.ytTvl = actualYtTvl;
                    console.log('✅ December 11 Market - LP:', results.pendleDec11.lpTvl, 'YT:', results.pendleDec11.ytTvl);
                }
                
                results.pendleDec11.ptTvl = totalPtDec11 * ptPriceDec11; // EXCLUDED from points
            }
            
            // Calculate combined totals for backward compatibility
            results.pendleLpTvl = results.pendleOct23.lpTvl + results.pendleDec11.lpTvl;
            results.pendleYtTvl = results.pendleOct23.ytTvl + results.pendleDec11.ytTvl;
            results.pendlePtTvl = results.pendleOct23.ptTvl + results.pendleDec11.ptTvl;
            
        } catch (error) {
            console.error("Pendle Market API Error:", error);
        }
        
        // Calculate total TVL = Gross TVL - SY alUSD (to avoid double counting)
        const syAlUsdValue = syAlUsdBalance * liveAlUsdPrice;
        results.totalTvl = results.defiLlamaTvl - syAlUsdValue;
        
        // Calculate Other TVL (NET TVL for points allocation)
        // Other TVL = Holders NOT using DeFi (not in Pendle, not in Curve)
        // Formula: GROSS TVL - SY alUSD = NET TVL
        // Note: SY alUSD already includes assets from BOTH active AND matured markets
        // We don't need to subtract matured market TVL again (would be double counting)
        // Matured markets get 0x boost in points calculation, but their TVL still counts for visibility
        results.otherTvl = results.grossTvl - syAlUsdValue;
        
        console.log('📊 TVL Calculation:', {
            grossTvl: results.grossTvl,
            syAlUsdValue: syAlUsdValue,
            otherTvl: results.otherTvl,
            oct23Matured: isOct23Matured,
            dec11Matured: isDec11Matured
        });
        
        return {
            success: true,
            data: results
        };
        
    } catch (error) {
        console.error("TVL Fetch Error:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Calculate weighted TVL for points distribution
 * Apply boost multipliers to each category:
 * - Other: 1x (no boost)
 * - LP: 1.25x (separate for each market, 0x if matured)
 * - YT: 5x (separate for each market, 0x if matured)
 * - Curve: 3x
 * Matured markets receive 0x boost (no points)
 * @param {Object} tvlData - TVL breakdown data
 * @returns {Object} Weighted TVL calculation with separate market data
 */
function calculateWeightedTvl(tvlData) {
    // Check maturity status for boost calculation
    const isOct23Matured = tvlData.pendleOct23.isMatured || false;
    const isDec11Matured = tvlData.pendleDec11.isMatured || false;
    
    // Calculate weighted values for October 23 market
    // If matured: 0x boost (no points earned)
    const ytCountOct23 = tvlData.pendleOct23.ytTvl / ALMANAK_POINTS_CONFIG.alUsdPrice;
    const lpBoostOct23 = isOct23Matured ? 0 : 1.25;  // 0x if matured, 1.25x if active
    const ytBoostOct23 = isOct23Matured ? 0 : 5;     // 0x if matured, 5x if active
    const weightedLpOct23 = tvlData.pendleOct23.lpTvl * lpBoostOct23;
    const weightedYtOct23 = (ytCountOct23 * ALMANAK_POINTS_CONFIG.alUsdPrice) * ytBoostOct23;
    
    // Calculate weighted values for December 11 market
    // If matured: 0x boost (no points earned)
    const ytCountDec11 = tvlData.pendleDec11.ytTvl / ALMANAK_POINTS_CONFIG.alUsdPrice;
    const lpBoostDec11 = isDec11Matured ? 0 : 1.25;  // 0x if matured, 1.25x if active
    const ytBoostDec11 = isDec11Matured ? 0 : 5;     // 0x if matured, 5x if active
    const weightedLpDec11 = tvlData.pendleDec11.lpTvl * lpBoostDec11;
    const weightedYtDec11 = (ytCountDec11 * ALMANAK_POINTS_CONFIG.alUsdPrice) * ytBoostDec11;
    
    // Calculate weighted values for other categories
    const weightedOther = tvlData.otherTvl * 1;  // 1x boost (no boost)
    const weightedCurve = tvlData.curveTvl * 3;  // 3x boost
    
    // Combined weighted values (for backward compatibility)
    const weightedLp = weightedLpOct23 + weightedLpDec11;
    const weightedYt = weightedYtOct23 + weightedYtDec11;
    
    // Total weighted TVL = sum of all weighted categories
    const totalWeightedTvl = weightedOther + weightedLp + weightedYt + weightedCurve;
    
    if (isOct23Matured || isDec11Matured) {
        console.log('⚠️ Matured Markets Detected - Points Distribution Adjusted:', {
            oct23Matured: isOct23Matured,
            dec11Matured: isDec11Matured,
            oct23WeightedLp: weightedLpOct23,
            oct23WeightedYt: weightedYtOct23,
            dec11WeightedLp: weightedLpDec11,
            dec11WeightedYt: weightedYtDec11
        });
    }
    
    return {
        // Separate market data
        oct23: {
            ytTvl: tvlData.pendleOct23.ytTvl,
            lpTvl: tvlData.pendleOct23.lpTvl,
            ptTvl: tvlData.pendleOct23.ptTvl,
            isMatured: isOct23Matured,
            lockedYtTvl: tvlData.pendleOct23.lockedYtTvl || 0,
            lockedLpTvl: tvlData.pendleOct23.lockedLpTvl || 0,
            weightedYt: weightedYtOct23,
            weightedLp: weightedLpOct23,
            ytBoost: ytBoostOct23,
            lpBoost: lpBoostOct23
        },
        dec11: {
            ytTvl: tvlData.pendleDec11.ytTvl,
            lpTvl: tvlData.pendleDec11.lpTvl,
            ptTvl: tvlData.pendleDec11.ptTvl,
            isMatured: isDec11Matured,
            lockedYtTvl: tvlData.pendleDec11.lockedYtTvl || 0,
            lockedLpTvl: tvlData.pendleDec11.lockedLpTvl || 0,
            weightedYt: weightedYtDec11,
            weightedLp: weightedLpDec11,
            ytBoost: ytBoostDec11,
            lpBoost: lpBoostDec11
        },
        // Combined/shared data
        otherTvl: tvlData.otherTvl,
        ytTvl: tvlData.pendleYtTvl,  // Combined for backward compatibility
        lpTvl: tvlData.pendleLpTvl,  // Combined for backward compatibility
        curveTvl: tvlData.curveTvl,
        weightedOther: weightedOther,
        weightedYt: weightedYt,  // Combined
        weightedLp: weightedLp,  // Combined
        weightedCurve: weightedCurve,
        totalWeightedTvl: totalWeightedTvl,
        totalTvl: tvlData.totalTvl
    };
}

/**
 * Calculate daily points for a given amount based on TVL position
 * @param {number} amount - User's YT amount
 * @param {Object} weightedTvl - Weighted TVL data
 * @param {string} type - Type of position ('yt', 'lp', 'other')
 * @returns {Object} Daily points breakdown with Pendle fees
 */
function calculateDailyPoints(amount, weightedTvl, type = 'yt') {
    const boost = ALMANAK_POINTS_CONFIG.boosts[type];
    const weightedAmount = amount * boost;
    const pointsShare = weightedAmount / weightedTvl.totalWeightedTvl;
    const grossDailyPoints = pointsShare * ALMANAK_POINTS_CONFIG.dailyPoints;
    
    // Pendle takes 5% fee ONLY from YT points (not from overall points)
    let pendleFee = 0;
    let netDailyPoints = grossDailyPoints;
    
    if (type === 'yt') {
        pendleFee = grossDailyPoints * 0.05;
        netDailyPoints = grossDailyPoints * 0.95;
    }
    
    return {
        gross: grossDailyPoints,
        pendleFee: pendleFee,
        net: netDailyPoints
    };
}

/**
 * Calculate Almanak points APY for different FDV scenarios (NEW SYSTEM)
 * @param {number} daysToMaturity - Days remaining until maturity
 * @param {Object} weightedTvl - Weighted TVL data
 * @returns {Array} Array of FDV scenarios with APY and earnings
 */
function calculateAlmanakPointsApy(daysToMaturity, weightedTvl) {
    const scenarios = [];
    
    ALMANAK_POINTS_CONFIG.fdvScenarios.forEach(fdv => {
        scenarios.push({
            fdv: fdv,
            tokenPrice: (fdv * 1000000) / ALMANAK_POINTS_CONFIG.totalSupply,
            weightedTvl: weightedTvl
        });
    });
    
    return scenarios;
}

/**
 * Calculate earnings for Almanak points at different FDV scenarios (NEW SYSTEM)
 * @param {number} ytAmount - YT amount received (not input amount)
 * @param {number} daysToMaturity - Days remaining until maturity
 * @param {Object} weightedTvl - Weighted TVL data
 * @param {number} underlyingApy - Annual underlying APY (as decimal)
 * @param {number} initialInvestment - Initial alUSD investment amount
 * @returns {Array} Array of scenarios with earnings calculations
 */
function calculateAlmanakPointsEarnings(ytAmount, daysToMaturity, weightedTvl, underlyingApy, initialInvestment) {
    // Calculate daily points for the user's YT position (returns object with gross, pendleFee, net)
    const dailyPointsBreakdown = calculateDailyPoints(ytAmount, weightedTvl, 'yt');
    
    // Total points earned until maturity (use NET points after Pendle fee)
    const totalGrossPoints = dailyPointsBreakdown.gross * daysToMaturity;
    const totalPendleFee = dailyPointsBreakdown.pendleFee * daysToMaturity;
    const totalNetPoints = dailyPointsBreakdown.net * daysToMaturity;
    
    // Calculate daily underlying yield earnings
    const dailyUnderlyingYield = ytAmount * (underlyingApy / 365);
    
    // Calculate underlying yield earnings at maturity
    const totalUnderlyingYield = dailyUnderlyingYield * daysToMaturity;
    
    // Calculate earnings for each FDV scenario
    return ALMANAK_POINTS_CONFIG.fdvScenarios.map(fdv => {
        const tokenPrice = (fdv * 1000000) / ALMANAK_POINTS_CONFIG.totalSupply;
        const pointsUsdValue = totalNetPoints * tokenPrice; // Use NET points after fee
        const pendleFeeUsdValue = totalPendleFee * tokenPrice; // Value of Pendle fee
        
        // Total earnings = NET points value + underlying yield
        const totalEarnings = pointsUsdValue + totalUnderlyingYield;
        
        // Calculate TRUE ROI accounting for loss of principal (YT → 0)
        // ROI = (Total Earnings - Initial Investment) / Initial Investment × 100%
        // Positive ROI = profit, Negative ROI = loss
        const roi = initialInvestment > 0 ? ((totalEarnings - initialInvestment) / initialInvestment) * 100 : 0;
        
        // Calculate breakeven time
        // Daily total earnings = daily NET points value + daily underlying yield
        const dailyPointsValue = dailyPointsBreakdown.net * tokenPrice;
        const dailyTotalEarnings = dailyPointsValue + dailyUnderlyingYield;
        const breakevenDays = dailyTotalEarnings > 0 ? initialInvestment / dailyTotalEarnings : Infinity;
        
        // Check if breakeven by maturity
        let breakevenStatus = '';
        if (roi < 0 || breakevenDays === Infinity || breakevenDays <= 0) {
            // If at a loss at maturity or mathematically impossible
            breakevenStatus = 'No breakeven';
        } else {
            // Always show the actual breakeven days, even if it exceeds maturity
            breakevenStatus = `${Math.ceil(breakevenDays)} days`;
        }
        
        return {
            fdv: fdv,
            tokenPrice: tokenPrice,
            dailyPoints: dailyPointsBreakdown.net, // NET daily points
            dailyGrossPoints: dailyPointsBreakdown.gross, // GROSS daily points
            dailyPendleFee: dailyPointsBreakdown.pendleFee, // Daily Pendle fee
            totalPoints: totalNetPoints, // NET total points
            totalGrossPoints: totalGrossPoints, // GROSS total points
            totalPendleFee: totalPendleFee, // Total Pendle fee in points
            pendleFeeUsdValue: pendleFeeUsdValue, // Pendle fee USD value
            pointsUsdValue: pointsUsdValue, // NET points USD value
            underlyingYieldValue: totalUnderlyingYield,
            totalEarnings: totalEarnings,
            roiPercentage: roi.toFixed(2),
            earningsFormatted: `$${totalEarnings.toFixed(2)}`,
            breakevenDays: breakevenDays,
            breakevenStatus: breakevenStatus,
            isProfit: roi >= 0
        };
    });
}

// Export functions for use in other files
window.PendleAPI = {
    calculateMoonshot,
    formatApiResponse,
    getMarketData,
    getAllMarketsData,
    isMarketMatured,
    getDaysToMaturity,
    calculateMaturityApy,
    calculateMaturityEarnings,
    fetchTvlData,
    calculateWeightedTvl,
    calculateDailyPoints,
    calculateAlmanakPointsApy,
    calculateAlmanakPointsEarnings,
    toWei,
    formatFromWei,
    PENDLE_CONFIG,
    ALMANAK_POINTS_CONFIG
};
