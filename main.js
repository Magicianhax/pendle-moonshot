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
    countdown: null,
    underlyingApy: null,
    impliedApy: null,
    tvlTableBody: null,
    resultElements: {
        inputAmount: null,
        netFromTaker: null,
        netToTaker: null,
        fee: null,
        estimatedPoints: null,
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
    underlyingApy: 0,
    impliedApy: 0,
    daysToMaturity: 0,
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
    elements.countdown = document.getElementById('countdown');
    elements.underlyingApy = document.getElementById('underlyingApy');
    elements.impliedApy = document.getElementById('impliedApy');
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
    elements.resultElements.maturityApy = document.getElementById('maturityApy');
    elements.resultElements.expectedEarnings = document.getElementById('expectedEarnings');
    elements.resultElements.totalMaturityValue = document.getElementById('totalMaturityValue');
    elements.almanakTableBody = document.getElementById('almanakTableBody');

    // Verify all elements loaded
    console.log('DOM elements loaded:', {
        tvlTableBody: !!elements.tvlTableBody,
        underlyingApy: !!elements.underlyingApy,
        impliedApy: !!elements.impliedApy,
        countdown: !!elements.countdown,
        newTradeBtn: !!elements.newTradeBtn,
        existingYtBtn: !!elements.existingYtBtn
    });

    // Set up event listeners
    setupEventListeners();
    
    // Initialize market data and countdown
    initializeMarketData();
    
    console.log('✅ Pendle Moonshot Calculator initialized');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
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

        // Call Pendle API
        const apiResponse = await window.PendleAPI.calculateMoonshot(amount);
        
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
    if (ytAmount > 0 && marketData.weightedTvl && marketData.daysToMaturity > 0) {
        try {
            const pointsBreakdown = window.PendleAPI.calculateDailyPoints(ytAmount, marketData.weightedTvl, 'yt');
            const totalGrossPoints = pointsBreakdown.gross * marketData.daysToMaturity;
            const totalPendleFee = pointsBreakdown.pendleFee * marketData.daysToMaturity;
            const totalNetPoints = pointsBreakdown.net * marketData.daysToMaturity;
            
            elements.resultElements.estimatedPoints.innerHTML = `
                <div style="font-weight: 700;">${formatNumber(totalNetPoints)} points (NET)</div>
                <div style="font-size: 0.85em; color: #6c757d; margin-top: 4px;">
                    ${formatNumber(pointsBreakdown.net)} daily | ${formatNumber(totalGrossPoints)} gross<br>
                    <span style="color: #dc2626;">- ${formatNumber(totalPendleFee)} Pendle fees (5%)</span>
                </div>
            `;
        } catch (error) {
            console.error('Error calculating points:', error);
            elements.resultElements.estimatedPoints.textContent = 'N/A';
        }
    } else {
        elements.resultElements.estimatedPoints.textContent = 'N/A';
    }
    
    // Calculate and display maturity earnings based on YT amount received (reuse ytAmount from above)
    const initialInvestment = parseFloat(elements.amountInput.value); // Get initial investment
    console.log('Market data for maturity calculation:', {
        ytAmount: ytAmount,
        initialInvestment: initialInvestment,
        underlyingApy: marketData.underlyingApy,
        daysToMaturity: marketData.daysToMaturity
    });
    
    if (ytAmount > 0 && marketData.underlyingApy > 0 && marketData.daysToMaturity > 0) {
        try {
            const maturityReturn = window.PendleAPI.calculateMaturityApy(marketData.underlyingApy, marketData.daysToMaturity);
            const earnings = window.PendleAPI.calculateMaturityEarnings(ytAmount, maturityReturn, marketData.underlyingApy, marketData.daysToMaturity, initialInvestment);
            
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
    displayAlmanakScenarios(ytAmount, marketData.daysToMaturity);
    
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
        // Update countdown immediately
        updateCountdown();
        
        // Fetch market data
        const response = await window.PendleAPI.getMarketData();
        if (response.success) {
            marketData.underlyingApy = response.data.underlyingApy;
            marketData.impliedApy = response.data.impliedApy;
            marketData.lastUpdated = new Date();
            
            // Update UI
            elements.underlyingApy.textContent = `${(response.data.underlyingApy * 100).toFixed(2)}%`;
            elements.impliedApy.textContent = `${(response.data.impliedApy * 100).toFixed(2)}%`;
        } else {
            elements.underlyingApy.textContent = 'Error loading';
            elements.impliedApy.textContent = 'Error loading';
            console.error('Failed to load market data:', response.error);
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
        elements.underlyingApy.textContent = 'Error loading';
        elements.countdown.textContent = 'Error loading';
    }
}

/**
 * Update countdown display
 */
function updateCountdown() {
    const daysToMaturity = window.PendleAPI.getDaysToMaturity();
    marketData.daysToMaturity = daysToMaturity;
    
    if (daysToMaturity > 0) {
        const dayText = daysToMaturity === 1 ? 'day' : 'days';
        elements.countdown.textContent = `${daysToMaturity} ${dayText}`;
    } else {
        elements.countdown.textContent = 'Matured';
    }
}

/**
 * Refresh market data
 */
async function refreshMarketData() {
    try {
        const response = await window.PendleAPI.getMarketData();
        if (response.success) {
            marketData.underlyingApy = response.data.underlyingApy;
            marketData.impliedApy = response.data.impliedApy;
            marketData.lastUpdated = new Date();
            
            // Update UI
            elements.underlyingApy.textContent = `${(response.data.underlyingApy * 100).toFixed(2)}%`;
            elements.impliedApy.textContent = `${(response.data.impliedApy * 100).toFixed(2)}%`;
            
            console.log('Market data refreshed:', response.data);
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
    
    // Calculate points share percentages and daily points
    const ytShare = (weighted.weightedYt / totalWeighted) * 100;
    const lpShare = (weighted.weightedLp / totalWeighted) * 100;
    const curveShare = (weighted.weightedCurve / totalWeighted) * 100;
    const otherShare = (weighted.weightedOther / totalWeighted) * 100;
    
    const ytDailyPoints = (weighted.weightedYt / totalWeighted) * DAILY_POINTS;
    const lpDailyPoints = (weighted.weightedLp / totalWeighted) * DAILY_POINTS;
    const curveDailyPoints = (weighted.weightedCurve / totalWeighted) * DAILY_POINTS;
    const otherDailyPoints = (weighted.weightedOther / totalWeighted) * DAILY_POINTS;
    const referralDailyPoints = 16667; // 5% reserved for referral program
    
    // Calculate Pendle fees (5% from YT points only)
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
            <td colspan="2"><span class="tvl-type">alUSD Supply (${formatNumber(tvlData.alUsdSupply)} × $1.0243)</span></td>
            <td colspan="4"><strong>${formatCurrency(tvlData.alUsdSupply * 1.0243)}</strong></td>
        </tr>
        <tr style="background-color: #ffffff;">
            <td colspan="2"><span class="tvl-type">alpUSD Supply (${formatNumber(tvlData.alpUsdSupply)} × $1.01)</span></td>
            <td colspan="4"><strong>${formatCurrency(tvlData.alpUsdSupply * 1.01)}</strong></td>
        </tr>
        <tr style="background-color: #e0f2fe; font-weight: 600;">
            <td colspan="2"><strong>GROSS TVL</strong></td>
            <td colspan="4"><strong>${formatCurrency(tvlData.grossTvl || tvlData.defiLlamaTvl)}</strong></td>
        </tr>
        <tr style="background-color: #fee2e2;">
            <td colspan="2"><span class="tvl-type" style="color: #991b1b;">Minus: SY alUSD (${formatNumber(tvlData.syAlUsdBalance)} × $1.0243)</span></td>
            <td colspan="4"><strong style="color: #991b1b;">-${formatCurrency(tvlData.syAlUsdBalance * 1.0243)}</strong></td>
        </tr>
        <tr style="background-color: #dbeafe; font-weight: 600; border-bottom: 3px solid #0284c7;">
            <td colspan="2"><strong>NET TVL (for points)</strong></td>
            <td colspan="4"><strong style="font-size: 1.1rem;">${formatCurrency(tvlData.totalTvl)}</strong></td>
        </tr>
        
        <!-- Points Distribution Section -->
        <tr style="background-color: #f0f9ff; border-bottom: 2px solid #0284c7;">
            <td colspan="6" style="padding: 12px 16px; padding-top: 20px;">
                <strong style="font-size: 1.05rem;">🎯 Points Distribution Breakdown</strong>
            </td>
        </tr>
        <tr>
            <td><span class="tvl-type">YT (Yield Tokens)</span><span class="tvl-boost boost-5x">5x Boost</span></td>
            <td>${formatCurrency(weighted.ytTvl)}</td>
            <td>5x</td>
            <td>${formatCurrency(weighted.weightedYt)}</td>
            <td><strong>${formatNumber(ytDailyPoints)}</strong> <span style="font-size: 0.8em; color: #6c757d;">(gross)</span></td>
            <td>${ytShare.toFixed(2)}%</td>
        </tr>
        <tr style="background-color: #fee2e2;">
            <td style="padding-left: 30px;"><span class="tvl-type" style="color: #991b1b;">├─ Pendle Fee (5% from YT)</span></td>
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
        <tr>
            <td><span class="tvl-type">LP (Liquidity)</span><span class="tvl-boost boost-1-25x">1.25x Boost</span></td>
            <td>${formatCurrency(weighted.lpTvl)}</td>
            <td>1.25x</td>
            <td>${formatCurrency(weighted.weightedLp)}</td>
            <td><strong>${formatNumber(lpDailyPoints)}</strong></td>
            <td>${lpShare.toFixed(2)}%</td>
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
            <td><span class="tvl-type" style="color: #92400e;">Pendle Fees (goes to Pendle)</span></td>
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
 * Display Almanak points ROI scenarios with breakeven
 * @param {number} ytAmount - YT amount received (not input amount)
 * @param {number} daysToMaturity - Days remaining until maturity
 */
function displayAlmanakScenarios(ytAmount, daysToMaturity) {
    if (ytAmount <= 0 || daysToMaturity <= 0) {
        elements.almanakTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Calculate trade to see Almanak points scenarios</td></tr>';
        return;
    }
    
    // Check if we have weighted TVL data
    if (!marketData.weightedTvl) {
        elements.almanakTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Loading TVL data...</td></tr>';
        return;
    }
    
    // Get initial investment
    const initialInvestment = parseFloat(elements.amountInput.value);
    
    try {
        const scenarios = window.PendleAPI.calculateAlmanakPointsEarnings(
            ytAmount, 
            daysToMaturity, 
            marketData.weightedTvl,
            marketData.underlyingApy,
            initialInvestment
        );
        
        // Calculate breakeven FDV (using NET points after Pendle fee)
        const pointsBreakdown = window.PendleAPI.calculateDailyPoints(ytAmount, marketData.weightedTvl, 'yt');
        const totalNetPoints = pointsBreakdown.net * daysToMaturity;
        const dailyUnderlyingYield = ytAmount * (marketData.underlyingApy / 365);
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
                    <td class="fdv-cell">${scenario.fdv}M</td>
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
                    <td class="fdv-cell" style="color: #1e40af; font-weight: 700;">${breakevenFdv.toFixed(0)}M</td>
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
    
    // Check if market data is loaded
    if (!marketData.weightedTvl || marketData.daysToMaturity <= 0) {
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
    
    // Calculate and display estimated points
    if (ytAmount > 0 && marketData.weightedTvl && marketData.daysToMaturity > 0) {
        try {
            const pointsBreakdown = window.PendleAPI.calculateDailyPoints(ytAmount, marketData.weightedTvl, 'yt');
            const totalGrossPoints = pointsBreakdown.gross * marketData.daysToMaturity;
            const totalPendleFee = pointsBreakdown.pendleFee * marketData.daysToMaturity;
            const totalNetPoints = pointsBreakdown.net * marketData.daysToMaturity;
            
            elements.resultElements.estimatedPoints.innerHTML = `
                <div style="font-weight: 700;">${formatNumber(totalNetPoints)} points (NET)</div>
                <div style="font-size: 0.85em; color: #6c757d; margin-top: 4px;">
                    ${formatNumber(pointsBreakdown.net)} daily | ${formatNumber(totalGrossPoints)} gross<br>
                    <span style="color: #dc2626;">- ${formatNumber(totalPendleFee)} Pendle fees (5%)</span>
                </div>
            `;
        } catch (error) {
            console.error('Error calculating points:', error);
            elements.resultElements.estimatedPoints.textContent = 'N/A';
        }
    }
    
    // Calculate maturity earnings based on YT amount
    if (ytAmount > 0 && marketData.underlyingApy > 0 && marketData.daysToMaturity > 0) {
        try {
            const maturityReturn = window.PendleAPI.calculateMaturityApy(marketData.underlyingApy, marketData.daysToMaturity);
            const earnings = window.PendleAPI.calculateMaturityEarnings(ytAmount, maturityReturn, marketData.underlyingApy, marketData.daysToMaturity, ytCost);
            
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
    
    // Display Almanak points scenarios
    displayAlmanakScenarios(ytAmount, marketData.daysToMaturity);
    
    // Show results
    showResults();
    
    console.log('Existing YT Holder Results:', {
        ytAmount,
        ytCost,
        daysToMaturity: marketData.daysToMaturity
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
