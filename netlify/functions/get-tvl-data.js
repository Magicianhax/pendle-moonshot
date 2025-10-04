// Netlify Function to fetch TVL data from Etherscan
// This runs server-side to avoid CORS and rate limiting issues

const ALMANAK_CONFIG = {
    etherscanApiKey: "NDP4JRZEF2QUCXSQMGNVRUG81KTHEPMCH6",
    alUsdToken: "0xDCD0f5ab30856F28385F641580Bbd85f88349124",
    alpUsdToken: "0x5a97b0b97197299456af841f8605543b13b12ee3",
    ytToken: "0xd7c3fc198Bd7A50B99629cfe302006E9224f087b",
    syContractAddress: "0x8e5e017d6b3F567623B5d4a690a2a686bF7BA515",
    usdcToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    curvePoolAddress: "0x463626cF9028d96eAd5084954FF634f813D5fFB9",
    alUsdPrice: 1.0243,
    alpUsdPrice: 1.01,
    usdcPrice: 1.00
};

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
        console.log('🚀 Fetching TVL data from Etherscan...');
        
        const results = {
            alUsdSupply: 0,
            alpUsdSupply: 0,
            syAlUsdBalance: 0,
            ytTotalSupply: 0,
            curveUsdcBalance: 0,
            curveAlUsdBalance: 0,
            curveTvl: 0,
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

        // Fetch YT total supply
        try {
            const ytSupplyUrl = `https://api.etherscan.io/v2/api?chainid=1&module=stats&action=tokensupply&contractaddress=${ALMANAK_CONFIG.ytToken}&apikey=${ALMANAK_CONFIG.etherscanApiKey}`;
            const ytResponse = await fetch(ytSupplyUrl);
            const ytData = await ytResponse.json();
            if (ytData.status === "1" && ytData.result) {
                results.ytTotalSupply = parseFloat(ytData.result) / 1e6; // 6 decimals
                console.log('✅ YT Total Supply:', results.ytTotalSupply);
            } else {
                console.error('❌ YT Supply failed:', ytData);
            }
        } catch (error) {
            console.error("❌ YT Supply Error:", error);
        }

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

        // Calculate Curve TVL
        results.curveTvl = (results.curveUsdcBalance * ALMANAK_CONFIG.usdcPrice) + 
                           (results.curveAlUsdBalance * ALMANAK_CONFIG.alUsdPrice);

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

