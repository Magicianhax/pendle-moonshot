warning: in the working copy of 'api.js', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/api.js b/api.js[m
[1mindex 72f67ef..5c4e649 100644[m
[1m--- a/api.js[m
[1m+++ b/api.js[m
[36m@@ -189,33 +189,21 @@[m [mfunction formatApiResponse(apiResponse) {[m
  * @returns {Promise<Object>} Market data response[m
  */[m
 async function getMarketData(marketAddress = PENDLE_CONFIG.MARKET_OCT23.address) {[m
[31m-    const url = `${PENDLE_CONFIG.MARKET_API_URL}/${marketAddress}/data`;[m
[31m-    console.log(`🔍 [PENDLE API] Fetching market data from: ${url}`);[m
[31m-    console.log(`🔍 [PENDLE API] Market address: ${marketAddress}`);[m
[31m-    [m
     try {[m
[31m-        console.log(`⏳ [PENDLE API] Making fetch request...`);[m
[31m-        const response = await fetch(url, {[m
[32m+[m[32m        const response = await fetch(`${PENDLE_CONFIG.MARKET_API_URL}/${marketAddress}/data`, {[m
             method: "GET",[m
             headers: {[m
                 "Content-Type": "application/json"[m
             }[m
         });[m
 [m
[31m-        console.log(`📡 [PENDLE API] Response Status: ${response.status} ${response.statusText}`);[m
[31m-        console.log(`📡 [PENDLE API] Response Headers:`, [...response.headers.entries()]);[m
[31m-[m
         if (!response.ok) {[m
[31m-            const errorText = await response.text();[m
[31m-            console.error(`❌ [PENDLE API] Error Response Body:`, errorText);[m
             throw new Error(`Market API Error: ${response.status} - ${response.statusText}`);[m
         }[m
 [m
[31m-        console.log(`⏳ [PENDLE API] Parsing JSON response...`);[m
         const data = await response.json();[m
[31m-        console.log(`✅ [PENDLE API] Response Data:`, data);[m
         [m
[31m-        const result = {[m
[32m+[m[32m        return {[m
             success: true,[m
             data: {[m
                 underlyingApy: data.underlyingApy || 0,[m
[36m@@ -225,20 +213,14 @@[m [masync function getMarketData(marketAddress = PENDLE_CONFIG.MARKET_OCT23.address)[m
                 timestamp: data.timestamp,[m
                 liquidity: data.liquidity,[m
                 tradingVolume: data.tradingVolume,[m
[31m-                totalPt: data.totalPt || 0,[m
[32m+[m[32m                totalPt: data.totalPt || 0, // Include PT total for points calculation[m
                 totalSy: data.totalSy || 0,[m
                 assetPriceUsd: data.assetPriceUsd || 0[m
             }[m
         };[m
[31m-        [m
[31m-        console.log(`✅ [PENDLE API] Market data processed successfully`);[m
[31m-        return result;[m
 [m
     } catch (error) {[m
[31m-        console.error(`❌ [PENDLE API] FETCH FAILED for ${marketAddress}`);[m
[31m-        console.error(`❌ [PENDLE API] Error name:`, error.name);[m
[31m-        console.error(`❌ [PENDLE API] Error message:`, error.message);[m
[31m-        console.error(`❌ [PENDLE API] Error stack:`, error.stack);[m
[32m+[m[32m        console.error('Market API Error:', error);[m
         return {[m
             success: false,[m
             error: error.message || 'Failed to fetch market data'[m
[36m@@ -460,42 +442,32 @@[m [mconst ALMANAK_POINTS_CONFIG = {[m
  * @returns {Promise<Object>} TVL breakdown data[m
  */[m
 async function fetchTvlData() {[m
[31m-    console.log('═══════════════════════════════════════════════════════');[m
[31m-    console.log('🚀 [START] fetchTvlData() called');[m
[31m-    console.log('═══════════════════════════════════════════════════════');[m
[31m-    [m
     try {[m
         // Note: Live prices are fetched by the serverless function to avoid CORS[m
[31m-        console.log('📊 [BACKEND] Fetching TVL data from serverless function...');[m
[32m+[m[32m        console.log('📊 Fetching TVL data from serverless function...');[m
         [m
         // Fetch data from backend API FIRST to get live prices[m
[31m-        console.log('🚀 [BACKEND] Calling /.netlify/functions/get-tvl-data...');[m
[32m+[m[32m        console.log('🚀 Fetching TVL data from backend API...');[m
         const backendResponse = await fetch('/.netlify/functions/get-tvl-data');[m
[31m-        console.log('📡 [BACKEND] Response status:', backendResponse.status, backendResponse.statusText);[m
[31m-        [m
         const backendData = await backendResponse.json();[m
[31m-        console.log('📡 [BACKEND] Response data received:', backendData);[m
         [m
         if (!backendData.success || !backendData.data) {[m
[31m-            console.error('❌ [BACKEND] API returned error:', backendData.error);[m
[32m+[m[32m            console.error('❌ Backend API returned error:', backendData.error);[m
             throw new Error(backendData.error || 'Backend API failed');[m
         }[m
         [m
[31m-        console.log('✅ [BACKEND] API response successful:', backendData.data);[m
[32m+[m[32m        console.log('✅ Backend API response:', backendData.data);[m
         [m
         // Extract live prices from backend response and update config[m
         const liveAlUsdPrice = backendData.data.liveAlUsdPrice || ALMANAK_POINTS_CONFIG.alUsdPrice;[m
         const liveAlpUsdPrice = backendData.data.liveAlpUsdPrice || ALMANAK_POINTS_CONFIG.alpUsdPrice;[m
[31m-        const liveUsdcPrice = backendData.data.liveUsdcPrice || ALMANAK_POINTS_CONFIG.usdcPrice;[m
         [m
         // Update the config with live prices[m
         ALMANAK_POINTS_CONFIG.alUsdPrice = liveAlUsdPrice;[m
         ALMANAK_POINTS_CONFIG.alpUsdPrice = liveAlpUsdPrice;[m
[31m-        ALMANAK_POINTS_CONFIG.usdcPrice = liveUsdcPrice;[m
         [m
         console.log('✅ Using live alUSD price:', liveAlUsdPrice);[m
         console.log('✅ Using live alpUSD price:', liveAlpUsdPrice);[m
[31m-        console.log('✅ Using live USDC price:', liveUsdcPrice);[m
         [m
         // Extract data from backend[m
         const alUsdSupply = backendData.data.alUsdSupply || 0;[m
[36m@@ -566,12 +538,9 @@[m [masync function fetchTvlData() {[m
         results.grossTvl = results.defiLlamaTvl;[m
         [m
         // Get Pendle market data for BOTH markets[m
[31m-        console.log('🎯 [MAIN] Starting Pendle market data fetch for both markets...');[m
         try {[m
             // Fetch October 23 market data[m
[31m-            console.log('🎯 [MAIN] Fetching October 23 market data...');[m
             const marketResponseOct23 = await getMarketData(PENDLE_CONFIG.MARKET_OCT23.address);[m
[31m-            console.log('🎯 [MAIN] October 23 market response:', marketResponseOct23);[m
             if (marketResponseOct23.success && marketResponseOct23.data.liquidity) {[m
                 const totalPtOct23 = marketResponseOct23.data.totalPt || 0;[m
                 const ptPriceOct23 = marketResponseOct23.data.assetPriceUsd || liveAlUsdPrice;[m
[36m@@ -597,14 +566,12 @@[m [masync function fetchTvlData() {[m
             }[m
             [m
             // Fetch December 11 market data[m
[31m-            console.log('🎯 [MAIN] Fetching December 11 market data...');[m
             const marketResponseDec11 = await getMarketData(PENDLE_CONFIG.MARKET_DEC11.address);[m
[31m-            console.log('🎯 [MAIN] December 11 market response:', marketResponseDec11);[m
             if (marketResponseDec11.success && marketResponseDec11.data.liquidity) {[m
                 const totalPtDec11 = marketResponseDec11.data.totalPt || 0;[m
                 const totalSyDec11 = marketResponseDec11.data.totalSy || 0;[m
                 const syPrice = liveAlUsdPrice;  // Use live alUSD price from Lagoon[m
[31m-                const ptPrice = liveUsdcPrice;  // Use live USDC price from serverless function (avoids CORS)[m
[32m+[m[32m                const ptPrice = 1.00;  // PT priced at USDC peg ($1.00)[m
                 const actualLpTvl = marketResponseDec11.data.liquidity.usd || 0;[m
                 const actualYtTvl = ytTotalSupplyDec11 * liveAlUsdPrice;[m
                 [m
[36m@@ -620,11 +587,11 @@[m [masync function fetchTvlData() {[m
                     method: 'Using actual PT/SY token amounts from Pendle API',[m
                     totalPt: totalPtDec11.toFixed(2),[m
                     totalSy: totalSyDec11.toFixed(2),[m
[31m-                    syPrice: syPrice.toFixed(6) + ' (alUSD from Lagoon)',[m
[31m-                    ptPrice: ptPrice.toFixed(6) + ' (USDC from CoinGecko)',[m
[31m-                    totalLpTvl: actualLpTvl.toFixed(2),[m
[31m-                    lpSyPortion: lpSyPortionUsd.toFixed(2) + ` (${syPercent.toFixed(2)}%)`,[m
[31m-                    lpPtPortion: lpPtPortionUsd.toFixed(2) + ` (${ptPercent.toFixed(2)}%)`[m
[32m+[m[32m                    syPrice: '$' + syPrice.toFixed(4) + ' (alUSD from Lagoon)',[m
[32m+[m[32m                    ptPrice: '$' + ptPrice.toFixed(2) + ' (USDC peg)',[m
[32m+[m[32m                    totalLpTvl: '$' + actualLpTvl.toFixed(2),[m
[32m+[m[32m                    lpSyPortion: '$' + lpSyPortionUsd.toFixed(2) + ` (${syPercent.toFixed(2)}%)`,[m
[32m+[m[32m                    lpPtPortion: '$' + lpPtPortionUsd.toFixed(2) + ` (${ptPercent.toFixed(2)}%)`[m
                 });[m
                 [m
                 // Store LP breakdown[m
[36m@@ -648,15 +615,9 @@[m [masync function fetchTvlData() {[m
             results.pendleLpTvl = results.pendleOct23.lpTvl + results.pendleDec11.lpTvl;[m
             results.pendleYtTvl = results.pendleOct23.ytTvl + results.pendleDec11.ytTvl;[m
             results.pendlePtTvl = results.pendleOct23.ptTvl + results.pendleDec11.ptTvl;[m
[32m+[m[41m            [m
         } catch (error) {[m
[31m-            console.error("❌ [MAIN] Pendle Market API Error:", error);[m
[31m-            console.error("❌ [MAIN] Error details:", {[m
[31m-                name: error.name,[m
[31m-                message: error.message,[m
[31m-                stack: error.stack[m
[31m-            });[m
[31m-            // Continue with default values if market data fetch fails[m
[31m-            console.warn("⚠️ [MAIN] Continuing with default market values due to API failure");[m
[32m+[m[32m            console.error("Pendle Market API Error:", error);[m
         }[m
         [m
         // Calculate total TVL = Gross TVL - SY alUSD (to avoid double counting)[m
