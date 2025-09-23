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
    resultElements: {
        inputAmount: null,
        netFromTaker: null,
        netToTaker: null,
        fee: null,
        potentialReturn: null,
        maturityApy: null,
        expectedEarnings: null,
        totalMaturityValue: null
    },
    almanakTableBody: null
};

/**
 * Global state for market data
 */
let marketData = {
    underlyingApy: 0,
    daysToMaturity: 0,
    lastUpdated: null
};

/**
 * Initialize the application
 */
function initializeApp() {
    // Get DOM elements
    elements.amountInput = document.getElementById('amount');
    elements.calculateBtn = document.querySelector('.calculate-btn');
    elements.loadingDiv = document.getElementById('loading');
    elements.resultsDiv = document.getElementById('results');
    elements.errorDiv = document.getElementById('error');
    elements.countdown = document.getElementById('countdown');
    elements.underlyingApy = document.getElementById('underlyingApy');
    
    // Get result elements
    elements.resultElements.inputAmount = document.getElementById('inputAmount');
    elements.resultElements.netFromTaker = document.getElementById('netFromTaker');
    elements.resultElements.netToTaker = document.getElementById('netToTaker');
    elements.resultElements.fee = document.getElementById('fee');
    elements.resultElements.potentialReturn = document.getElementById('potentialReturn');
    elements.resultElements.maturityApy = document.getElementById('maturityApy');
    elements.resultElements.expectedEarnings = document.getElementById('expectedEarnings');
    elements.resultElements.totalMaturityValue = document.getElementById('totalMaturityValue');
    elements.almanakTableBody = document.getElementById('almanakTableBody');

    // Set up event listeners
    setupEventListeners();
    
    // Initialize market data and countdown
    initializeMarketData();
    
    console.log('Pendle Moonshot Calculator initialized');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Calculate button click
    elements.calculateBtn.addEventListener('click', handleCalculateClick);
    
    // Enter key on input
    elements.amountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleCalculateClick();
        }
    });
    
    // Input validation
    elements.amountInput.addEventListener('input', validateInput);
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
    // Update trade result elements
    elements.resultElements.inputAmount.textContent = results.inputAmount;
    elements.resultElements.netFromTaker.textContent = results.netFromTaker;
    elements.resultElements.netToTaker.textContent = results.netToTaker;
    elements.resultElements.fee.textContent = results.fee;
    elements.resultElements.potentialReturn.textContent = results.potentialReturn;
    
    // Calculate and display maturity earnings based on YT amount received
    const ytAmount = parseFloat(results.netToTaker.replace(/[^\d.-]/g, '')); // Extract YT amount from results
    console.log('Market data for maturity calculation:', {
        ytAmount,
        inputAmount: parseFloat(elements.amountInput.value),
        underlyingApy: marketData.underlyingApy,
        daysToMaturity: marketData.daysToMaturity
    });
    
    if (ytAmount > 0 && marketData.underlyingApy > 0 && marketData.daysToMaturity > 0) {
        try {
            const maturityReturn = window.PendleAPI.calculateMaturityApy(marketData.underlyingApy, marketData.daysToMaturity);
            const earnings = window.PendleAPI.calculateMaturityEarnings(ytAmount, maturityReturn, marketData.underlyingApy, marketData.daysToMaturity);
            
            elements.resultElements.maturityApy.textContent = `${earnings.apyPercentage}%`;
            elements.resultElements.expectedEarnings.textContent = `${earnings.earnings.toFixed(2)} USDC`;
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
    elements.calculateBtn.disabled = isLoading;
    elements.calculateBtn.textContent = isLoading ? 'Calculating...' : 'Calculate Moonshot';
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
            marketData.lastUpdated = new Date();
            
            // Update UI
            elements.underlyingApy.textContent = `${(response.data.underlyingApy * 100).toFixed(2)}%`;
        } else {
            elements.underlyingApy.textContent = 'Error loading';
            console.error('Failed to load market data:', response.error);
        }
        
        // Set up countdown timer to update every minute
        setInterval(updateCountdown, 60000);
        
        // Set up market data refresh every 5 minutes
        setInterval(refreshMarketData, 300000);
        
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
            marketData.lastUpdated = new Date();
            
            // Update UI
            elements.underlyingApy.textContent = `${(response.data.underlyingApy * 100).toFixed(2)}%`;
            
            console.log('Market data refreshed:', response.data);
        }
    } catch (error) {
        console.error('Failed to refresh market data:', error);
    }
}

/**
 * Display Almanak points APY scenarios
 * @param {number} ytAmount - YT amount received (not input amount)
 * @param {number} daysToMaturity - Days remaining until maturity
 */
function displayAlmanakScenarios(ytAmount, daysToMaturity) {
    if (ytAmount <= 0 || daysToMaturity <= 0) {
        elements.almanakTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">Calculate trade to see Almanak points scenarios</td></tr>';
        return;
    }
    
    try {
        const scenarios = window.PendleAPI.calculateAlmanakPointsEarnings(ytAmount, daysToMaturity);
        
        const tableRowsHTML = scenarios.map(scenario => `
            <tr>
                <td class="fdv-cell">${scenario.fdv}M</td>
                <td class="apy-cell">${scenario.apyPercentage}%</td>
                <td class="usd-cell">${scenario.earningsFormatted}</td>
            </tr>
        `).join('');
        
        elements.almanakTableBody.innerHTML = tableRowsHTML;
        
    } catch (error) {
        console.error('Error displaying Almanak scenarios:', error);
        elements.almanakTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">Error loading scenarios</td></tr>';
    }
}

// Export functions for potential external use
window.MoonshotCalculator = {
    calculateMoonshot: handleCalculateClick,
    resetForm,
    validateAmount,
    refreshMarketData,
    updateCountdown
};
