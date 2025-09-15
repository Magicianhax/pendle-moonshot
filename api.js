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
    return (parseFloat(amount) * Math.pow(10, 18)).toString();
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

        // Convert amount to wei
        const netFromTakerWei = toWei(amount);
        
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
    const marketTrade = data.marketTrade || data.totalTrade;

    // Calculate return metrics
    const netFromTaker = parseFloat(marketTrade.netFromTaker);
    const netToTaker = parseFloat(marketTrade.netToTaker);
    const fee = parseFloat(marketTrade.fee);
    
    // Calculate potential return percentage based on YT value vs input
    // This should show the actual return from the trade, not the ratio
    // For now, we'll show 0% as the trade is 1:1 alUSD to YT with fees
    const returnPercentage = "0.00";

    return {
        success: true,
        formatted: {
            inputAmount: `${inputAmount} alUSD`,
            netFromTaker: `${formatFromWei(marketTrade.netFromTaker)} alUSD`,
            netToTaker: `${formatFromWei(marketTrade.netToTaker, 6)} YT`,
            fee: `${formatFromWei(marketTrade.fee)} alUSD`,
            potentialReturn: `${returnPercentage}%`,
            rawData: {
                netFromTaker: netFromTaker,
                netToTaker: netToTaker,
                fee: fee,
                returnPercentage: returnPercentage
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
                tradingVolume: data.tradingVolume
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
 * Calculate earnings at maturity for a given amount
 * @param {number} amount - Input amount in alUSD
 * @param {number} maturityApy - Projected APY at maturity (as decimal)
 * @returns {Object} Earnings calculation
 */
function calculateMaturityEarnings(amount, maturityApy) {
    // YT tokens turn to 0 at maturity, you only get the yield
    const earnings = amount * maturityApy;
    const totalValue = earnings; // Only the yield, not principal + yield
    
    return {
        initialAmount: amount,
        earnings: earnings,
        totalValue: totalValue, // This is just the yield amount
        apyPercentage: (maturityApy * 100).toFixed(3)
    };
}

/**
 * Almanak Points APY Configuration
 * Base APY: 21.68% at 90M FDV
 * APY scales with FDV (higher FDV = higher APY)
 * Points are separate from underlying yield - 1 point = 1 Almanak token
 * Total supply: 1B tokens
 */
const ALMANAK_POINTS_CONFIG = {
    baseFdv: 90, // 90M FDV
    baseApy: 0.2168, // 21.68% APY (points APY, not underlying)
    totalSupply: 1000000000, // 1B tokens
    fdvScenarios: [90, 150, 200, 250, 300, 350, 400, 450, 500] // FDV scenarios in millions
};

/**
 * Calculate Almanak points APY for different FDV scenarios
 * @param {number} daysToMaturity - Days remaining until maturity
 * @returns {Array} Array of FDV scenarios with APY and earnings
 */
function calculateAlmanakPointsApy(daysToMaturity) {
    const scenarios = [];
    
    ALMANAK_POINTS_CONFIG.fdvScenarios.forEach(fdv => {
        // Calculate APY scaling: APY = baseApy * (currentFdv / baseFdv)
        // This assumes APY scales with FDV (higher FDV = higher APY)
        const scaledApy = ALMANAK_POINTS_CONFIG.baseApy * (fdv / ALMANAK_POINTS_CONFIG.baseFdv);
        
        // Calculate maturity APY for the remaining days
        const maturityApy = calculateMaturityApy(scaledApy, daysToMaturity);
        
        scenarios.push({
            fdv: fdv,
            annualApy: scaledApy,
            maturityApy: maturityApy,
            apyPercentage: (scaledApy * 100).toFixed(2),
            maturityPercentage: (maturityApy * 100).toFixed(3)
        });
    });
    
    return scenarios;
}

/**
 * Calculate earnings for Almanak points at different FDV scenarios
 * @param {number} ytAmount - YT amount received (not input amount)
 * @param {number} daysToMaturity - Days remaining until maturity
 * @returns {Array} Array of scenarios with earnings calculations
 */
function calculateAlmanakPointsEarnings(ytAmount, daysToMaturity) {
    const scenarios = calculateAlmanakPointsApy(daysToMaturity);
    
    return scenarios.map(scenario => {
        // Almanak points earnings are based on YT amount, not input amount
        // YT tokens are what you get for speculating on points by forfeiting yield
        const pointsEarnings = ytAmount * scenario.maturityApy;
        
        // Calculate USD value based on FDV
        // Assuming token price scales with FDV (FDV / total supply)
        const tokenPrice = (scenario.fdv * 1000000) / ALMANAK_POINTS_CONFIG.totalSupply; // Price per token
        const usdValue = pointsEarnings * tokenPrice;
        
        return {
            ...scenario,
            ytAmount: ytAmount,
            pointsEarnings: pointsEarnings,
            tokenPrice: tokenPrice,
            usdValue: usdValue,
            earningsFormatted: `$${usdValue.toFixed(2)}`
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
    calculateAlmanakPointsApy,
    calculateAlmanakPointsEarnings,
    toWei,
    formatFromWei,
    PENDLE_CONFIG,
    ALMANAK_POINTS_CONFIG
};
