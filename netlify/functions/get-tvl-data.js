// Netlify Function to fetch TVL data from Etherscan
// This runs server-side to avoid CORS and rate limiting issues

const ALMANAK_CONFIG = {
    etherscanApiKey: "NDP4JRZEF2QUCXSQMGNVRUG81KTHEPMCH6",
    alUsdToken: "0xDCD0f5ab30856F28385F641580Bbd85f88349124",
    alpUsdToken: "0x5a97b0b97197299456af841f8605543b13b12ee3",
    // Pendle YT tokens for both markets
    ytTokenOct23: "0xd7c3fc198Bd7A50B99629cfe302006E9224f087b", // YT-alUSD October 23
    ytTokenDec11: "0xBA31C7c0189E9B6ab6CF6b27CD3D1A4D6d3d0Fd6", // YT-alUSD December 11
    syContractAddress: "0x8e5e017d6b3F567623B5d4a690a2a686bF7BA515",
    usdcToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    curvePoolAddress: "0x463626cF9028d96eAd5084954FF634f813D5fFB9",
    lagoonAlUsdApiUrl: "https://app.lagoon.finance/api/vaults?chainId=1&vault=0xDCD0f5ab30856F28385F641580Bbd85f88349124",
    lagoonAlpUsdApiUrl: "https://app.lagoon.finance/api/vaults?chainId=1&vault=0x5a97B0B97197299456Af841F8605543b13b12eE3",
    alUsdPrice: 1.0243, // Fallback price if API fails
    alpUsdPrice: 1.01, // Fallback price if API fails
    usdcPrice: 1.00
};

/**
 * Fetch live alUSD price from Lagoon Finance API
 * @returns {Promise<number>} Live alUSD price
 */
async function fetchLiveAlUsdPrice() {
    try {
        const response = await fetch(ALMANAK_CONFIG.lagoonAlUsdApiUrl);
        if (!response.ok) {
            throw new Error(`Lagoon API Error: ${response.status}`);
        }
        const data = await response.json();
        
        // Lagoon API returns: { vaults: [...], totalCount, hasNextPage }
        // Find the alUSD vault by address
        if (data.vaults && Array.isArray(data.vaults)) {
            const alUsdVault = data.vaults.find(v => 
                v.address.toLowerCase() === ALMANAK_CONFIG.alUsdToken.toLowerCase()
            );
            
            if (alUsdVault && alUsdVault.state && alUsdVault.state.pricePerShareUsd) {
                const price = alUsdVault.state.pricePerShareUsd;
                console.log('✅ Live alUSD price from Lagoon:', price);
                return price;
            }
        }
        
        throw new Error('alUSD vault not found in API response');
    } catch (error) {
        console.error('❌ Failed to fetch live alUSD price:', error);
        console.error('Error details:', error.message);
        // Return fallback price if API fails
        return ALMANAK_CONFIG.alUsdPrice;
    }
}

/**
 * Fetch live alpUSD price from Lagoon Finance API
 * @returns {Promise<number>} Live alpUSD price
 */
async function fetchLiveAlpUsdPrice() {
    try {
        const response = await fetch(ALMANAK_CONFIG.lagoonAlpUsdApiUrl);
        if (!response.ok) {
            throw new Error(`Lagoon alpUSD API Error: ${response.status}`);
        }
        const data = await response.json();
        
        // Lagoon API returns: { vaults: [...], totalCount, hasNextPage }
        // Find the alpUSD vault by address
        if (data.vaults && Array.isArray(data.vaults)) {
            const alpUsdVault = data.vaults.find(v => 
                v.address.toLowerCase() === ALMANAK_CONFIG.alpUsdToken.toLowerCase()
            );
            
            if (alpUsdVault && alpUsdVault.state && alpUsdVault.state.pricePerShareUsd) {
                const price = alpUsdVault.state.pricePerShareUsd;
                console.log('✅ Live alpUSD price from Lagoon:', price);
                return price;
            }
        }
        
        throw new Error('alpUSD vault not found in API response');
    } catch (error) {
        console.error('❌ Failed to fetch live alpUSD price:', error);
        console.error('Error details:', error.message);
        // Return fallback price if API fails
        return ALMANAK_CONFIG.alpUsdPrice;
    }
}

// Helper function to add delay between requests (avoid rate limiting)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function with exponential backoff for Etherscan API
async function fetchWithRetry(url, maxRetries = 5, initialDelay = 500) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Attempt ${attempt}/${maxRetries} for: ${url.substring(0, 80)}...`);
            
            const response = await fetch(url);
            const data = await response.json();
            
            // Check if Etherscan returned valid data
            if (data.status === "1" && data.result) {
                console.log(`✅ Success on attempt ${attempt}`);
                return { success: true, data };
            }
            
            // Log Etherscan error message
            if (data.message) {
                console.warn(`⚠️ Etherscan message: ${data.message}`);
            }
            
            // If rate limited or error, wait and retry
            if (attempt < maxRetries) {
                const waitTime = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                await delay(waitTime);
            }
        } catch (error) {
            console.error(`❌ Attempt ${attempt} failed:`, error.message);
            
            if (attempt < maxRetries) {
                const waitTime = initialDelay * Math.pow(2, attempt - 1);
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                await delay(waitTime);
            }
        }
    }
    
    console.error(`❌ All ${maxRetries} attempts failed for URL`);
    return { success: false, data: null };
}

exports.handler = async function(event, context) {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        console.log('💰 Fetching live prices from Lagoon Finance...');
        const liveAlUsdPrice = await fetchLiveAlUsdPrice();
        const liveAlpUsdPrice = await fetchLiveAlpUsdPrice();
        console.log('✅ Using alUSD price:', liveAlUsdPrice);
        console.log('✅ Using alpUSD price:', liveAlpUsdPrice);
        
        console.log('🚀 Fetching TVL data from Etherscan...');
        
        const results = {
            alUsdSupply: 0,
            alpUsdSupply: 0,
            syAlUsdBalance: 0,
            ytTotalSupplyOct23: 0,
            ytTotalSupplyDec11: 0,
            curveUsdcBalance: 0,
            curveAlUsdBalance: 0,  // Expose this for proper Other TVL calculation
            curveTvl: 0,
            liveAlUsdPrice: liveAlUsdPrice,
            liveAlpUsdPrice: liveAlpUsdPrice,
            timestamp: new Date().toISOString()
        };

        // Fetch alUSD total supply (with retry)
        console.log('🔍 Fetching alUSD Supply...');
        const alUsdSupplyUrl = `https://api.etherscan.io/v2/api?chainid=1&module=stats&action=tokensupply&contractaddress=${ALMANAK_CONFIG.alUsdToken}&apikey=${ALMANAK_CONFIG.etherscanApiKey}`;
        const alUsdSupplyResult = await fetchWithRetry(alUsdSupplyUrl, 3, 500);
        
        if (alUsdSupplyResult.success && alUsdSupplyResult.data.result) {
            results.alUsdSupply = parseFloat(alUsdSupplyResult.data.result) / 1e18;
            console.log('✅ alUSD Supply:', results.alUsdSupply);
        }
        await delay(250);

        // Fetch alpUSD total supply (with retry)
        console.log('🔍 Fetching alpUSD Supply...');
        const alpUsdSupplyUrl = `https://api.etherscan.io/v2/api?chainid=1&module=stats&action=tokensupply&contractaddress=${ALMANAK_CONFIG.alpUsdToken}&apikey=${ALMANAK_CONFIG.etherscanApiKey}`;
        const alpUsdSupplyResult = await fetchWithRetry(alpUsdSupplyUrl, 3, 500);
        
        if (alpUsdSupplyResult.success && alpUsdSupplyResult.data.result) {
            results.alpUsdSupply = parseFloat(alpUsdSupplyResult.data.result) / 1e18;
            console.log('✅ alpUSD Supply:', results.alpUsdSupply);
        }
        await delay(250);

        // Fetch SY alUSD balance (CRITICAL - retry with backoff)
        console.log('🔍 Fetching SY alUSD Balance (critical for TVL calculation)...');
        const syBalanceUrl = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokenbalance&contractaddress=${ALMANAK_CONFIG.alUsdToken}&address=${ALMANAK_CONFIG.syContractAddress}&tag=latest&apikey=${ALMANAK_CONFIG.etherscanApiKey}`;
        const syResult = await fetchWithRetry(syBalanceUrl, 5, 500);
        
        if (syResult.success && syResult.data.result) {
            results.syAlUsdBalance = parseFloat(syResult.data.result) / 1e18;
            console.log('✅ SY alUSD Balance:', results.syAlUsdBalance);
        } else {
            console.error('❌ CRITICAL: Failed to fetch SY alUSD Balance after all retries');
            // Set a warning flag but continue
            results.syAlUsdBalanceError = true;
        }
        await delay(250); // Avoid rate limiting

        // Fetch YT total supply for October 23 market
        try {
            const ytSupplyUrlOct23 = `https://api.etherscan.io/v2/api?chainid=1&module=stats&action=tokensupply&contractaddress=${ALMANAK_CONFIG.ytTokenOct23}&apikey=${ALMANAK_CONFIG.etherscanApiKey}`;
            const ytResponseOct23 = await fetch(ytSupplyUrlOct23);
            const ytDataOct23 = await ytResponseOct23.json();
            if (ytDataOct23.status === "1" && ytDataOct23.result) {
                results.ytTotalSupplyOct23 = parseFloat(ytDataOct23.result) / 1e6; // 6 decimals
                console.log('✅ YT Total Supply (Oct 23):', results.ytTotalSupplyOct23);
            } else {
                console.error('❌ YT Supply (Oct 23) failed:', ytDataOct23);
            }
        } catch (error) {
            console.error("❌ YT Supply (Oct 23) Error:", error);
        }
        await delay(250); // Avoid rate limiting

        // Fetch YT total supply for December 11 market
        try {
            const ytSupplyUrlDec11 = `https://api.etherscan.io/v2/api?chainid=1&module=stats&action=tokensupply&contractaddress=${ALMANAK_CONFIG.ytTokenDec11}&apikey=${ALMANAK_CONFIG.etherscanApiKey}`;
            const ytResponseDec11 = await fetch(ytSupplyUrlDec11);
            const ytDataDec11 = await ytResponseDec11.json();
            if (ytDataDec11.status === "1" && ytDataDec11.result) {
                results.ytTotalSupplyDec11 = parseFloat(ytDataDec11.result) / 1e6; // 6 decimals
                console.log('✅ YT Total Supply (Dec 11):', results.ytTotalSupplyDec11);
            } else {
                console.error('❌ YT Supply (Dec 11) failed:', ytDataDec11);
            }
        } catch (error) {
            console.error("❌ YT Supply (Dec 11) Error:", error);
        }
        await delay(250); // Avoid rate limiting

        // Fetch Curve pool USDC balance
        try {
            const curveUsdcUrl = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokenbalance&contractaddress=${ALMANAK_CONFIG.usdcToken}&address=${ALMANAK_CONFIG.curvePoolAddress}&tag=latest&apikey=${ALMANAK_CONFIG.etherscanApiKey}`;
            const curveUsdcResponse = await fetch(curveUsdcUrl);
            const curveUsdcData = await curveUsdcResponse.json();
            if (curveUsdcData.status === "1" && curveUsdcData.result) {
                results.curveUsdcBalance = parseFloat(curveUsdcData.result) / 1e6;
                console.log('✅ Curve USDC Balance:', results.curveUsdcBalance);
            }
        } catch (error) {
            console.error("❌ Curve USDC Error:", error);
        }
        await delay(250); // Avoid rate limiting

        // Fetch Curve pool alUSD balance (IMPORTANT - for double-counting fix)
        console.log('🔍 Fetching Curve alUSD Balance (important for Other TVL calculation)...');
        const curveAlUsdUrl = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokenbalance&contractaddress=${ALMANAK_CONFIG.alUsdToken}&address=${ALMANAK_CONFIG.curvePoolAddress}&tag=latest&apikey=${ALMANAK_CONFIG.etherscanApiKey}`;
        const curveAlUsdResult = await fetchWithRetry(curveAlUsdUrl, 5, 500);
        
        if (curveAlUsdResult.success && curveAlUsdResult.data.result) {
            results.curveAlUsdBalance = parseFloat(curveAlUsdResult.data.result) / 1e18;
            console.log('✅ Curve alUSD Balance:', results.curveAlUsdBalance);
        } else {
            console.error('❌ Failed to fetch Curve alUSD Balance after all retries');
            results.curveAlUsdBalanceError = true;
        }

        // Calculate Curve TVL using live alUSD price
        results.curveTvl = (results.curveUsdcBalance * ALMANAK_CONFIG.usdcPrice) + 
                           (results.curveAlUsdBalance * liveAlUsdPrice);

        console.log('🎉 All data fetched successfully');
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: results
            })
        };

    } catch (error) {
        console.error('❌ Fatal error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};
