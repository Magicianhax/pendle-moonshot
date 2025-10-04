// Pendle API Integration Module

/**
 * Configuration for Pendle API
 */
const PENDLE_CONFIG = {
    API_URL: "https://api-v2.pendle.finance/limit-order/v2/limit-order/market-order",
    MARKET_API_URL: "https://api-v2.pendle.finance/core/v2/1/markets",
    CHAIN_ID: 1,
    MARKET: "0x79f06a8dc564717a9ad418049d0be9a60f2646c0",
    CAPPED_AMOUNT: "138107596043615446631225",
    TYPE: 2,
    MATURITY_DATE: "2025-10-23T00:00:00.000Z"
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
 * @returns {Promise<Object>} API response with trade data
 */
async function calculateMoonshot(amount) {
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
        
        // Debug logging for large amounts
        if (numAmount >= 1000) {
            console.log('Large amount conversion:', {
                input: amount,
                wei: netFromTakerWei,
                weiLength: netFromTakerWei.length
            });
        }
        
        // Prepare API request payload
        const payload = {
            chainId: PENDLE_CONFIG.CHAIN_ID,
            market: PENDLE_CONFIG.MARKET,
            netFromTaker: netFromTakerWei,
            type: PENDLE_CONFIG.TYPE,
            cappedAmountToMarket: PENDLE_CONFIG.CAPPED_AMOUNT
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
 * @returns {Promise<Object>} Market data response
 */
async function getMarketData() {
    try {
        const response = await fetch(`${PENDLE_CONFIG.MARKET_API_URL}/${PENDLE_CONFIG.MARKET}/data`, {
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
 * Calculate days remaining until maturity using UTC time
 * @returns {number} Days remaining
 */
function getDaysToMaturity() {
    // Get current UTC date
    const now = new Date();
    
    // Parse maturity date (already in UTC)
    const maturityDate = new Date(PENDLE_CONFIG.MATURITY_DATE);
    
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
    fdvScenarios: [90, 200, 250, 300, 350, 400, 450, 500], // FDV scenarios in millions
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
    ytToken: "0xd7c3fc198Bd7A50B99629cfe302006E9224f087b", // YT-alUSD token contract
    // Curve pool tracking
    curvePoolAddress: "0x463626cF9028d96eAd5084954FF634f813D5fFB9", // Curve pool address for balance tracking (gets 3x points)
    alUsdToken: "0xDCD0f5ab30856F28385F641580Bbd85f88349124", // alUSD token contract for tracking
    alpUsdToken: "0x5a97b0b97197299456af841f8605543b13b12ee3", // alpUSD token contract
    syContractAddress: "0x8e5e017d6b3F567623B5d4a690a2a686bF7BA515", // SY contract where alUSD is deposited (to subtract from TVL)
    alUsdPrice: 1.0243, // alUSD ≈ $1.0243
    alpUsdPrice: 1.01, // alpUSD ≈ $1.01
    usdcPrice: 1.00 // USDC = $1.00
};

/**
 * Fetch TVL data from backend API
 * @returns {Promise<Object>} TVL breakdown data
 */
async function fetchTvlData() {
    try {
        const results = {
            alUsdSupply: 0,
            alpUsdSupply: 0,
            syAlUsdBalance: 0, // alUSD locked in SY contract (to subtract from TVL)
            defiLlamaTvl: 0, // Now calculated from alUSD + alpUSD supplies - SY balance
            usdcBalance: 0,
            usdtBalance: 0,
            curveTvl: 0, // Curve pool TVL with 3x boost
            pendleLpTvl: 0,
            pendleYtTvl: 0,
            pendlePtTvl: 0, // PT TVL - excluded from points
            otherTvl: 0,
            totalTvl: 0
        };
        
        // Fetch data from backend API
        console.log('🚀 Fetching TVL data from backend API...');
        const backendResponse = await fetch('/.netlify/functions/get-tvl-data');
        const backendData = await backendResponse.json();
        
        if (backendData.success && backendData.data) {
            console.log('✅ Backend API response:', backendData.data);
            
            // Extract data from backend
            const alUsdSupply = backendData.data.alUsdSupply || 0;
            const alpUsdSupply = backendData.data.alpUsdSupply || 0;
            const syAlUsdBalance = backendData.data.syAlUsdBalance || 0;
            const ytTotalSupply = backendData.data.ytTotalSupply || 0;
            
            // Store supplies and SY balance
            results.alUsdSupply = alUsdSupply;
            results.alpUsdSupply = alpUsdSupply;
            results.syAlUsdBalance = syAlUsdBalance;
            
            // Store Curve TVL from backend
            results.curveTvl = backendData.data.curveTvl || 0;
            console.log('✅ YT Supply from backend:', ytTotalSupply);
        } else {
            console.error('❌ Backend API returned error:', backendData.error);
            throw new Error(backendData.error || 'Backend API failed');
        }
        
        // Calculate gross TVL from token supplies (before SY subtraction)
        // Formula: (alUSD supply × $1.0243) + (alpUSD supply × $1.01)
        const alUsdSupply = results.alUsdSupply;
        const alpUsdSupply = results.alpUsdSupply;
        const syAlUsdBalance = results.syAlUsdBalance;
        const ytTotalSupply = backendData.data.ytTotalSupply || 0;
        
        results.defiLlamaTvl = (alUsdSupply * ALMANAK_POINTS_CONFIG.alUsdPrice) + 
                               (alpUsdSupply * ALMANAK_POINTS_CONFIG.alpUsdPrice);
        
        // Store gross TVL before SY subtraction
        results.grossTvl = results.defiLlamaTvl;
        
        // Get Pendle market data for LP and PT TVL
        try {
            const marketResponse = await getMarketData();
            if (marketResponse.success && marketResponse.data.liquidity) {
                const totalPt = marketResponse.data.totalPt || 0;
                const ptPrice = marketResponse.data.assetPriceUsd || ALMANAK_POINTS_CONFIG.alUsdPrice; // PT price from API
                
                // LP TVL from Pendle market
                results.pendleLpTvl = marketResponse.data.liquidity.usd || 0;
                
                // YT TVL - Using ACTUAL YT supply from Etherscan
                // YT holders get 5x boost
                // For points calculation: 1 YT = 1 alUSD = $1.02 (fixed price)
                results.pendleYtTvl = ytTotalSupply * ALMANAK_POINTS_CONFIG.alUsdPrice;
                
                // PT TVL - MUST BE EXCLUDED from points calculation
                // PT holders get ZERO points, so we subtract this from total
                // Using actual PT price from Pendle API
                results.pendlePtTvl = totalPt * ptPrice;
            }
        } catch (error) {
            console.error("Pendle Market API Error:", error);
        }
        
        // Calculate total TVL = Gross TVL - SY alUSD (to avoid double counting)
        const syAlUsdValue = results.syAlUsdBalance * ALMANAK_POINTS_CONFIG.alUsdPrice;
        results.totalTvl = results.defiLlamaTvl - syAlUsdValue;
        
        // Calculate Other TVL
        // Other TVL = Everything NOT in Pendle (SY, LP) and NOT in Curve
        // Other TVL = Gross TVL - SY alUSD - LP TVL - Curve TVL
        results.otherTvl = results.grossTvl - syAlUsdValue - results.pendleLpTvl - results.curveTvl;
        
        // Ensure non-negative values
        results.otherTvl = Math.max(0, results.otherTvl);
        
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
 * - LP: 1.25x
 * - YT: 5x (using YT count × $1.0243)
 * - Curve: 3x
 * @param {Object} tvlData - TVL breakdown data
 * @returns {Object} Weighted TVL calculation
 */
function calculateWeightedTvl(tvlData) {
    // Get YT count from YT TVL (reverse the pricing to get token count)
    const ytCount = tvlData.pendleYtTvl / ALMANAK_POINTS_CONFIG.alUsdPrice;
    
    // Apply boost multipliers to each category
    const weightedOther = tvlData.otherTvl * 1;  // 1x boost (no boost)
    const weightedLp = tvlData.pendleLpTvl * 1.25;  // 1.25x boost
    const weightedYt = (ytCount * ALMANAK_POINTS_CONFIG.alUsdPrice) * 5;  // (YT × $1.0243) × 5
    const weightedCurve = tvlData.curveTvl * 3;  // 3x boost
    
    // Total weighted TVL = sum of all weighted categories
    const totalWeightedTvl = weightedOther + weightedLp + weightedYt + weightedCurve;
    
    return {
        otherTvl: tvlData.otherTvl,
        ytTvl: tvlData.pendleYtTvl,
        lpTvl: tvlData.pendleLpTvl,
        curveTvl: tvlData.curveTvl,
        weightedOther: weightedOther,
        weightedYt: weightedYt,
        weightedLp: weightedLp,
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
 * @returns {number} Daily points earned
 */
function calculateDailyPoints(amount, weightedTvl, type = 'yt') {
    const boost = ALMANAK_POINTS_CONFIG.boosts[type];
    const weightedAmount = amount * boost;
    const pointsShare = weightedAmount / weightedTvl.totalWeightedTvl;
    const dailyPoints = pointsShare * ALMANAK_POINTS_CONFIG.dailyPoints;
    
    return dailyPoints;
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
    // Calculate daily points for the user's YT position
    const dailyPoints = calculateDailyPoints(ytAmount, weightedTvl, 'yt');
    
    // Total points earned until maturity
    const totalPoints = dailyPoints * daysToMaturity;
    
    // Calculate daily underlying yield earnings
    const dailyUnderlyingYield = ytAmount * (underlyingApy / 365);
    
    // Calculate underlying yield earnings at maturity
    const totalUnderlyingYield = dailyUnderlyingYield * daysToMaturity;
    
    // Calculate earnings for each FDV scenario
    return ALMANAK_POINTS_CONFIG.fdvScenarios.map(fdv => {
        const tokenPrice = (fdv * 1000000) / ALMANAK_POINTS_CONFIG.totalSupply;
        const pointsUsdValue = totalPoints * tokenPrice;
        
        // Total earnings = points value + underlying yield
        const totalEarnings = pointsUsdValue + totalUnderlyingYield;
        
        // Calculate TRUE ROI accounting for loss of principal (YT → 0)
        // ROI = (Total Earnings - Initial Investment) / Initial Investment × 100%
        // Positive ROI = profit, Negative ROI = loss
        const roi = initialInvestment > 0 ? ((totalEarnings - initialInvestment) / initialInvestment) * 100 : 0;
        
        // Calculate breakeven time
        // Daily total earnings = daily points value + daily underlying yield
        const dailyPointsValue = dailyPoints * tokenPrice;
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
            dailyPoints: dailyPoints,
            totalPoints: totalPoints,
            pointsUsdValue: pointsUsdValue,
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
