// Main application logic for Pendle Moonshot Calculator

/**
 * DOM Elements
 */
const elements = {
    amountInput: null,
    calculateBtn: null,
    loadingDiv: null,
    resultsDiv: null,
    errorDiv: null,
    // Market selector buttons
    marketOct23Btn: null,
    marketDec11Btn: null,
    // October 23 market elements
    countdownOct23: null,
    underlyingApyOct23: null,
    impliedApyOct23: null,
    // December 11 market elements
    countdownDec11: null,
    underlyingApyDec11: null,
    impliedApyDec11: null,
    // TVL table
    tvlTableBody: null,
    resultElements: {
        inputAmount: null,
        netFromTaker: null,
        netToTaker: null,
        fee: null,
        estimatedPoints: null,
        maturityPoints: null,
        maturityApy: null,
        expectedEarnings: null,
        totalMaturityValue: null
    },
    almanakTableBody: null,
    // Toggle buttons
    newTradeBtn: null,
    existingYtBtn: null,
    newTradeSection: null,
    existingYtSection: null,
    // Existing YT inputs
    ytAmountInput: null,
    ytCostInput: null,
    calculateExistingBtn: null,
    calculateNewBtn: null
};

/**
 * Global state for market data
 */
let marketData = {
    selectedMarket: 'oct23', // 'oct23' or 'dec11'
    oct23: {
    underlyingApy: 0,
    impliedApy: 0,
        daysToMaturity: 0
    },
    dec11: {
        underlyingApy: 0,
        impliedApy: 0,
        daysToMaturity: 0
    },
    lastUpdated: null,
    tvlData: null,
    weightedTvl: null
};

/**
 * Initialize the application
 */
function initializeApp() {
    // Get DOM elements
    elements.amountInput = document.getElementById('amount');
    elements.loadingDiv = document.getElementById('loading');
    elements.resultsDiv = document.getElementById('results');
    elements.errorDiv = document.getElementById('error');
    
    // Get market selector buttons
    elements.marketOct23Btn = document.getElementById('marketOct23Btn');
    elements.marketDec11Btn = document.getElementById('marketDec11Btn');
    
    // Get October 23 market elements
    elements.countdownOct23 = document.getElementById('countdownOct23');
    elements.underlyingApyOct23 = document.getElementById('underlyingApyOct23');
    elements.impliedApyOct23 = document.getElementById('impliedApyOct23');
    
    // Get December 11 market elements
    elements.countdownDec11 = document.getElementById('countdownDec11');
    elements.underlyingApyDec11 = document.getElementById('underlyingApyDec11');
    elements.impliedApyDec11 = document.getElementById('impliedApyDec11');
    
    // Get TVL table
    elements.tvlTableBody = document.getElementById('tvlTableBody');
    
    // Get toggle elements
    elements.newTradeBtn = document.getElementById('newTradeBtn');
    elements.existingYtBtn = document.getElementById('existingYtBtn');
    elements.newTradeSection = document.getElementById('newTradeSection');
    elements.existingYtSection = document.getElementById('existingYtSection');
    
    // Get existing YT elements
    elements.ytAmountInput = document.getElementById('ytAmount');
    elements.ytCostInput = document.getElementById('ytCost');
    elements.calculateExistingBtn = document.getElementById('calculateExistingBtn');
    elements.calculateNewBtn = document.getElementById('calculateNewBtn');
    
    // Get result elements
    elements.resultElements.inputAmount = document.getElementById('inputAmount');
    elements.resultElements.netFromTaker = document.getElementById('netFromTaker');
    elements.resultElements.netToTaker = document.getElementById('netToTaker');
    elements.resultElements.fee = document.getElementById('fee');
    elements.resultElements.estimatedPoints = document.getElementById('estimatedPoints');
    elements.resultElements.maturityPoints = document.getElementById('maturityPoints');
    elements.resultElements.maturityApy = document.getElementById('maturityApy');
    elements.resultElements.expectedEarnings = document.getElementById('expectedEarnings');
    elements.resultElements.totalMaturityValue = document.getElementById('totalMaturityValue');
    elements.almanakTableBody = document.getElementById('almanakTableBody');

    // Verify all elements loaded
    console.log('DOM elements loaded:', {
        marketOct23Btn: !!elements.marketOct23Btn,
        marketDec11Btn: !!elements.marketDec11Btn,
        tvlTableBody: !!elements.tvlTableBody,
        underlyingApyOct23: !!elements.underlyingApyOct23,
        impliedApyOct23: !!elements.impliedApyOct23,
        underlyingApyDec11: !!elements.underlyingApyDec11,
        impliedApyDec11: !!elements.impliedApyDec11
    });

    // Set up event listeners
    setupEventListeners();
    
    // Initialize market data and countdown
    initializeMarketData();
    
    console.log('✅ Pendle Moonshot Calculator initialized with dual market support');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Market selector buttons
    elements.marketOct23Btn.addEventListener('click', () => switchMarket('oct23'));
    elements.marketDec11Btn.addEventListener('click', () => switchMarket('dec11'));
    
    // Toggle buttons
    elements.newTradeBtn.addEventListener('click', () => switchToNewTrade());
    elements.existingYtBtn.addEventListener('click', () => switchToExistingYt());
    
    // Calculate button click for new trade
    elements.calculateNewBtn.addEventListener('click', handleCalculateClick);
    
    // Calculate button click for existing YT
    elements.calculateExistingBtn.addEventListener('click', handleCalculateExisting);
    
    // Enter key on input (new trade)
    elements.amountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleCalculateClick();
        }
    });
    
    // Enter key on existing YT inputs
    elements.ytAmountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleCalculateExisting();
        }
    });
    
    elements.ytCostInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleCalculateExisting();
        }
    });
    
    // Input validation
    elements.amountInput.addEventListener('input', validateInput);
    elements.ytAmountInput.addEventListener('input', validateInput);
    elements.ytCostInput.addEventListener('input', validateInput);
}

/**
 * Switch between markets
 * @param {string} market - 'oct23' or 'dec11'
 */
function switchMarket(market) {
    marketData.selectedMarket = market;
    
    // Update button styles
    if (market === 'oct23') {
        elements.marketOct23Btn.classList.add('active');
        elements.marketDec11Btn.classList.remove('active');
        elements.marketOct23Btn.style.border = '2px solid #3b82f6';
        elements.marketOct23Btn.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
        elements.marketOct23Btn.style.color = '#1e40af';
        elements.marketDec11Btn.style.border = '2px solid var(--border-gray)';
        elements.marketDec11Btn.style.background = 'white';
        elements.marketDec11Btn.style.color = 'var(--primary-black)';
    } else {
        elements.marketDec11Btn.classList.add('active');
        elements.marketOct23Btn.classList.remove('active');
        elements.marketDec11Btn.style.border = '2px solid #10b981';
        elements.marketDec11Btn.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
        elements.marketDec11Btn.style.color = '#065f46';
        elements.marketOct23Btn.style.border = '2px solid var(--border-gray)';
        elements.marketOct23Btn.style.background = 'white';
        elements.marketOct23Btn.style.color = 'var(--primary-black)';
    }
    
    console.log(`Switched to ${market === 'oct23' ? 'October 23' : 'December 11'} market`);
    
    // Clear results when switching markets
    hideResults();
    hideError();
}

/**
 * Handle calculate button click
 */
async function handleCalculateClick() {
    const amount = elements.amountInput.value.trim();
    
    if (!validateAmount(amount)) {
        return;
    }

    await performCalculation(amount);
}

/**
 * Validate amount input
 * @param {string} amount - Input amount
 * @returns {boolean} Is valid
 */
function validateAmount(amount) {
    if (!amount) {
        showError('Please enter an amount');
        return false;
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        showError('Please enter a valid positive number');
        return false;
    }
    
    if (numAmount > 1000000) {
        showError('Amount too large. Please enter a reasonable amount.');
        return false;
    }
    
    return true;
}

/**
 * Validate input in real-time
 */
function validateInput() {
    const amount = elements.amountInput.value;
    hideError();
    
    if (amount && (isNaN(parseFloat(amount)) || parseFloat(amount) < 0)) {
        showError('Please enter a valid positive number');
    }
}

/**
 * Perform the moonshot calculation
 * @param {string} amount - Amount to calculate
 */
async function performCalculation(amount) {
    try {
        // Show loading state
        setLoadingState(true);
        hideError();
        hideResults();

        // Get selected market
        const selectedMarket = marketData.selectedMarket;
        console.log(`Calculating for ${selectedMarket === 'oct23' ? 'October 23' : 'December 11'} market`);

        // Call Pendle API with selected market
        const apiResponse = await window.PendleAPI.calculateMoonshot(amount, selectedMarket);
        
        // Format and display results
        const formattedResponse = window.PendleAPI.formatApiResponse(apiResponse);
        
        if (formattedResponse.success) {
            displayResults(formattedResponse.formatted);
        } else {
            showError(formattedResponse.error);
        }
        
    } catch (error) {
        console.error('Calculation error:', error);
        showError('An unexpected error occurred. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

/**
 * Display calculation results
 * @param {Object} results - Formatted results
 */
function displayResults(results) {
    // Show trade execution section (for new trades)
    const tradeSection = document.querySelector('.results .result-section:first-child');
    if (tradeSection) {
        tradeSection.style.display = 'block';
    }
    
    // Update trade result elements (from totalTrade)
    elements.resultElements.inputAmount.textContent = results.inputAmount;
    elements.resultElements.netFromTaker.textContent = results.netFromTaker;
    elements.resultElements.netToTaker.textContent = results.netToTaker;
    elements.resultElements.fee.textContent = results.fee;
    
    // Calculate and display estimated points based on YT received (netToTaker)
    const ytAmount = parseFloat(results.netToTaker.replace(/[^\d.-]/g, ''));
    const selectedMarket = marketData.selectedMarket;
    const selectedMarketData = marketData[selectedMarket];
    
    if (ytAmount > 0 && marketData.weightedTvl && selectedMarketData.daysToMaturity > 0) {
        try {
            const pointsBreakdown = window.PendleAPI.calculateDailyPoints(ytAmount, marketData.weightedTvl, 'yt');
            const totalGrossPoints = pointsBreakdown.gross * selectedMarketData.daysToMaturity;
            const totalPendleFee = pointsBreakdown.pendleFee * selectedMarketData.daysToMaturity;
            const totalNetPoints = pointsBreakdown.net * selectedMarketData.daysToMaturity;
            
            const pointsHTML = `
                <div style="font-weight: 700;">${formatNumber(totalNetPoints)} points (NET)</div>
                <div style="font-size: 0.85em; color: #6c757d; margin-top: 4px;">
                    ${formatNumber(pointsBreakdown.net)} daily | ${formatNumber(totalGrossPoints)} gross<br>
                    <span style="color: #dc2626;">- ${formatNumber(totalPendleFee)} Pendle fees (5%)</span>
                </div>
            `;
            
            // Update both points displays
            elements.resultElements.estimatedPoints.innerHTML = pointsHTML;
            elements.resultElements.maturityPoints.innerHTML = pointsHTML;
        } catch (error) {
            console.error('Error calculating points:', error);
            elements.resultElements.estimatedPoints.textContent = 'N/A';
            elements.resultElements.maturityPoints.textContent = 'N/A';
        }
    } else {
        elements.resultElements.estimatedPoints.textContent = 'N/A';
        elements.resultElements.maturityPoints.textContent = 'N/A';
    }
    
    // Calculate and display maturity earnings based on YT amount received (reuse ytAmount from above)
    const initialInvestment = parseFloat(elements.amountInput.value); // Get initial investment
    console.log('Market data for maturity calculation:', {
        ytAmount: ytAmount,
        initialInvestment: initialInvestment,
        selectedMarket: selectedMarket,
        underlyingApy: selectedMarketData.underlyingApy,
        daysToMaturity: selectedMarketData.daysToMaturity
    });
    
    if (ytAmount > 0 && selectedMarketData.underlyingApy > 0 && selectedMarketData.daysToMaturity > 0) {
        try {
            const maturityReturn = window.PendleAPI.calculateMaturityApy(selectedMarketData.underlyingApy, selectedMarketData.daysToMaturity);
            const earnings = window.PendleAPI.calculateMaturityEarnings(ytAmount, maturityReturn, selectedMarketData.underlyingApy, selectedMarketData.daysToMaturity, initialInvestment);
            
            // Display ROI
            elements.resultElements.maturityApy.textContent = `${earnings.roiPercentage}%`;
            
            // Display expected earnings
            elements.resultElements.expectedEarnings.textContent = `${earnings.earnings.toFixed(2)} USDC`;
            
            // Display total yield value
            elements.resultElements.totalMaturityValue.textContent = `${earnings.totalValue.toFixed(2)} USDC (YT → 0)`;
        } catch (error) {
            console.error('Error calculating maturity earnings:', error);
            elements.resultElements.maturityApy.textContent = 'Error';
            elements.resultElements.expectedEarnings.textContent = 'Error';
            elements.resultElements.totalMaturityValue.textContent = 'Error';
        }
    } else {
        elements.resultElements.maturityApy.textContent = 'N/A';
        elements.resultElements.expectedEarnings.textContent = 'N/A';
        elements.resultElements.totalMaturityValue.textContent = 'N/A';
    }
    
    // Display Almanak points scenarios based on YT amount (reuse ytAmount from above)
    displayAlmanakScenarios(ytAmount, selectedMarketData.daysToMaturity, initialInvestment);
    
    // Show results
    showResults();
    
    // Log raw data for debugging
    console.log('Calculation Results:', results.rawData);
    console.log('Market Data:', marketData);
}

/**
 * Show loading state
 * @param {boolean} isLoading - Loading state
 */
function setLoadingState(isLoading) {
    elements.loadingDiv.style.display = isLoading ? 'block' : 'none';
    
    // Disable/enable both calculate buttons
    if (elements.calculateNewBtn) {
        elements.calculateNewBtn.disabled = isLoading;
        elements.calculateNewBtn.textContent = isLoading ? 'Calculating...' : 'Calculate Moonshot';
    }
    
    if (elements.calculateExistingBtn) {
        elements.calculateExistingBtn.disabled = isLoading;
        elements.calculateExistingBtn.textContent = isLoading ? 'Calculating...' : 'Calculate My Returns';
    }
}

/**
 * Show results section
 */
function showResults() {
    elements.resultsDiv.classList.add('show');
}

/**
 * Hide results section
 */
function hideResults() {
    elements.resultsDiv.classList.remove('show');
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    elements.errorDiv.textContent = message;
    elements.errorDiv.style.display = 'block';
}

/**
 * Hide error message
 */
function hideError() {
    elements.errorDiv.style.display = 'none';
}

/**
 * Reset form to initial state
 */
function resetForm() {
    elements.amountInput.value = '';
    hideResults();
    hideError();
    setLoadingState(false);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Initialize market data and countdown
 */
async function initializeMarketData() {
    try {
        // Update countdowns immediately for both markets
        updateCountdown();
        
        // Fetch market data for BOTH markets
        const marketsData = await window.PendleAPI.getAllMarketsData();
        
        if (marketsData.success) {
            // Update October 23 market data
            if (marketsData.oct23) {
                marketData.oct23.underlyingApy = marketsData.oct23.underlyingApy;
                marketData.oct23.impliedApy = marketsData.oct23.impliedApy;
                marketData.oct23.daysToMaturity = window.PendleAPI.getDaysToMaturity('oct23');
                
                elements.underlyingApyOct23.textContent = `${(marketsData.oct23.underlyingApy * 100).toFixed(2)}%`;
                elements.impliedApyOct23.textContent = `${(marketsData.oct23.impliedApy * 100).toFixed(2)}%`;
                console.log('✅ October 23 market data loaded');
            }
            
            // Update December 11 market data
            if (marketsData.dec11) {
                marketData.dec11.underlyingApy = marketsData.dec11.underlyingApy;
                marketData.dec11.impliedApy = marketsData.dec11.impliedApy;
                marketData.dec11.daysToMaturity = window.PendleAPI.getDaysToMaturity('dec11');
                
                elements.underlyingApyDec11.textContent = `${(marketsData.dec11.underlyingApy * 100).toFixed(2)}%`;
                elements.impliedApyDec11.textContent = `${(marketsData.dec11.impliedApy * 100).toFixed(2)}%`;
                console.log('✅ December 11 market data loaded');
            }
            
            marketData.lastUpdated = new Date();
        } else {
            elements.underlyingApyOct23.textContent = 'Error loading';
            elements.impliedApyOct23.textContent = 'Error loading';
            elements.underlyingApyDec11.textContent = 'Error loading';
            elements.impliedApyDec11.textContent = 'Error loading';
            console.error('Failed to load market data:', marketsData.error);
        }
        
        // Fetch TVL data for points calculation
        await fetchAndUpdateTvlData();
        
        // Set up countdown timer to update every minute
        setInterval(updateCountdown, 60000);
        
        // Set up market data refresh every 5 minutes
        setInterval(refreshMarketData, 300000);
        
        // Set up TVL data refresh every 10 minutes
        setInterval(fetchAndUpdateTvlData, 600000);
        
    } catch (error) {
        console.error('Failed to initialize market data:', error);
        elements.underlyingApyOct23.textContent = 'Error loading';
        elements.underlyingApyDec11.textContent = 'Error loading';
    }
}

/**
 * Update countdown display for both markets
 */
function updateCountdown() {
    // Update October 23 countdown
    const daysToMaturityOct23 = window.PendleAPI.getDaysToMaturity('oct23');
    marketData.oct23.daysToMaturity = daysToMaturityOct23;
    
    if (daysToMaturityOct23 > 0) {
        const dayTextOct23 = daysToMaturityOct23 === 1 ? 'day' : 'days';
        elements.countdownOct23.textContent = `${daysToMaturityOct23} ${dayTextOct23}`;
    } else {
        elements.countdownOct23.textContent = 'Matured';
    }
    
    // Update December 11 countdown
    const daysToMaturityDec11 = window.PendleAPI.getDaysToMaturity('dec11');
    marketData.dec11.daysToMaturity = daysToMaturityDec11;
    
    if (daysToMaturityDec11 > 0) {
        const dayTextDec11 = daysToMaturityDec11 === 1 ? 'day' : 'days';
        elements.countdownDec11.textContent = `${daysToMaturityDec11} ${dayTextDec11}`;
    } else {
        elements.countdownDec11.textContent = 'Matured';
    }
}

/**
 * Refresh market data for both markets
 */
async function refreshMarketData() {
    try {
        const marketsData = await window.PendleAPI.getAllMarketsData();
        
        if (marketsData.success) {
            // Update October 23 market
            if (marketsData.oct23) {
                marketData.oct23.underlyingApy = marketsData.oct23.underlyingApy;
                marketData.oct23.impliedApy = marketsData.oct23.impliedApy;
                
                elements.underlyingApyOct23.textContent = `${(marketsData.oct23.underlyingApy * 100).toFixed(2)}%`;
                elements.impliedApyOct23.textContent = `${(marketsData.oct23.impliedApy * 100).toFixed(2)}%`;
            }
            
            // Update December 11 market
            if (marketsData.dec11) {
                marketData.dec11.underlyingApy = marketsData.dec11.underlyingApy;
                marketData.dec11.impliedApy = marketsData.dec11.impliedApy;
                
                elements.underlyingApyDec11.textContent = `${(marketsData.dec11.underlyingApy * 100).toFixed(2)}%`;
                elements.impliedApyDec11.textContent = `${(marketsData.dec11.impliedApy * 100).toFixed(2)}%`;
            }
            
            marketData.lastUpdated = new Date();
            console.log('Both markets data refreshed');
        }
    } catch (error) {
        console.error('Failed to refresh market data:', error);
    }
}

/**
 * Fetch and update TVL data for points calculation
 */
async function fetchAndUpdateTvlData() {
    try {
        console.log('🔄 Fetching TVL data...');
        
        if (!window.PendleAPI || !window.PendleAPI.fetchTvlData) {
            console.error('❌ PendleAPI not loaded!');
            return;
        }
        
        const tvlResponse = await window.PendleAPI.fetchTvlData();
        
        console.log('📦 TVL Response:', tvlResponse);
        
        if (tvlResponse && tvlResponse.success && tvlResponse.data) {
            marketData.tvlData = tvlResponse.data;
            marketData.weightedTvl = window.PendleAPI.calculateWeightedTvl(tvlResponse.data);
            
            console.log('📊 TVL Data Details:');
            console.log('  DeFiLlama:', formatCurrency(marketData.tvlData.defiLlamaTvl));
            console.log('  USDC:', formatCurrency(marketData.tvlData.usdcBalance));
            console.log('  USDT:', formatCurrency(marketData.tvlData.usdtBalance));
            console.log('  Total TVL:', formatCurrency(marketData.tvlData.totalTvl));
            console.log('  ✅ YT TVL:', formatCurrency(marketData.weightedTvl.ytTvl), '(5x boost) - from YT token contract');
            console.log('  ✅ LP TVL:', formatCurrency(marketData.weightedTvl.lpTvl), '(1.25x boost)');
            console.log('  ✅ Curve Pool TVL:', formatCurrency(marketData.weightedTvl.curveTvl), '(3x boost)');
            console.log('  ✅ Other TVL:', formatCurrency(marketData.weightedTvl.otherTvl), '(1x boost)');
            console.log('  ❌ PT TVL:', formatCurrency(marketData.tvlData.pendlePtTvl || 0), '(EXCLUDED - 0 points)');
            console.log('  Total Weighted TVL:', formatCurrency(marketData.weightedTvl.totalWeightedTvl));
            
            // Update TVL breakdown table
            displayTvlBreakdown();
            console.log('✅ TVL table updated successfully');
        } else {
            console.error('❌ Failed to fetch TVL data:', tvlResponse ? tvlResponse.error : 'No response');
            if (elements.tvlTableBody) {
                elements.tvlTableBody.innerHTML = '<tr><td colspan="6" class="loading-text" style="color: #dc2626;">Error loading TVL data. Check console for details.</td></tr>';
            }
        }
    } catch (error) {
        console.error('❌ Error fetching TVL data:', error);
        console.error('Error stack:', error.stack);
        if (elements.tvlTableBody) {
            elements.tvlTableBody.innerHTML = '<tr><td colspan="6" class="loading-text" style="color: #dc2626;">Error: ' + error.message + '</td></tr>';
        }
    }
}

/**
 * Display TVL breakdown table
 */
function displayTvlBreakdown() {
    if (!marketData.weightedTvl || !marketData.tvlData) {
        elements.tvlTableBody.innerHTML = '<tr><td colspan="6" class="loading-text">Loading TVL data...</td></tr>';
        return;
    }
    
    const weighted = marketData.weightedTvl;
    const tvlData = marketData.tvlData;
    const totalWeighted = weighted.totalWeightedTvl;
    const DAILY_POINTS = 316666; // Daily points distributed (95% of 333,333, 5% for referrals)
    
    // Get live prices from config (updated in fetchTvlData)
    const liveAlUsdPrice = tvlData.liveAlUsdPrice || window.PendleAPI.ALMANAK_POINTS_CONFIG.alUsdPrice;
    const liveAlpUsdPrice = tvlData.liveAlpUsdPrice || window.PendleAPI.ALMANAK_POINTS_CONFIG.alpUsdPrice;
    
    // Calculate points for October 23 market
    const ytShareOct23 = (weighted.oct23.weightedYt / totalWeighted) * 100;
    const lpShareOct23 = (weighted.oct23.weightedLp / totalWeighted) * 100;
    const ytDailyPointsOct23 = (weighted.oct23.weightedYt / totalWeighted) * DAILY_POINTS;
    const lpDailyPointsOct23 = (weighted.oct23.weightedLp / totalWeighted) * DAILY_POINTS;
    
    // Calculate points for December 11 market
    const ytShareDec11 = (weighted.dec11.weightedYt / totalWeighted) * 100;
    const lpShareDec11 = (weighted.dec11.weightedLp / totalWeighted) * 100;
    const ytDailyPointsDec11 = (weighted.dec11.weightedYt / totalWeighted) * DAILY_POINTS;
    const lpDailyPointsDec11 = (weighted.dec11.weightedLp / totalWeighted) * DAILY_POINTS;
    
    // Calculate combined points (for totals)
    const ytShare = (weighted.weightedYt / totalWeighted) * 100;
    const lpShare = (weighted.weightedLp / totalWeighted) * 100;
    const curveShare = (weighted.weightedCurve / totalWeighted) * 100;
    const otherShare = (weighted.weightedOther / totalWeighted) * 100;
    
    const ytDailyPoints = ytDailyPointsOct23 + ytDailyPointsDec11;
    const lpDailyPoints = lpDailyPointsOct23 + lpDailyPointsDec11;
    const curveDailyPoints = (weighted.weightedCurve / totalWeighted) * DAILY_POINTS;
    const otherDailyPoints = (weighted.weightedOther / totalWeighted) * DAILY_POINTS;
    const referralDailyPoints = 16667; // 5% reserved for referral program
    
    // Calculate Pendle fees (5% from YT points only - applies to BOTH markets)
    const ytPendleFee = ytDailyPoints * 0.05;
    const ytNetPoints = ytDailyPoints * 0.95;
    
    const tableHTML = `
        <!-- Overall TVL Sources Section -->
        <tr style="background-color: #f0f9ff; border-bottom: 2px solid #0284c7;">
            <td colspan="6" style="padding: 12px 16px;">
                <strong style="font-size: 1.05rem;">📈 Overall TVL Sources</strong>
            </td>
        </tr>
        <tr style="background-color: #f8fafc;">
            <td colspan="2"><span class="tvl-type">alUSD Supply (${formatNumber(tvlData.alUsdSupply)} × $${liveAlUsdPrice.toFixed(6)})</span></td>
            <td colspan="4"><strong>${formatCurrency(tvlData.alUsdSupply * liveAlUsdPrice)}</strong></td>
        </tr>
        <tr style="background-color: #ffffff;">
            <td colspan="2"><span class="tvl-type">alpUSD Supply (${formatNumber(tvlData.alpUsdSupply)} × $${liveAlpUsdPrice.toFixed(6)})</span></td>
            <td colspan="4"><strong>${formatCurrency(tvlData.alpUsdSupply * liveAlpUsdPrice)}</strong></td>
        </tr>
        <tr style="background-color: #e0f2fe; font-weight: 600;">
            <td colspan="2"><strong>GROSS TVL</strong></td>
            <td colspan="4"><strong>${formatCurrency(tvlData.grossTvl || tvlData.defiLlamaTvl)}</strong></td>
        </tr>
        <tr style="background-color: #fee2e2;">
            <td colspan="2"><span class="tvl-type" style="color: #991b1b;">Minus: SY alUSD (${formatNumber(tvlData.syAlUsdBalance)} × $${liveAlUsdPrice.toFixed(6)})</span></td>
            <td colspan="4"><strong style="color: #991b1b;">-${formatCurrency(tvlData.syAlUsdBalance * liveAlUsdPrice)}</strong></td>
        </tr>
        <tr style="background-color: #dbeafe; font-weight: 600; border-bottom: 3px solid #0284c7;">
            <td colspan="2"><strong>NET TVL (for points)</strong></td>
            <td colspan="4"><strong style="font-size: 1.1rem;">${formatCurrency(tvlData.totalTvl)}</strong></td>
        </tr>
        
        <!-- Points Distribution Section -->
        <tr style="background-color: #f0f9ff; border-bottom: 2px solid #0284c7;">
            <td colspan="6" style="padding: 12px 16px; padding-top: 20px;">
                <strong style="font-size: 1.05rem;">🎯 Pendle Markets Points Distribution</strong>
            </td>
        </tr>
        
        <!-- October 23 Market -->
        <tr style="background-color: ${weighted.oct23.isMatured ? '#fef3c7' : '#eff6ff'}; border-top: 2px solid ${weighted.oct23.isMatured ? '#f59e0b' : '#3b82f6'};">
            <td colspan="6" style="padding: 10px 16px;">
                <strong style="font-size: 0.95rem; color: ${weighted.oct23.isMatured ? '#92400e' : '#1e40af'};">
                    📅 October 23, 2025 Market ${weighted.oct23.isMatured ? '⚠️ MATURED' : ''}
                </strong>
                ${weighted.oct23.isMatured ? '<div style="font-size: 0.8rem; color: #92400e; margin-top: 4px;">⚠️ Market has matured. No points earned. Please migrate to active markets.</div>' : ''}
            </td>
        </tr>
        <tr style="background-color: #f9fafb; ${weighted.oct23.isMatured ? 'opacity: 0.6;' : ''}">
            <td><span class="tvl-type">YT Oct 23</span><span class="tvl-boost ${weighted.oct23.isMatured ? '' : 'boost-5x'}" style="${weighted.oct23.isMatured ? 'background-color: #fee2e2; color: #991b1b;' : ''}">${weighted.oct23.isMatured ? '0x (Matured)' : '5x Boost'}</span></td>
            <td>${formatCurrency(weighted.oct23.ytTvl)}${weighted.oct23.isMatured && weighted.oct23.lockedYtTvl > 0 ? ' <span style="font-size: 0.75em; color: #92400e;">(Locked: ' + formatCurrency(weighted.oct23.lockedYtTvl) + ')</span>' : ''}</td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}">${weighted.oct23.isMatured ? '0x' : '5x'}</td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}">${formatCurrency(weighted.oct23.weightedYt)}</td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}"><strong>${formatNumber(ytDailyPointsOct23)}</strong> ${!weighted.oct23.isMatured ? '<span style="font-size: 0.8em; color: #6c757d;">(gross)</span>' : ''}</td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}">${ytShareOct23.toFixed(2)}%</td>
        </tr>
        <tr style="background-color: #fee2e2; ${weighted.oct23.isMatured ? 'opacity: 0.6;' : ''}">
            <td style="padding-left: 20px;"><span class="tvl-type" style="color: #991b1b;">├─ Pendle Fee (5%)</span></td>
            <td style="color: #991b1b;">-</td>
            <td style="color: #991b1b;">-</td>
            <td style="color: #991b1b;">-</td>
            <td style="color: #991b1b;"><strong>-${formatNumber(ytDailyPointsOct23 * 0.05)}</strong></td>
            <td style="color: #991b1b;">-${((ytDailyPointsOct23 * 0.05 / (DAILY_POINTS + referralDailyPoints)) * 100).toFixed(2)}%</td>
        </tr>
        <tr style="background-color: #dcfce7; ${weighted.oct23.isMatured ? 'opacity: 0.6;' : ''}">
            <td style="padding-left: 20px;"><span class="tvl-type" style="color: #166534;">└─ YT Oct 23 NET</span></td>
            <td style="color: #166534;">-</td>
            <td style="color: #166534;">-</td>
            <td style="color: #166534;">-</td>
            <td style="color: #166534;"><strong>${formatNumber(ytDailyPointsOct23 * 0.95)}</strong> <span style="font-size: 0.8em;">(net)</span></td>
            <td style="color: #166534;">${((ytDailyPointsOct23 * 0.95 / (DAILY_POINTS + referralDailyPoints)) * 100).toFixed(2)}%</td>
        </tr>
        <tr style="background-color: #ffffff; ${weighted.oct23.isMatured ? 'opacity: 0.6;' : ''}">
            <td><span class="tvl-type">LP Oct 23</span><span class="tvl-boost ${weighted.oct23.isMatured ? '' : (weighted.oct23.lpBoost === 1.5 ? 'boost-1-5x' : 'boost-1-25x')}" style="${weighted.oct23.isMatured ? 'background-color: #fee2e2; color: #991b1b;' : ''}">${weighted.oct23.isMatured ? '0x (Matured)' : weighted.oct23.lpBoost + 'x Boost'}</span></td>
            <td>${formatCurrency(weighted.oct23.lpTvl)}${weighted.oct23.isMatured && weighted.oct23.lockedLpTvl > 0 ? ' <span style="font-size: 0.75em; color: #92400e;">(Locked)</span>' : ''}</td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}">${weighted.oct23.isMatured ? '0x' : weighted.oct23.lpBoost + 'x'}</td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}">${formatCurrency(weighted.oct23.weightedLp)}</td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}"><strong>${formatNumber(lpDailyPointsOct23)}</strong></td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}">${lpShareOct23.toFixed(2)}%</td>
        </tr>
        <tr style="opacity: 0.6; background-color: #fee2e2;">
            <td><span class="tvl-type">PT Oct 23</span><span class="tvl-boost" style="background-color: #fee2e2; color: #991b1b;">EXCLUDED</span></td>
            <td><strong>${formatCurrency(weighted.oct23.ptTvl || 0)}</strong></td>
            <td style="color: #991b1b;"><strong>0x</strong></td>
            <td style="color: #991b1b;"><strong>${formatCurrency(0)}</strong></td>
            <td style="color: #991b1b;"><strong>0</strong></td>
            <td style="color: #991b1b;"><strong>0%</strong></td>
        </tr>
        
        <!-- December 11 Market -->
        <tr style="background-color: ${weighted.dec11.isMatured ? '#fef3c7' : '#f0fdf4'}; border-top: 2px solid ${weighted.dec11.isMatured ? '#f59e0b' : '#10b981'};">
            <td colspan="6" style="padding: 10px 16px;">
                <strong style="font-size: 0.95rem; color: ${weighted.dec11.isMatured ? '#92400e' : '#065f46'};">
                    📅 December 11, 2025 Market ${weighted.dec11.isMatured ? '⚠️ MATURED' : ''}
                </strong>
                ${weighted.dec11.isMatured ? '<div style="font-size: 0.8rem; color: #92400e; margin-top: 4px;">⚠️ Market has matured. No points earned. Please migrate to active markets.</div>' : ''}
            </td>
        </tr>
        <tr style="background-color: #f9fafb; ${weighted.dec11.isMatured ? 'opacity: 0.6;' : ''}">
            <td><span class="tvl-type">YT Dec 11</span><span class="tvl-boost ${weighted.dec11.isMatured ? '' : 'boost-5x'}" style="${weighted.dec11.isMatured ? 'background-color: #fee2e2; color: #991b1b;' : ''}">${weighted.dec11.isMatured ? '0x (Matured)' : '5x Boost'}</span></td>
            <td>${formatCurrency(weighted.dec11.ytTvl)}${weighted.dec11.isMatured && weighted.dec11.lockedYtTvl > 0 ? ' <span style="font-size: 0.75em; color: #92400e;">(Locked: ' + formatCurrency(weighted.dec11.lockedYtTvl) + ')</span>' : ''}</td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}">${weighted.dec11.isMatured ? '0x' : '5x'}</td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}">${formatCurrency(weighted.dec11.weightedYt)}</td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}"><strong>${formatNumber(ytDailyPointsDec11)}</strong> ${!weighted.dec11.isMatured ? '<span style="font-size: 0.8em; color: #6c757d;">(gross)</span>' : ''}</td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}">${ytShareDec11.toFixed(2)}%</td>
        </tr>
        <tr style="background-color: #fee2e2; ${weighted.dec11.isMatured ? 'opacity: 0.6;' : ''}">
            <td style="padding-left: 20px;"><span class="tvl-type" style="color: #991b1b;">├─ Pendle Fee (5%)</span></td>
            <td style="color: #991b1b;">-</td>
            <td style="color: #991b1b;">-</td>
            <td style="color: #991b1b;">-</td>
            <td style="color: #991b1b;"><strong>-${formatNumber(ytDailyPointsDec11 * 0.05)}</strong></td>
            <td style="color: #991b1b;">-${((ytDailyPointsDec11 * 0.05 / (DAILY_POINTS + referralDailyPoints)) * 100).toFixed(2)}%</td>
        </tr>
        <tr style="background-color: #dcfce7; ${weighted.dec11.isMatured ? 'opacity: 0.6;' : ''}">
            <td style="padding-left: 20px;"><span class="tvl-type" style="color: #166534;">└─ YT Dec 11 NET</span></td>
            <td style="color: #166534;">-</td>
            <td style="color: #166534;">-</td>
            <td style="color: #166534;">-</td>
            <td style="color: #166534;"><strong>${formatNumber(ytDailyPointsDec11 * 0.95)}</strong> <span style="font-size: 0.8em;">(net)</span></td>
            <td style="color: #166534;">${((ytDailyPointsDec11 * 0.95 / (DAILY_POINTS + referralDailyPoints)) * 100).toFixed(2)}%</td>
        </tr>
        <tr style="background-color: #ffffff; ${weighted.dec11.isMatured ? 'opacity: 0.6;' : ''}">
            <td><span class="tvl-type">LP Dec 11</span><span class="tvl-boost ${weighted.dec11.isMatured ? '' : (weighted.dec11.lpBoost === 1.5 ? 'boost-1-5x' : 'boost-1-25x')}" style="${weighted.dec11.isMatured ? 'background-color: #fee2e2; color: #991b1b;' : ''}">${weighted.dec11.isMatured ? '0x (Matured)' : weighted.dec11.lpBoost + 'x Boost'}</span></td>
            <td>${formatCurrency(weighted.dec11.lpTvl)}${weighted.dec11.isMatured && weighted.dec11.lockedLpTvl > 0 ? ' <span style="font-size: 0.75em; color: #92400e;">(Locked)</span>' : ''}</td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}">${weighted.dec11.isMatured ? '0x' : weighted.dec11.lpBoost + 'x'}</td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}">${formatCurrency(weighted.dec11.weightedLp)}</td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}"><strong>${formatNumber(lpDailyPointsDec11)}</strong></td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}">${lpShareDec11.toFixed(2)}%</td>
        </tr>
        <tr style="opacity: 0.6; background-color: #fee2e2;">
            <td><span class="tvl-type">PT Dec 11</span><span class="tvl-boost" style="background-color: #fee2e2; color: #991b1b;">EXCLUDED</span></td>
            <td><strong>${formatCurrency(weighted.dec11.ptTvl || 0)}</strong></td>
            <td style="color: #991b1b;"><strong>0x</strong></td>
            <td style="color: #991b1b;"><strong>${formatCurrency(0)}</strong></td>
            <td style="color: #991b1b;"><strong>0</strong></td>
            <td style="color: #991b1b;"><strong>0%</strong></td>
        </tr>
        
        <!-- Combined YT Summary -->
        <tr style="background-color: #fef3c7; border-top: 2px solid #f59e0b;">
            <td colspan="6" style="padding: 10px 16px;">
                <strong style="font-size: 0.9rem; color: #92400e;">📊 Combined YT Summary</strong>
            </td>
        </tr>
        <tr style="background-color: #fffbeb;">
            <td style="padding-left: 20px;"><span class="tvl-type">Total YT (Both Markets)</span></td>
            <td>${formatCurrency(weighted.ytTvl)}</td>
            <td>5x</td>
            <td>${formatCurrency(weighted.weightedYt)}</td>
            <td><strong>${formatNumber(ytDailyPoints)}</strong> <span style="font-size: 0.8em; color: #6c757d;">(gross)</span></td>
            <td>${ytShare.toFixed(2)}%</td>
        </tr>
        <tr style="background-color: #fee2e2;">
            <td style="padding-left: 30px;"><span class="tvl-type" style="color: #991b1b;">├─ Pendle Fee (5%)</span></td>
            <td style="color: #991b1b;">-</td>
            <td style="color: #991b1b;">-</td>
            <td style="color: #991b1b;">-</td>
            <td style="color: #991b1b;"><strong>-${formatNumber(ytPendleFee)}</strong></td>
            <td style="color: #991b1b;">-${((ytPendleFee / (DAILY_POINTS + referralDailyPoints)) * 100).toFixed(2)}%</td>
        </tr>
        <tr style="background-color: #dcfce7;">
            <td style="padding-left: 30px;"><span class="tvl-type" style="color: #166534;">└─ YT NET Points</span></td>
            <td style="color: #166534;">-</td>
            <td style="color: #166534;">-</td>
            <td style="color: #166534;">-</td>
            <td style="color: #166534;"><strong>${formatNumber(ytNetPoints)}</strong> <span style="font-size: 0.8em;">(net)</span></td>
            <td style="color: #166534;">${((ytNetPoints / (DAILY_POINTS + referralDailyPoints)) * 100).toFixed(2)}%</td>
        </tr>
        <tr style="background-color: #fffbeb;">
            <td style="padding-left: 20px;"><span class="tvl-type">Total LP (Both Markets)</span></td>
            <td>${formatCurrency(weighted.lpTvl)}</td>
            <td>${weighted.oct23.lpBoost || weighted.dec11.lpBoost}x</td>
            <td>${formatCurrency(weighted.weightedLp)}</td>
            <td><strong>${formatNumber(lpDailyPoints)}</strong></td>
            <td>${lpShare.toFixed(2)}%</td>
        </tr>
        
        <!-- Shared Categories -->
        <tr style="background-color: #f3f4f6; border-top: 2px solid #6b7280;">
            <td colspan="6" style="padding: 10px 16px;">
                <strong style="font-size: 0.9rem; color: #374151;">🌐 Shared Categories</strong>
            </td>
        </tr>
        <tr>
            <td><span class="tvl-type">Curve Pool</span><span class="tvl-boost" style="background-color: #fef3c7; color: #92400e;">3x Boost</span></td>
            <td>${formatCurrency(weighted.curveTvl)}</td>
            <td>3x</td>
            <td>${formatCurrency(weighted.weightedCurve)}</td>
            <td><strong>${formatNumber(curveDailyPoints)}</strong></td>
            <td>${curveShare.toFixed(2)}%</td>
        </tr>
        <tr>
            <td><span class="tvl-type">Other TVL</span><span class="tvl-boost boost-1x">1x Boost</span></td>
            <td>${formatCurrency(weighted.otherTvl)}</td>
            <td>1x</td>
            <td>${formatCurrency(weighted.weightedOther)}</td>
            <td><strong>${formatNumber(otherDailyPoints)}</strong></td>
            <td>${otherShare.toFixed(2)}%</td>
        </tr>
        <tr style="opacity: 0.7; background-color: #fee2e2;">
            <td><span class="tvl-type">PT (Principal)</span><span class="tvl-boost" style="background-color: #fee2e2; color: #991b1b;">EXCLUDED</span></td>
            <td><strong>${formatCurrency(tvlData.pendlePtTvl || 0)}</strong></td>
            <td style="color: #991b1b;"><strong>0x</strong></td>
            <td style="color: #991b1b;"><strong>${formatCurrency(0)}</strong></td>
            <td style="color: #991b1b;"><strong>0</strong></td>
            <td style="color: #991b1b;"><strong>0%</strong></td>
        </tr>
        <tr style="background-color: #fef3c7;">
            <td><span class="tvl-type">Referral Program</span><span class="tvl-boost" style="background-color: #fef3c7; color: #92400e;">5% Reserve</span></td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td><strong>${formatNumber(referralDailyPoints)}</strong></td>
            <td>5%</td>
        </tr>
        <tr style="background-color: #fef3c7; border-top: 1px solid #f59e0b;">
            <td><span class="tvl-type" style="color: #92400e;">Pendle Fees (5% of YT, goes to Pendle)</span></td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td style="color: #92400e;"><strong>${formatNumber(ytPendleFee)}</strong></td>
            <td style="color: #92400e;">${((ytPendleFee / (DAILY_POINTS + referralDailyPoints)) * 100).toFixed(2)}%</td>
        </tr>
        <tr class="tvl-total-row">
            <td><strong>TOTAL DISTRIBUTED (to users)</strong></td>
            <td><strong>${formatCurrency(weighted.totalTvl)}</strong></td>
            <td>-</td>
            <td><strong>${formatCurrency(totalWeighted)}</strong></td>
            <td><strong>${formatNumber(ytNetPoints + lpDailyPoints + curveDailyPoints + otherDailyPoints + referralDailyPoints)}</strong></td>
            <td><strong>${(((ytNetPoints + lpDailyPoints + curveDailyPoints + otherDailyPoints + referralDailyPoints) / (DAILY_POINTS + referralDailyPoints)) * 100).toFixed(2)}%</strong></td>
        </tr>
    `;
    
    elements.tvlTableBody.innerHTML = tableHTML;
}

/**
 * Format currency
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * Format number with commas
 */
function formatNumber(value) {
    return new Intl.NumberFormat('en-US', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * Format FDV value for display (show as billions for 1000M+)
 * @param {number} fdvInMillions - FDV value in millions
 * @returns {string} Formatted FDV string
 */
function formatFdv(fdvInMillions) {
    if (fdvInMillions >= 1000) {
        const billions = fdvInMillions / 1000;
        return `${billions.toFixed(1)}B`.replace('.0B', 'B'); // Remove .0 if whole number
    }
    // For values under 1000M, show at most 1 decimal place, remove trailing zeros
    const rounded = Math.round(fdvInMillions * 10) / 10;
    return `${rounded}M`;
}

/**
 * Display Almanak points ROI scenarios with breakeven
 * @param {number} ytAmount - YT amount received (not input amount)
 * @param {number} daysToMaturity - Days remaining until maturity
 * @param {number} initialInvestment - Initial investment amount (optional, will try to get from input)
 */
function displayAlmanakScenarios(ytAmount, daysToMaturity, initialInvestment = null) {
    if (ytAmount <= 0 || daysToMaturity <= 0) {
        elements.almanakTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Calculate trade to see Almanak points scenarios</td></tr>';
        return;
    }
    
    // Check if we have weighted TVL data
    if (!marketData.weightedTvl) {
        elements.almanakTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Loading TVL data...</td></tr>';
        return;
    }
    
    // Get initial investment if not provided
    if (initialInvestment === null) {
        initialInvestment = parseFloat(elements.amountInput.value);
    }
    
    try {
        // Get selected market data
        const selectedMarket = marketData.selectedMarket;
        const selectedMarketData = marketData[selectedMarket];
        
        const scenarios = window.PendleAPI.calculateAlmanakPointsEarnings(
            ytAmount, 
            daysToMaturity, 
            marketData.weightedTvl,
            selectedMarketData.underlyingApy,
            initialInvestment
        );
        
        // Calculate breakeven FDV (using NET points after Pendle fee)
        const pointsBreakdown = window.PendleAPI.calculateDailyPoints(ytAmount, marketData.weightedTvl, 'yt');
        const totalNetPoints = pointsBreakdown.net * daysToMaturity;
        const dailyUnderlyingYield = ytAmount * (selectedMarketData.underlyingApy / 365);
        const totalUnderlyingYield = dailyUnderlyingYield * daysToMaturity;
        
        // FDV where Total Earnings = Initial Investment
        // (NET Points × Token Price) + Underlying Yield = Initial Investment
        // Token Price = (Initial Investment - Underlying Yield) / Total NET Points
        const neededPointsValue = initialInvestment - totalUnderlyingYield;
        let breakevenFdv = null;
        let breakevenTokenPrice = null;
        
        if (neededPointsValue > 0 && totalNetPoints > 0) {
            breakevenTokenPrice = neededPointsValue / totalNetPoints;
            breakevenFdv = (breakevenTokenPrice * 1000000000) / 1000000; // Convert to millions
        }
        
        // Filter scenarios to show 90M FDV, breakeven FDV, and higher
        const filteredScenarios = scenarios.filter(scenario => {
            if (!breakevenFdv) return true; // Show all if no breakeven calculated
            return scenario.fdv === 90 || scenario.fdv >= breakevenFdv; // Always keep 90M
        });
        
        const tableRowsHTML = filteredScenarios.map(scenario => {
            // Color code ROI (green if profit, red if loss)
            const roiColor = scenario.isProfit ? '#10b981' : '#dc2626';
            
            // Color code breakeven status
            let breakevenColor = '#6c757d'; // default gray
            if (scenario.breakevenStatus === 'No breakeven') {
                breakevenColor = '#dc2626'; // red
            } else if (scenario.breakevenDays <= daysToMaturity) {
                // Breakeven within maturity period
                breakevenColor = '#10b981'; // green
            } else {
                // Breakeven exceeds maturity period
                breakevenColor = '#f59e0b'; // orange
            }
            
            // Format underlying yield portion and Pendle fee
            const yieldFormatted = `$${scenario.underlyingYieldValue.toFixed(2)}`;
            const pendleFeeFormatted = `$${scenario.pendleFeeUsdValue.toFixed(2)}`;
            
            return `
                <tr>
                    <td class="fdv-cell">${formatFdv(scenario.fdv)}</td>
                    <td class="apy-cell" style="color: ${roiColor};">${scenario.roiPercentage}%</td>
                    <td class="usd-cell">
                        ${scenario.earningsFormatted}
                        <div style="font-size: 0.75em; color: #6c757d; font-weight: normal; margin-top: 2px;">
                            ${yieldFormatted} yield<br>
                            <span style="color: #dc2626;">-${pendleFeeFormatted} Pendle fee (5%)</span>
                        </div>
                    </td>
                    <td style="font-weight: 600;">${daysToMaturity} days</td>
                    <td class="breakeven-cell" style="color: ${breakevenColor}; font-weight: 600;">${scenario.breakevenStatus}</td>
                </tr>
            `;
        }).join('');
        
        // Insert breakeven FDV row if applicable
        let finalHTML = tableRowsHTML;
        if (breakevenFdv && breakevenFdv > 0) {
            // Find where to insert the breakeven row
            const rows = tableRowsHTML.split('</tr>');
            let insertIndex = -1;
            
            for (let i = 0; i < filteredScenarios.length; i++) {
                if (filteredScenarios[i].fdv >= breakevenFdv) {
                    insertIndex = i;
                    break;
                }
            }
            
            // Create breakeven row
            const breakevenRow = `
                <tr style="background-color: #dbeafe; border: 2px solid #3b82f6;">
                    <td class="fdv-cell" style="color: #1e40af; font-weight: 700;">${formatFdv(breakevenFdv)}</td>
                    <td class="apy-cell" style="color: #1e40af; font-weight: 700;">~0.00%</td>
                    <td class="usd-cell" style="color: #1e40af;">
                        $${initialInvestment.toFixed(2)}
                        <div style="font-size: 0.75em; color: #6c757d; font-weight: normal;">($${totalUnderlyingYield.toFixed(2)} yield)</div>
                    </td>
                    <td style="font-weight: 600; color: #1e40af;">${daysToMaturity} days</td>
                    <td class="breakeven-cell" style="color: #3b82f6; font-weight: 700;">
                        ✓ Breakeven FDV
                    </td>
                </tr>
            `;
            
            if (insertIndex >= 0) {
                // Insert before the found index
                const rowsArray = rows.slice(0, -1); // Remove last empty element
                rowsArray.splice(insertIndex, 0, breakevenRow.trim());
                finalHTML = rowsArray.join('</tr>') + '</tr>';
            } else {
                // Append at the end
                finalHTML = tableRowsHTML + breakevenRow;
            }
        }
        
        elements.almanakTableBody.innerHTML = finalHTML;
        
    } catch (error) {
        console.error('Error displaying Almanak scenarios:', error);
        elements.almanakTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Error loading scenarios</td></tr>';
    }
}

/**
 * Switch to new trade mode
 */
function switchToNewTrade() {
    elements.newTradeBtn.classList.add('active');
    elements.existingYtBtn.classList.remove('active');
    elements.newTradeBtn.style.background = 'var(--primary-black)';
    elements.newTradeBtn.style.color = 'white';
    elements.newTradeBtn.style.borderColor = 'var(--primary-black)';
    elements.existingYtBtn.style.background = 'white';
    elements.existingYtBtn.style.color = 'var(--primary-black)';
    elements.existingYtBtn.style.borderColor = 'var(--border-gray)';
    
    elements.newTradeSection.style.display = 'block';
    elements.existingYtSection.style.display = 'none';
    
    hideResults();
    hideError();
}

/**
 * Switch to existing YT holder mode
 */
function switchToExistingYt() {
    elements.existingYtBtn.classList.add('active');
    elements.newTradeBtn.classList.remove('active');
    elements.existingYtBtn.style.background = 'var(--primary-black)';
    elements.existingYtBtn.style.color = 'white';
    elements.existingYtBtn.style.borderColor = 'var(--primary-black)';
    elements.newTradeBtn.style.background = 'white';
    elements.newTradeBtn.style.color = 'var(--primary-black)';
    elements.newTradeBtn.style.borderColor = 'var(--border-gray)';
    
    elements.existingYtSection.style.display = 'block';
    elements.newTradeSection.style.display = 'none';
    
    hideResults();
    hideError();
}

/**
 * Handle calculate button click for existing YT holders
 */
async function handleCalculateExisting() {
    const ytAmount = elements.ytAmountInput.value.trim();
    const ytCost = elements.ytCostInput.value.trim();
    
    // Validate inputs
    if (!ytAmount || !ytCost) {
        showError('Please enter both YT amount and total cost');
        return;
    }
    
    const numYtAmount = parseFloat(ytAmount);
    const numYtCost = parseFloat(ytCost);
    
    if (isNaN(numYtAmount) || numYtAmount <= 0) {
        showError('Please enter a valid YT amount');
        return;
    }
    
    if (isNaN(numYtCost) || numYtCost <= 0) {
        showError('Please enter a valid cost');
        return;
    }
    
    // Get selected market data
    const selectedMarket = marketData.selectedMarket;
    const selectedMarketData = marketData[selectedMarket];
    
    // Check if market data is loaded
    if (!marketData.weightedTvl || selectedMarketData.daysToMaturity <= 0) {
        showError('Market data not loaded yet. Please wait a moment and try again.');
        return;
    }
    
    try {
        // Show loading state
        setLoadingState(true);
        hideError();
        hideResults();
        
        // Display results for existing YT holder
        displayExistingYtResults(numYtAmount, numYtCost);
        
    } catch (error) {
        console.error('Calculation error:', error);
        showError('An unexpected error occurred. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

/**
 * Display results for existing YT holders
 * @param {number} ytAmount - YT amount held
 * @param {number} ytCost - Total cost paid
 */
function displayExistingYtResults(ytAmount, ytCost) {
    // Hide trade execution details (not relevant for existing holders)
    const tradeSection = document.querySelector('.results .result-section:first-child');
    if (tradeSection) {
        tradeSection.style.display = 'none';
    }
    
    // Get selected market data
    const selectedMarket = marketData.selectedMarket;
    const selectedMarketData = marketData[selectedMarket];
    
    // Calculate and display estimated points
    if (ytAmount > 0 && marketData.weightedTvl && selectedMarketData.daysToMaturity > 0) {
        try {
            const pointsBreakdown = window.PendleAPI.calculateDailyPoints(ytAmount, marketData.weightedTvl, 'yt');
            const totalGrossPoints = pointsBreakdown.gross * selectedMarketData.daysToMaturity;
            const totalPendleFee = pointsBreakdown.pendleFee * selectedMarketData.daysToMaturity;
            const totalNetPoints = pointsBreakdown.net * selectedMarketData.daysToMaturity;
            
            const pointsHTML = `
                <div style="font-weight: 700;">${formatNumber(totalNetPoints)} points (NET)</div>
                <div style="font-size: 0.85em; color: #6c757d; margin-top: 4px;">
                    ${formatNumber(pointsBreakdown.net)} daily | ${formatNumber(totalGrossPoints)} gross<br>
                    <span style="color: #dc2626;">- ${formatNumber(totalPendleFee)} Pendle fees (5%)</span>
                </div>
            `;
            
            // Update maturity points display (the one that's visible)
            elements.resultElements.maturityPoints.innerHTML = pointsHTML;
        } catch (error) {
            console.error('Error calculating points:', error);
            elements.resultElements.maturityPoints.textContent = 'N/A';
        }
    }
    
    // Calculate maturity earnings based on YT amount
    if (ytAmount > 0 && selectedMarketData.underlyingApy > 0 && selectedMarketData.daysToMaturity > 0) {
        try {
            const maturityReturn = window.PendleAPI.calculateMaturityApy(selectedMarketData.underlyingApy, selectedMarketData.daysToMaturity);
            const earnings = window.PendleAPI.calculateMaturityEarnings(ytAmount, maturityReturn, selectedMarketData.underlyingApy, selectedMarketData.daysToMaturity, ytCost);
            
            // Display ROI
            elements.resultElements.maturityApy.textContent = `${earnings.roiPercentage}%`;
            
            // Display expected earnings
            elements.resultElements.expectedEarnings.textContent = `${earnings.earnings.toFixed(2)} USDC`;
            
            // Display total yield value
            elements.resultElements.totalMaturityValue.textContent = `${earnings.totalValue.toFixed(2)} USDC (YT → 0)`;
        } catch (error) {
            console.error('Error calculating maturity earnings:', error);
            elements.resultElements.maturityApy.textContent = 'Error';
            elements.resultElements.expectedEarnings.textContent = 'Error';
            elements.resultElements.totalMaturityValue.textContent = 'Error';
        }
    }
    
    // Display Almanak points scenarios (pass ytCost as initialInvestment)
    displayAlmanakScenarios(ytAmount, selectedMarketData.daysToMaturity, ytCost);
    
    // Show results
    showResults();
    
    console.log('Existing YT Holder Results:', {
        ytAmount,
        ytCost,
        selectedMarket: marketData.selectedMarket,
        daysToMaturity: selectedMarketData.daysToMaturity
    });
}

// Export functions for potential external use
window.MoonshotCalculator = {
    calculateMoonshot: handleCalculateClick,
    calculateExisting: handleCalculateExisting,
    resetForm,
    validateAmount,
    refreshMarketData,
    updateCountdown,
    displayTvlBreakdown,
    switchToNewTrade,
    switchToExistingYt
};
