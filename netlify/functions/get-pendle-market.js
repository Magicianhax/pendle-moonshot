// Netlify Function to proxy Pendle Market API calls
// This avoids CORS issues when calling Pendle API from the browser

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
        // Get market address from query parameter
        const marketAddress = event.queryStringParameters?.market;
        
        if (!marketAddress) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Market address is required'
                })
            };
        }

        console.log(`📊 Fetching market data for: ${marketAddress}`);
        
        // Fetch from Pendle API
        const pendleApiUrl = `https://api-v2.pendle.finance/core/v2/1/markets/${marketAddress}/data`;
        const response = await fetch(pendleApiUrl);
        
        if (!response.ok) {
            throw new Error(`Pendle API Error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log(`✅ Market data fetched successfully for ${marketAddress}`);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: data
            })
        };

    } catch (error) {
        console.error('❌ Error fetching market data:', error);
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

