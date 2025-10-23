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

/**
 * Fetch live USDC price from CoinGecko API
 * @returns {Promise<number>} Live USDC price
 */
async function fetchLiveUsdcPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=usd');
        if (!response.ok) {
            throw new Error(`CoinGecko API Error: ${response.status}`);
        }
        const data = await response.json();
        
        if (data['usd-coin'] && data['usd-coin'].usd) {
            const price = data['usd-coin'].usd;
            console.log('✅ Live USDC price from CoinGecko:', price);
            return price;
        }
        
        throw new Error('USDC price not found in API response');
    } catch (error) {
        console.error('❌ Failed to fetch live USDC price:', error);
        console.error('Error details:', error.message);
        // Return fallback price if API fails
        return ALMANAK_CONFIG.usdcPrice;
    }
}

// Helper function to add delay between requests (avoid rate limiting)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
        console.log('💰 Fetching live prices...');
        const liveAlUsdPrice = await fetchLiveAlUsdPrice();
        const liveAlpUsdPrice = await fetchLiveAlpUsdPrice();
        const liveUsdcPrice = await fetchLiveUsdcPrice();
        console.log('✅ Using alUSD price:', liveAlUsdPrice);
        console.log('✅ Using alpUSD price:', liveAlpUsdPrice);
        console.log('✅ Using USDC price:', liveUsdcPrice);
        
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
            liveUsdcPrice: liveUsdcPrice,  // Include USDC price
            timestamp: new Date().toISOString()
        };

        // Fetch alUSD total supply
        try {
            const alUsdSupplyUrl = `https://api.etherscan.io/v2/api?chainid=1&module=stats&action=tokensupply&contractaddress=${ALMANAK_CONFIG.alUsdToken}&apikey=${ALMANAK_CONFIG.etherscanApiKey}`;
            const alUsdResponse = await fetch(alUsdSupplyUrl);
            const alUsdData = await alUsdResponse.json();
            if (alUsdData.status === "1" && alUsdData.result) {
                results.alUsdSupply = parseFloat(alUsdData.result) / 1e18;
                console.log('✅ alUSD Supply:', results.alUsdSupply);
            }
        } catch (error) {
            console.error("❌ alUSD Supply Error:", error);
        }
        await delay(250); // Avoid rate limiting

        // Fetch alpUSD total supply
        try {
            const alpUsdSupplyUrl = `https://api.etherscan.io/v2/api?chainid=1&module=stats&action=tokensupply&contractaddress=${ALMANAK_CONFIG.alpUsdToken}&apikey=${ALMANAK_CONFIG.etherscanApiKey}`;
            const alpUsdResponse = await fetch(alpUsdSupplyUrl);
            const alpUsdData = await alpUsdResponse.json();
            if (alpUsdData.status === "1" && alpUsdData.result) {
                results.alpUsdSupply = parseFloat(alpUsdData.result) / 1e18;
                console.log('✅ alpUSD Supply:', results.alpUsdSupply);
            }
        } catch (error) {
            console.error("❌ alpUSD Supply Error:", error);
        }
        await delay(250); // Avoid rate limiting

        // Fetch SY alUSD balance
        try {
            const syBalanceUrl = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokenbalance&contractaddress=${ALMANAK_CONFIG.alUsdToken}&address=${ALMANAK_CONFIG.syContractAddress}&tag=latest&apikey=${ALMANAK_CONFIG.etherscanApiKey}`;
            const syResponse = await fetch(syBalanceUrl);
            const syData = await syResponse.json();
            if (syData.status === "1" && syData.result) {
                results.syAlUsdBalance = parseFloat(syData.result) / 1e18;
                console.log('✅ SY alUSD Balance:', results.syAlUsdBalance);
            }
        } catch (error) {
            console.error("❌ SY Balance Error:", error);
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

        // Fetch Curve pool alUSD balance
        try {
            const curveAlUsdUrl = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokenbalance&contractaddress=${ALMANAK_CONFIG.alUsdToken}&address=${ALMANAK_CONFIG.curvePoolAddress}&tag=latest&apikey=${ALMANAK_CONFIG.etherscanApiKey}`;
            const curveAlUsdResponse = await fetch(curveAlUsdUrl);
            const curveAlUsdData = await curveAlUsdResponse.json();
            if (curveAlUsdData.status === "1" && curveAlUsdData.result) {
                results.curveAlUsdBalance = parseFloat(curveAlUsdData.result) / 1e18;
                console.log('✅ Curve alUSD Balance:', results.curveAlUsdBalance);
            }
        } catch (error) {
            console.error("❌ Curve alUSD Error:", error);
        }

        // Calculate Curve TVL using live prices
        results.curveTvl = (results.curveUsdcBalance * liveUsdcPrice) + 
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
