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
    selectedMarket: 'dec11', // Only December 11 market active
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
    
    // Market selector buttons removed (only Dec 11 active)
    // elements.marketOct23Btn = document.getElementById('marketOct23Btn');
    // elements.marketDec11Btn = document.getElementById('marketDec11Btn');
    
    // October 23 market elements removed (market excluded from points)
    // elements.countdownOct23 = document.getElementById('countdownOct23');
    // elements.underlyingApyOct23 = document.getElementById('underlyingApyOct23');
    // elements.impliedApyOct23 = document.getElementById('impliedApyOct23');
    
    // Get December 11 market elements
    elements.countdownDec11 = document.getElementById('countdownDec11');
    elements.underlyingApyDec11 = document.getElementById('underlyingApyDec11');
    elements.impliedApyDec11 = document.getElementById('impliedApyDec11');
    
    // Get TVL table
    elements.tvlTableBody = document.getElementById('tvlTableBody');
    
    // Get toggle elements
    elements.newTradeBtn = document.getElementById('newTradeBtn');
    elements.existingYtBtn = document.getElementById('existingYtBtn');
    elements.minFundsBtn = document.getElementById('minFundsBtn');
    elements.newTradeSection = document.getElementById('newTradeSection');
    elements.existingYtSection = document.getElementById('existingYtSection');
    elements.minFundsSection = document.getElementById('minFundsSection');
    elements.minFundsTableBody = document.getElementById('minFundsTableBody');
    
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
        tvlTableBody: !!elements.tvlTableBody,
        underlyingApyDec11: !!elements.underlyingApyDec11,
        impliedApyDec11: !!elements.impliedApyDec11
    });

    // Set up event listeners
    setupEventListeners();
    
    // Set up download buttons
    setupDownloadButtons();
    
    // Initialize market data and countdown
    initializeMarketData();
    
    console.log('✅ Pendle Moonshot Calculator initialized (December 11 market only)');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Market selector buttons removed (only Dec 11 active)
    // elements.marketOct23Btn.addEventListener('click', () => switchMarket('oct23'));
    // elements.marketDec11Btn.addEventListener('click', () => switchMarket('dec11'));
    
    // Toggle buttons
    elements.newTradeBtn.addEventListener('click', () => switchToNewTrade());
    elements.existingYtBtn.addEventListener('click', () => switchToExistingYt());
    elements.minFundsBtn.addEventListener('click', () => switchToMinFunds());
    
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
    
    // Update button styles using CSS classes
    if (market === 'oct23') {
        elements.marketOct23Btn.classList.add('oct23-active');
        elements.marketOct23Btn.classList.remove('dec11-active');
        elements.marketDec11Btn.classList.remove('oct23-active', 'dec11-active');
    } else {
        elements.marketDec11Btn.classList.add('dec11-active');
        elements.marketDec11Btn.classList.remove('oct23-active');
        elements.marketOct23Btn.classList.remove('oct23-active', 'dec11-active');
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
 * Download table as PNG image
 * @param {string} elementId - ID of the element to capture
 * @param {string} filename - Name of the downloaded file
 */
async function downloadTableAsPNG(elementId, filename) {
    const element = document.getElementById(elementId);
    
    if (!element) {
        console.error('Element not found:', elementId);
        return;
    }

    try {
        // Show loading state on button
        const button = event.target.closest('.download-btn');
        if (button) {
            button.disabled = true;
            button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg> GENERATING...';
        }

        // Check if currently in dark mode
        const wasDarkMode = document.body.classList.contains('dark-mode');
        
        // Check if this is the TVL table or Almanak table (which need regeneration)
        const isTvlTable = elementId === 'tvlDownloadContainer';
        const isAlmanakTable = elementId === 'almanakDownloadContainer';
        
        // Temporarily switch to light mode for screenshot
        if (wasDarkMode) {
            document.body.classList.remove('dark-mode');
            
            // If it's the TVL table, regenerate it with light theme colors
            if (isTvlTable && marketData.tvlData && marketData.weightedTvl) {
                displayTvlBreakdown();
            }
            
            // If it's the Almanak table, regenerate it with light theme colors
            if (isAlmanakTable && elements.resultsDiv.classList.contains('show')) {
                const netToTakerText = elements.resultElements.netToTaker.textContent;
                const ytAmount = parseFloat(netToTakerText.replace(/[^\d.-]/g, ''));
                
                if (ytAmount > 0) {
                    const selectedMarket = marketData.selectedMarket;
                    const selectedMarketData = marketData[selectedMarket];
                    
                    let initialInvestment = parseFloat(elements.amountInput.value);
                    if (!initialInvestment && elements.ytCostInput.value) {
                        initialInvestment = parseFloat(elements.ytCostInput.value);
                    }
                    
                    if (selectedMarketData.daysToMaturity > 0 && initialInvestment > 0) {
                        displayAlmanakScenarios(ytAmount, selectedMarketData.daysToMaturity, initialInvestment);
                    }
                }
            }
            
            // Wait for CSS transition and regeneration to complete
            await new Promise(resolve => setTimeout(resolve, 150));
        }

        // Use html2canvas to capture the element
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher quality
            logging: false,
            useCORS: true,
            allowTaint: true,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        });

        // Restore dark mode if it was enabled
        if (wasDarkMode) {
            document.body.classList.add('dark-mode');
            
            // Regenerate TVL table with dark theme colors
            if (isTvlTable && marketData.tvlData && marketData.weightedTvl) {
                displayTvlBreakdown();
            }
            
            // Regenerate Almanak table with dark theme colors
            if (isAlmanakTable && elements.resultsDiv.classList.contains('show')) {
                const netToTakerText = elements.resultElements.netToTaker.textContent;
                const ytAmount = parseFloat(netToTakerText.replace(/[^\d.-]/g, ''));
                
                if (ytAmount > 0) {
                    const selectedMarket = marketData.selectedMarket;
                    const selectedMarketData = marketData[selectedMarket];
                    
                    let initialInvestment = parseFloat(elements.amountInput.value);
                    if (!initialInvestment && elements.ytCostInput.value) {
                        initialInvestment = parseFloat(elements.ytCostInput.value);
                    }
                    
                    if (selectedMarketData.daysToMaturity > 0 && initialInvestment > 0) {
                        displayAlmanakScenarios(ytAmount, selectedMarketData.daysToMaturity, initialInvestment);
                    }
                }
            }
        }

        // Convert canvas to blob
        canvas.toBlob(function(blob) {
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Reset button
            if (button) {
                button.disabled = false;
                button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> SAVE PNG';
            }
        }, 'image/png');

    } catch (error) {
        console.error('Error generating image:', error);
        alert('Failed to generate image. Please try again.');
        
        // Make sure to restore dark mode on error
        const wasDarkModeOnError = localStorage.getItem('darkMode') === 'enabled';
        if (wasDarkModeOnError && !document.body.classList.contains('dark-mode')) {
            document.body.classList.add('dark-mode');
            
            // Regenerate TVL table if needed
            if (elementId === 'tvlDownloadContainer' && marketData.tvlData && marketData.weightedTvl) {
                displayTvlBreakdown();
            }
            
            // Regenerate Almanak table if needed
            if (elementId === 'almanakDownloadContainer' && elements.resultsDiv.classList.contains('show')) {
                const netToTakerText = elements.resultElements.netToTaker.textContent;
                const ytAmount = parseFloat(netToTakerText.replace(/[^\d.-]/g, ''));
                
                if (ytAmount > 0) {
                    const selectedMarket = marketData.selectedMarket;
                    const selectedMarketData = marketData[selectedMarket];
                    
                    let initialInvestment = parseFloat(elements.amountInput.value);
                    if (!initialInvestment && elements.ytCostInput.value) {
                        initialInvestment = parseFloat(elements.ytCostInput.value);
                    }
                    
                    if (selectedMarketData.daysToMaturity > 0 && initialInvestment > 0) {
                        displayAlmanakScenarios(ytAmount, selectedMarketData.daysToMaturity, initialInvestment);
                    }
                }
            }
        }
        
        // Reset button on error
        const button = event.target.closest('.download-btn');
        if (button) {
            button.disabled = false;
            button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> SAVE PNG';
        }
    }
}

/**
 * Setup download button event listeners
 */
function setupDownloadButtons() {
    // Download Almanak table button (clean version)
    const downloadAlmanakBtn = document.getElementById('downloadAlmanakBtn');
    if (downloadAlmanakBtn) {
        downloadAlmanakBtn.addEventListener('click', function() {
            const timestamp = new Date().toISOString().split('T')[0];
            downloadTableAsPNG('almanakDownloadContainer', `pendle-almanak-roi-scenarios-${timestamp}.png`);
        });
    }

    // Download TVL table button (only points distribution, not TVL sources)
    const downloadTvlBtn = document.getElementById('downloadTvlBtn');
    if (downloadTvlBtn) {
        downloadTvlBtn.addEventListener('click', function() {
            const timestamp = new Date().toISOString().split('T')[0];
            downloadTableAsPNG('tvlDownloadContainer', `pendle-points-distribution-${timestamp}.png`);
        });
    }

    console.log('✅ Download buttons initialized');
}

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
            // Update October 23 market data (for backend calculations only)
            if (marketsData.oct23) {
                marketData.oct23.underlyingApy = marketsData.oct23.underlyingApy;
                marketData.oct23.impliedApy = marketsData.oct23.impliedApy;
                marketData.oct23.daysToMaturity = window.PendleAPI.getDaysToMaturity('oct23');
                console.log('✅ October 23 market data loaded (backend only)');
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
        elements.underlyingApyDec11.textContent = 'Error loading';
        elements.impliedApyDec11.textContent = 'Error loading';
    }
}

/**
 * Update countdown display for December 11 market
 */
function updateCountdown() {
    // Update October 23 data (for backend calculations, not displayed)
    const daysToMaturityOct23 = window.PendleAPI.getDaysToMaturity('oct23');
    marketData.oct23.daysToMaturity = daysToMaturityOct23;
    
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
 * Refresh market data for December 11 market
 */
async function refreshMarketData() {
    try {
        const marketsData = await window.PendleAPI.getAllMarketsData();
        
        if (marketsData.success) {
            // Update October 23 market data (for backend calculations only)
            if (marketsData.oct23) {
                marketData.oct23.underlyingApy = marketsData.oct23.underlyingApy;
                marketData.oct23.impliedApy = marketsData.oct23.impliedApy;
            }
            
            // Update December 11 market
            if (marketsData.dec11) {
                marketData.dec11.underlyingApy = marketsData.dec11.underlyingApy;
                marketData.dec11.impliedApy = marketsData.dec11.impliedApy;
                
                elements.underlyingApyDec11.textContent = `${(marketsData.dec11.underlyingApy * 100).toFixed(2)}%`;
                elements.impliedApyDec11.textContent = `${(marketsData.dec11.impliedApy * 100).toFixed(2)}%`;
            }
            
            marketData.lastUpdated = new Date();
            console.log('December 11 market data refreshed');
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
            
            // Update minimum funds table if it's currently visible
            if (elements.minFundsSection && elements.minFundsSection.style.display !== 'none') {
                displayMinimumFunds();
                console.log('✅ Minimum funds table updated in real-time');
            }
        } else {
            console.error('❌ Failed to fetch TVL data:', tvlResponse ? tvlResponse.error : 'No response');
            if (elements.tvlTableBody) {
                elements.tvlTableBody.innerHTML = '<tr><td colspan="6" class="loading-text" style="color: #dc2626;">Error loading TVL data. Check console for details.</td></tr>';
            }
            // Also update minimum funds table if visible
            if (elements.minFundsSection && elements.minFundsSection.style.display !== 'none' && elements.minFundsTableBody) {
                elements.minFundsTableBody.innerHTML = '<tr><td colspan="5" class="loading-text" style="color: #dc2626;">Error loading TVL data. Check console for details.</td></tr>';
            }
        }
    } catch (error) {
        console.error('❌ Error fetching TVL data:', error);
        console.error('Error stack:', error.stack);
        if (elements.tvlTableBody) {
            elements.tvlTableBody.innerHTML = '<tr><td colspan="6" class="loading-text" style="color: #dc2626;">Error: ' + error.message + '</td></tr>';
        }
        // Also update minimum funds table if visible
        if (elements.minFundsSection && elements.minFundsSection.style.display !== 'none' && elements.minFundsTableBody) {
            elements.minFundsTableBody.innerHTML = '<tr><td colspan="5" class="loading-text" style="color: #dc2626;">Error: ' + error.message + '</td></tr>';
        }
    }
}

/**
 * Get dark mode aware colors
 */
function getDarkModeColors() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    return {
        headerBg: isDarkMode ? '#1a1a1a' : '#000',
        headerText: isDarkMode ? '#ffffff' : '#fff',
        borderBlack: isDarkMode ? '#ffffff' : '#000',
        rowEven: isDarkMode ? '#2d2d2d' : '#f5f5f5',
        rowOdd: isDarkMode ? '#1a1a1a' : '#ffffff',
        lightBlue: isDarkMode ? '#1e3a5f' : '#e0f2fe',
        lightRed: isDarkMode ? '#5f1e1e' : '#fee2e2',
        lightGreen: isDarkMode ? '#1e5f3a' : '#dcfce7',
        lightYellow: isDarkMode ? '#5f4a1e' : '#fef3c7',
        lightGray: isDarkMode ? '#3d3d3d' : '#f8fafc',
        whiteRow: isDarkMode ? '#2d2d2d' : '#ffffff',
        grayText: isDarkMode ? '#a0a0a0' : '#6c757d',
        darkGrayBg: isDarkMode ? '#3d3d3d' : '#6b7280'
    };
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
    const colors = getDarkModeColors();
    
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
    
    // Overall TVL Sources HTML (separate from points distribution)
    const tvlSourcesHTML = `
        <!-- Overall TVL Sources Section -->
        <tr><td colspan="6" style="padding: 0; border: none; border-right: none;">
            <h4 style="font-size: 1.05rem; font-weight: 700; margin: 0 0 12px 0; padding: 12px 16px; background: ${colors.headerBg}; color: ${colors.headerText}; text-transform: uppercase; letter-spacing: 0.1em;">OVERALL TVL SOURCES</h4>
        </td></tr>
        <tr style="background-color: ${colors.lightGray};">
            <td colspan="2"><span class="tvl-type">alUSD Supply (${formatNumber(tvlData.alUsdSupply)} × $${liveAlUsdPrice.toFixed(6)})</span></td>
            <td colspan="4"><strong>${formatCurrency(tvlData.alUsdSupply * liveAlUsdPrice)}</strong></td>
        </tr>
        <tr style="background-color: ${colors.whiteRow};">
            <td colspan="2"><span class="tvl-type">alpUSD Supply (${formatNumber(tvlData.alpUsdSupply)} × $${liveAlpUsdPrice.toFixed(6)})</span></td>
            <td colspan="4"><strong>${formatCurrency(tvlData.alpUsdSupply * liveAlpUsdPrice)}</strong></td>
        </tr>
        <tr style="background-color: ${colors.lightBlue}; font-weight: 600;">
            <td colspan="2"><strong>GROSS TVL</strong></td>
            <td colspan="4"><strong>${formatCurrency(tvlData.grossTvl || tvlData.defiLlamaTvl)}</strong></td>
        </tr>
        <tr style="background-color: ${colors.lightRed};">
            <td colspan="2"><span class="tvl-type" style="color: #991b1b;">Minus: SY alUSD (${formatNumber(tvlData.syAlUsdBalance)} × $${liveAlUsdPrice.toFixed(6)})</span></td>
            <td colspan="4"><strong style="color: #991b1b;">-${formatCurrency(tvlData.syAlUsdBalance * liveAlUsdPrice)}</strong></td>
        </tr>
        <tr style="background-color: ${colors.lightBlue}; font-weight: 600; border-bottom: 3px solid #0284c7;">
            <td colspan="2"><strong>NET TVL (for points)</strong></td>
            <td colspan="4"><strong style="font-size: 1.1rem;">${formatCurrency(tvlData.totalTvl)}</strong></td>
        </tr>
    `;
    
    // Points Distribution HTML (this is what gets downloaded)
    const pointsDistributionHTML = `
        <!-- Points Distribution Section -->
        <tr><td colspan="6" style="padding: 0; border: none; border-right: none;">
            <h4 style="font-size: 1.05rem; font-weight: 700; margin: 24px 0 12px 0; padding: 12px 16px; background: ${colors.headerBg}; color: ${colors.headerText}; text-transform: uppercase; letter-spacing: 0.1em;">PENDLE MARKETS POINTS DISTRIBUTION</h4>
        </td></tr>
        <tr style="background: ${colors.headerBg}; color: ${colors.headerText};">
            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; border-right: 2px solid ${colors.headerText}; border-bottom: 3px solid ${colors.headerBg};">TVL Type</th>
            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; border-right: 2px solid ${colors.headerText}; border-bottom: 3px solid ${colors.headerBg};">TVL Amount</th>
            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; border-right: 2px solid ${colors.headerText}; border-bottom: 3px solid ${colors.headerBg};">Boost</th>
            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; border-right: 2px solid ${colors.headerText}; border-bottom: 3px solid ${colors.headerBg};">Weighted TVL</th>
            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; border-right: 2px solid ${colors.headerText}; border-bottom: 3px solid ${colors.headerBg};">Daily Points</th>
            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 3px solid ${colors.headerBg};">Share %</th>
        </tr>
        
        <!-- October 23 Market -->
        <tr style="background-color: ${weighted.oct23.isMatured ? colors.lightRed : colors.lightBlue}; border-top: 3px solid ${colors.borderBlack}; border-bottom: 2px solid ${colors.borderBlack};">
            <td colspan="6" style="padding: 10px 16px; border-right: none;">
                <strong style="font-size: 0.95rem; color: ${weighted.oct23.isMatured ? '#dc2626' : '#2563eb'}; text-transform: uppercase; letter-spacing: 0.05em;">
                    OCTOBER 23, 2025 MARKET ${weighted.oct23.isMatured ? '[MATURED]' : ''}
                </strong>
                ${weighted.oct23.isMatured ? '<div style="font-size: 0.8rem; color: #dc2626; margin-top: 4px; font-weight: 600;">WARNING: Market has matured. No points earned. Please migrate to active markets.</div>' : ''}
            </td>
        </tr>
        <tr style="background-color: ${colors.rowOdd}; ${weighted.oct23.isMatured ? 'opacity: 0.6;' : ''}">
            <td><span class="tvl-type">YT Oct 23</span><span class="tvl-boost ${weighted.oct23.isMatured ? '' : 'boost-5x'}" style="${weighted.oct23.isMatured ? `background-color: ${colors.lightRed}; color: #991b1b;` : ''}">${weighted.oct23.isMatured ? '0x (Matured)' : '5x Boost'}</span></td>
            <td>${formatCurrency(weighted.oct23.ytTvl)}${weighted.oct23.isMatured && weighted.oct23.lockedYtTvl > 0 ? ' <span style="font-size: 0.75em; color: #92400e;">(Locked: ' + formatCurrency(weighted.oct23.lockedYtTvl) + ')</span>' : ''}</td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}">${weighted.oct23.isMatured ? '0x' : '5x'}</td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}">${formatCurrency(weighted.oct23.weightedYt)}</td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}"><strong>${formatNumber(ytDailyPointsOct23)}</strong> ${!weighted.oct23.isMatured ? '<span style="font-size: 0.8em; color: #6c757d;">(gross)</span>' : ''}</td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}">${ytShareOct23.toFixed(2)}%</td>
        </tr>
        <tr style="background-color: ${colors.lightRed}; ${weighted.oct23.isMatured ? 'opacity: 0.6;' : ''}">
            <td style="padding-left: 20px;"><span class="tvl-type" style="color: #991b1b;">├─ Pendle Fee (5%)</span></td>
            <td style="color: #991b1b;">-</td>
            <td style="color: #991b1b;">-</td>
            <td style="color: #991b1b;">-</td>
            <td style="color: #991b1b;"><strong>-${formatNumber(ytDailyPointsOct23 * 0.05)}</strong></td>
            <td style="color: #991b1b;">-${((ytDailyPointsOct23 * 0.05 / (DAILY_POINTS + referralDailyPoints)) * 100).toFixed(2)}%</td>
        </tr>
        <tr style="background-color: ${colors.lightGreen}; ${weighted.oct23.isMatured ? 'opacity: 0.6;' : ''}">
            <td style="padding-left: 20px;"><span class="tvl-type" style="color: #166534;">└─ YT Oct 23 NET</span></td>
            <td style="color: #166534;">-</td>
            <td style="color: #166534;">-</td>
            <td style="color: #166534;">-</td>
            <td style="color: #166534;"><strong>${formatNumber(ytDailyPointsOct23 * 0.95)}</strong> <span style="font-size: 0.8em;">(net)</span></td>
            <td style="color: #166534;">${((ytDailyPointsOct23 * 0.95 / (DAILY_POINTS + referralDailyPoints)) * 100).toFixed(2)}%</td>
        </tr>
        <tr style="background-color: ${colors.whiteRow}; ${weighted.oct23.isMatured ? 'opacity: 0.6;' : ''}">
            <td><span class="tvl-type">LP Oct 23</span><span class="tvl-boost ${weighted.oct23.isMatured ? '' : (weighted.oct23.lpBoost === 1.5 ? 'boost-1-5x' : 'boost-1-25x')}" style="${weighted.oct23.isMatured ? `background-color: ${colors.lightRed}; color: #991b1b;` : ''}">${weighted.oct23.isMatured ? '0x (Matured)' : weighted.oct23.lpBoost + 'x Boost'}</span></td>
            <td>${formatCurrency(weighted.oct23.lpTvl)}${weighted.oct23.isMatured && weighted.oct23.lockedLpTvl > 0 ? ' <span style="font-size: 0.75em; color: #92400e;">(Locked)</span>' : ''}</td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}">${weighted.oct23.isMatured ? '0x' : weighted.oct23.lpBoost + 'x'}</td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}">${formatCurrency(weighted.oct23.weightedLp)}</td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}"><strong>${formatNumber(lpDailyPointsOct23)}</strong></td>
            <td style="${weighted.oct23.isMatured ? 'color: #991b1b;' : ''}">${lpShareOct23.toFixed(2)}%</td>
        </tr>
        <tr style="opacity: 0.6; background-color: ${colors.lightRed};">
            <td><span class="tvl-type">PT Oct 23</span><span class="tvl-boost" style="background-color: ${colors.lightRed}; color: #991b1b;">EXCLUDED</span></td>
            <td><strong>${formatCurrency(weighted.oct23.ptTvl || 0)}</strong></td>
            <td style="color: #991b1b;"><strong>0x</strong></td>
            <td style="color: #991b1b;"><strong>${formatCurrency(0)}</strong></td>
            <td style="color: #991b1b;"><strong>0</strong></td>
            <td style="color: #991b1b;"><strong>0%</strong></td>
        </tr>
        
        <!-- December 11 Market -->
        <tr style="background-color: ${weighted.dec11.isMatured ? colors.lightRed : colors.lightGreen}; border-top: 3px solid ${colors.borderBlack}; border-bottom: 2px solid ${colors.borderBlack};">
            <td colspan="6" style="padding: 10px 16px; border-right: none;">
                <strong style="font-size: 0.95rem; color: ${weighted.dec11.isMatured ? '#dc2626' : '#059669'}; text-transform: uppercase; letter-spacing: 0.05em;">
                    DECEMBER 11, 2025 MARKET ${weighted.dec11.isMatured ? '[MATURED]' : ''}
                </strong>
                ${weighted.dec11.isMatured ? '<div style="font-size: 0.8rem; color: #dc2626; margin-top: 4px; font-weight: 600;">WARNING: Market has matured. No points earned. Please migrate to active markets.</div>' : ''}
            </td>
        </tr>
        <tr style="background-color: ${colors.rowOdd}; ${weighted.dec11.isMatured ? 'opacity: 0.6;' : ''}">
            <td><span class="tvl-type">YT Dec 11</span><span class="tvl-boost ${weighted.dec11.isMatured ? '' : 'boost-5x'}" style="${weighted.dec11.isMatured ? `background-color: ${colors.lightRed}; color: #991b1b;` : ''}">${weighted.dec11.isMatured ? '0x (Matured)' : '5x Boost'}</span></td>
            <td>${formatCurrency(weighted.dec11.ytTvl)}${weighted.dec11.isMatured && weighted.dec11.lockedYtTvl > 0 ? ' <span style="font-size: 0.75em; color: #92400e;">(Locked: ' + formatCurrency(weighted.dec11.lockedYtTvl) + ')</span>' : ''}</td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}">${weighted.dec11.isMatured ? '0x' : '5x'}</td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}">${formatCurrency(weighted.dec11.weightedYt)}</td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}"><strong>${formatNumber(ytDailyPointsDec11)}</strong> ${!weighted.dec11.isMatured ? '<span style="font-size: 0.8em; color: #6c757d;">(gross)</span>' : ''}</td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}">${ytShareDec11.toFixed(2)}%</td>
        </tr>
        <tr style="background-color: ${colors.lightRed}; ${weighted.dec11.isMatured ? 'opacity: 0.6;' : ''}">
            <td style="padding-left: 20px;"><span class="tvl-type" style="color: #991b1b;">├─ Pendle Fee (5%)</span></td>
            <td style="color: #991b1b;">-</td>
            <td style="color: #991b1b;">-</td>
            <td style="color: #991b1b;">-</td>
            <td style="color: #991b1b;"><strong>-${formatNumber(ytDailyPointsDec11 * 0.05)}</strong></td>
            <td style="color: #991b1b;">-${((ytDailyPointsDec11 * 0.05 / (DAILY_POINTS + referralDailyPoints)) * 100).toFixed(2)}%</td>
        </tr>
        <tr style="background-color: ${colors.lightGreen}; ${weighted.dec11.isMatured ? 'opacity: 0.6;' : ''}">
            <td style="padding-left: 20px;"><span class="tvl-type" style="color: #166534;">└─ YT Dec 11 NET</span></td>
            <td style="color: #166534;">-</td>
            <td style="color: #166534;">-</td>
            <td style="color: #166534;">-</td>
            <td style="color: #166534;"><strong>${formatNumber(ytDailyPointsDec11 * 0.95)}</strong> <span style="font-size: 0.8em;">(net)</span></td>
            <td style="color: #166534;">${((ytDailyPointsDec11 * 0.95 / (DAILY_POINTS + referralDailyPoints)) * 100).toFixed(2)}%</td>
        </tr>
        <tr style="background-color: ${colors.lightBlue}; font-weight: 600; ${weighted.dec11.isMatured ? 'opacity: 0.6;' : ''}">
            <td><span class="tvl-type">LP Dec 11 (Total)</span></td>
            <td>${formatCurrency(weighted.dec11.lpTvl)}${weighted.dec11.isMatured && weighted.dec11.lockedLpTvl > 0 ? ' <span style="font-size: 0.75em; color: #92400e;">(Locked)</span>' : ''}</td>
            <td colspan="4" style="text-align: center; font-style: italic; color: ${colors.grayText};">Split into SY and PT portions below</td>
        </tr>
        <tr style="background-color: ${colors.whiteRow}; ${weighted.dec11.isMatured ? 'opacity: 0.6;' : ''}">
            <td style="padding-left: 20px;"><span class="tvl-type">├─ LP SY (alUSD)</span><span class="tvl-boost ${weighted.dec11.isMatured ? '' : 'boost-1-5x'}" style="${weighted.dec11.isMatured ? `background-color: ${colors.lightRed}; color: #991b1b;` : ''}">${weighted.dec11.isMatured ? '0x (Matured)' : '1.5x Boost'}</span></td>
            <td>${formatCurrency((weighted.dec11.lpSyTvl !== undefined && weighted.dec11.lpSyTvl !== null) ? weighted.dec11.lpSyTvl : 0)}</td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}">${weighted.dec11.isMatured ? '0x' : '1.5x'}</td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}">${formatCurrency(weighted.dec11.weightedLp || 0)}</td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}"><strong>${formatNumber(lpDailyPointsDec11)}</strong></td>
            <td style="${weighted.dec11.isMatured ? 'color: #991b1b;' : ''}">${lpShareDec11.toFixed(2)}%</td>
        </tr>
        <tr style="opacity: 0.6; background-color: ${colors.lightRed};">
            <td style="padding-left: 20px;"><span class="tvl-type">└─ LP PT (alUSD)</span><span class="tvl-boost" style="background-color: ${colors.lightRed}; color: #991b1b;">EXCLUDED</span></td>
            <td><strong>${formatCurrency((weighted.dec11.lpPtTvl !== undefined && weighted.dec11.lpPtTvl !== null) ? weighted.dec11.lpPtTvl : 0)}</strong></td>
            <td style="color: #991b1b;"><strong>0x</strong></td>
            <td style="color: #991b1b;"><strong>${formatCurrency(0)}</strong></td>
            <td style="color: #991b1b;"><strong>0</strong></td>
            <td style="color: #991b1b;"><strong>0%</strong></td>
        </tr>
        <tr style="opacity: 0.6; background-color: ${colors.lightRed};">
            <td><span class="tvl-type">PT Dec 11</span><span class="tvl-boost" style="background-color: ${colors.lightRed}; color: #991b1b;">EXCLUDED</span></td>
            <td><strong>${formatCurrency(weighted.dec11.ptTvl || 0)}</strong></td>
            <td style="color: #991b1b;"><strong>0x</strong></td>
            <td style="color: #991b1b;"><strong>${formatCurrency(0)}</strong></td>
            <td style="color: #991b1b;"><strong>0</strong></td>
            <td style="color: #991b1b;"><strong>0%</strong></td>
        </tr>
        
        <!-- Shared Categories -->
        <tr><td colspan="6" style="padding: 0; border: none; border-right: none;">
            <h4 style="font-size: 1.05rem; font-weight: 700; margin: 24px 0 12px 0; padding: 12px 16px; background: ${colors.darkGrayBg}; color: ${colors.headerText}; text-transform: uppercase; letter-spacing: 0.1em;">SHARED CATEGORIES</h4>
        </td></tr>
        <tr>
            <td><span class="tvl-type">Curve Pool</span><span class="tvl-boost" style="background-color: ${colors.lightYellow}; color: #92400e;">3x Boost</span></td>
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
        <tr style="opacity: 0.7; background-color: ${colors.lightRed};">
            <td><span class="tvl-type">PT (Principal)</span><span class="tvl-boost" style="background-color: ${colors.lightRed}; color: #991b1b;">EXCLUDED</span></td>
            <td><strong>${formatCurrency(tvlData.pendlePtTvl || 0)}</strong></td>
            <td style="color: #991b1b;"><strong>0x</strong></td>
            <td style="color: #991b1b;"><strong>${formatCurrency(0)}</strong></td>
            <td style="color: #991b1b;"><strong>0</strong></td>
            <td style="color: #991b1b;"><strong>0%</strong></td>
        </tr>
        <tr style="background-color: ${colors.lightYellow};">
            <td><span class="tvl-type">Referral Program</span><span class="tvl-boost" style="background-color: ${colors.lightYellow}; color: #92400e;">5% Reserve</span></td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td><strong>${formatNumber(referralDailyPoints)}</strong></td>
            <td>5%</td>
        </tr>
        <tr style="background-color: ${colors.lightYellow}; border-top: 1px solid #f59e0b;">
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
    
    // Combine both sections for the main table
    const fullTableHTML = tvlSourcesHTML + pointsDistributionHTML;
    elements.tvlTableBody.innerHTML = fullTableHTML;
    
    // Create a separate table for download (points distribution only)
    const downloadContainer = document.getElementById('tvlDownloadContainer');
    if (downloadContainer) {
        downloadContainer.innerHTML = `
            <div style="background: #fff; padding: 32px; border: 3px solid #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
                <h3 style="font-size: 1.4rem; font-weight: 700; margin: 0 0 24px 0; color: #000; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 3px solid #000; padding-bottom: 16px;">PENDLE MARKETS POINTS DISTRIBUTION</h3>
                <table style="width: 100%; border-collapse: collapse; background-color: #fff; border: 2px solid #000;">
                    <tbody>${pointsDistributionHTML}</tbody>
                </table>
            </div>
        `;
    }
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
        
        // Create a clean version for download (without emoji, cleaner styling)
        const downloadContainer = document.getElementById('almanakDownloadContainer');
        if (downloadContainer) {
            const cleanBreakevenRow = breakevenFdv && breakevenFdv > 0 ? `
                <tr style="background-color: #dbeafe; border: 3px solid #000;">
                    <td style="color: #1e40af; font-weight: 700; padding: 8px 10px; text-align: center; border: 1px solid #000;">${formatFdv(breakevenFdv)}</td>
                    <td style="color: #1e40af; font-weight: 700; padding: 8px 10px; text-align: center; border: 1px solid #000;">~0.00%</td>
                    <td style="color: #1e40af; font-weight: 600; padding: 8px 10px; text-align: center; border: 1px solid #000;">
                        $${initialInvestment.toFixed(2)}
                        <div style="font-size: 0.7em; color: #6c757d; font-weight: normal;">($${totalUnderlyingYield.toFixed(2)} yield)</div>
                    </td>
                    <td style="font-weight: 600; color: #1e40af; padding: 8px 10px; text-align: center; border: 1px solid #000;">${daysToMaturity} days</td>
                    <td style="color: #1e40af; font-weight: 700; padding: 8px 10px; text-align: center; border: 1px solid #000; text-transform: uppercase;">
                        BREAKEVEN FDV
                    </td>
                </tr>
            ` : '';
            
            const cleanTableRows = filteredScenarios.map(scenario => {
                const roiColor = scenario.isProfit ? '#10b981' : '#dc2626';
                let breakevenColor = '#6c757d';
                if (scenario.breakevenStatus === 'No breakeven') {
                    breakevenColor = '#dc2626';
                } else if (scenario.breakevenDays <= daysToMaturity) {
                    breakevenColor = '#10b981';
                } else {
                    breakevenColor = '#f59e0b';
                }
                
                const yieldFormatted = `$${scenario.underlyingYieldValue.toFixed(2)}`;
                const pendleFeeFormatted = `$${scenario.pendleFeeUsdValue.toFixed(2)}`;
                
                return `
                    <tr style="border: 1px solid #000;">
                        <td style="padding: 8px 10px; text-align: center; font-weight: 700; font-size: 0.95rem; color: #f59e0b; border: 1px solid #000;">${formatFdv(scenario.fdv)}</td>
                        <td style="padding: 8px 10px; text-align: center; font-weight: 700; font-size: 0.95rem; color: ${roiColor}; border: 1px solid #000;">${scenario.roiPercentage}%</td>
                        <td style="padding: 8px 10px; text-align: center; font-weight: 700; font-size: 0.95rem; border: 1px solid #000;">
                            ${scenario.earningsFormatted}
                            <div style="font-size: 0.7em; color: #6c757d; font-weight: normal; margin-top: 2px;">
                                ${yieldFormatted} yield<br>
                                <span style="color: #dc2626;">-${pendleFeeFormatted} Pendle fee (5%)</span>
                            </div>
                        </td>
                        <td style="padding: 8px 10px; text-align: center; font-weight: 600; border: 1px solid #000;">${daysToMaturity} days</td>
                        <td style="padding: 8px 10px; text-align: center; color: ${breakevenColor}; font-weight: 600; border: 1px solid #000;">${scenario.breakevenStatus}</td>
                    </tr>
                `;
            }).join('');
            
            // Insert breakeven row in the clean version
            let cleanFinalHTML = cleanTableRows;
            if (breakevenFdv && breakevenFdv > 0) {
                const rows = cleanTableRows.split('</tr>');
                let insertIndex = -1;
                
                for (let i = 0; i < filteredScenarios.length; i++) {
                    if (filteredScenarios[i].fdv >= breakevenFdv) {
                        insertIndex = i;
                        break;
                    }
                }
                
                if (insertIndex >= 0) {
                    const rowsArray = rows.slice(0, -1);
                    rowsArray.splice(insertIndex, 0, cleanBreakevenRow.trim());
                    cleanFinalHTML = rowsArray.join('</tr>') + '</tr>';
                } else {
                    cleanFinalHTML = cleanTableRows + cleanBreakevenRow;
                }
            }
            
            downloadContainer.innerHTML = `
                <div style="background: #fff; padding: 20px; border: 3px solid #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
                    <h3 style="font-size: 1.2rem; font-weight: 700; margin: 0 0 16px 0; color: #000; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 3px solid #000; padding-bottom: 10px;">ALMANAK POINTS ROI SCENARIOS</h3>
                    <table style="width: 100%; border-collapse: collapse; background-color: #fff; border: 2px solid #000;">
                        <thead>
                            <tr style="background: #000; color: white;">
                                <th style="padding: 10px 12px; text-align: center; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; border-right: 2px solid #fff; border-bottom: 3px solid #000;">FDV</th>
                                <th style="padding: 10px 12px; text-align: center; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; border-right: 2px solid #fff; border-bottom: 3px solid #000;">ROI</th>
                                <th style="padding: 10px 12px; text-align: center; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; border-right: 2px solid #fff; border-bottom: 3px solid #000;">Total Earnings</th>
                                <th style="padding: 10px 12px; text-align: center; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; border-right: 2px solid #fff; border-bottom: 3px solid #000;">Days to Maturity</th>
                                <th style="padding: 10px 12px; text-align: center; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 3px solid #000;">Breakeven</th>
                            </tr>
                        </thead>
                        <tbody>${cleanFinalHTML}</tbody>
                    </table>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error displaying Almanak scenarios:', error);
        elements.almanakTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Error loading scenarios</td></tr>';
    }
}

/**
 * Switch to new trade mode
 */
function switchToNewTrade() {
    elements.newTradeBtn.classList.add('toggle-active');
    elements.existingYtBtn.classList.remove('toggle-active');
    elements.minFundsBtn.classList.remove('toggle-active');
    
    elements.newTradeSection.style.display = 'block';
    elements.existingYtSection.style.display = 'none';
    elements.minFundsSection.style.display = 'none';
    
    hideResults();
    hideError();
}

/**
 * Switch to existing YT holder mode
 */
function switchToExistingYt() {
    elements.existingYtBtn.classList.add('toggle-active');
    elements.newTradeBtn.classList.remove('toggle-active');
    elements.minFundsBtn.classList.remove('toggle-active');
    
    elements.existingYtSection.style.display = 'block';
    elements.newTradeSection.style.display = 'none';
    elements.minFundsSection.style.display = 'none';
    
    hideResults();
    hideError();
}

/**
 * Switch to minimum funds mode
 */
function switchToMinFunds() {
    elements.minFundsBtn.classList.add('toggle-active');
    elements.newTradeBtn.classList.remove('toggle-active');
    elements.existingYtBtn.classList.remove('toggle-active');
    
    elements.minFundsSection.style.display = 'block';
    elements.newTradeSection.style.display = 'none';
    elements.existingYtSection.style.display = 'none';
    
    hideResults();
    hideError();
    
    // Calculate and display minimum funds when tab opens
    displayMinimumFunds();
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

/**
 * Dark mode toggle functionality
 */
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    
    // Apply saved preference or default to light mode
    if (savedDarkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
    
    // Toggle dark mode on button click
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        // Update icon visibility
        if (document.body.classList.contains('dark-mode')) {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
            localStorage.setItem('darkMode', 'enabled');
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
            localStorage.setItem('darkMode', 'disabled');
        }
        
        // Refresh TVL table to update colors
        if (marketData.tvlData && marketData.weightedTvl) {
            displayTvlBreakdown();
        }
        
        // Refresh minimum funds table if visible
        if (elements.minFundsSection && elements.minFundsSection.style.display !== 'none') {
            displayMinimumFunds();
        }
        
        // Refresh Almanak table if visible
        if (elements.resultsDiv.classList.contains('show')) {
            const resultsVisible = elements.resultsDiv.style.display !== 'none';
            if (resultsVisible) {
                // Get current YT amount from displayed results
                const netToTakerText = elements.resultElements.netToTaker.textContent;
                const ytAmount = parseFloat(netToTakerText.replace(/[^\d.-]/g, ''));
                
                if (ytAmount > 0) {
                    const selectedMarket = marketData.selectedMarket;
                    const selectedMarketData = marketData[selectedMarket];
                    
                    // Get initial investment
                    let initialInvestment = parseFloat(elements.amountInput.value);
                    if (!initialInvestment && elements.ytCostInput.value) {
                        initialInvestment = parseFloat(elements.ytCostInput.value);
                    }
                    
                    if (selectedMarketData.daysToMaturity > 0 && initialInvestment > 0) {
                        displayAlmanakScenarios(ytAmount, selectedMarketData.daysToMaturity, initialInvestment);
                    }
                }
            }
        }
    });
    
    console.log('✅ Dark mode initialized');
}

// Initialize dark mode when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeDarkMode);

/**
 * Display minimum funds required to earn 1 point daily in each pool
 */
function displayMinimumFunds() {
    if (!marketData.weightedTvl || !marketData.tvlData) {
        elements.minFundsTableBody.innerHTML = '<tr><td colspan="5" class="loading-text">Loading TVL data...</td></tr>';
        return;
    }
    
    const weighted = marketData.weightedTvl;
    const tvlData = marketData.tvlData;
    const DAILY_POINTS = 316666; // Daily points distributed (95% of 333,333)
    const colors = getDarkModeColors();
    
    // Get live prices
    const liveAlUsdPrice = tvlData.liveAlUsdPrice || window.PendleAPI.ALMANAK_POINTS_CONFIG.alUsdPrice;
    
    // For 1 point daily:
    // pointsShare = weightedAmount / totalWeightedTvl
    // 1 / DAILY_POINTS = weightedAmount / totalWeightedTvl
    // weightedAmount = totalWeightedTvl / DAILY_POINTS
    // actualAmount = weightedAmount / boost
    
    const totalWeighted = weighted.totalWeightedTvl;
    const weightedAmountFor1Point = totalWeighted / DAILY_POINTS;
    
    // Calculate for each pool
    const pools = [];
    
    // October 23 Market - YT
    const oct23YtBoost = weighted.oct23.ytBoost;
    const oct23YtMinFunds = oct23YtBoost > 0 ? weightedAmountFor1Point / oct23YtBoost : Infinity;
    const oct23YtMinFundsTokens = oct23YtMinFunds / liveAlUsdPrice;
    pools.push({
        name: 'YT-alUSD (Oct 23)',
        boost: oct23YtBoost + 'x',
        boostNum: oct23YtBoost,
        dailyPoolPoints: (weighted.oct23.weightedYt / totalWeighted) * DAILY_POINTS,
        minFunds: oct23YtMinFunds,
        minTokens: oct23YtMinFundsTokens,
        status: weighted.oct23.isMatured ? 'MATURED' : 'Active',
        isMatured: weighted.oct23.isMatured,
        market: 'oct23'
    });
    
    // October 23 Market - LP
    const oct23LpBoost = weighted.oct23.lpBoost;
    const oct23LpMinFunds = oct23LpBoost > 0 ? weightedAmountFor1Point / oct23LpBoost : Infinity;
    pools.push({
        name: 'LP-alUSD (Oct 23)',
        boost: oct23LpBoost + 'x',
        boostNum: oct23LpBoost,
        dailyPoolPoints: (weighted.oct23.weightedLp / totalWeighted) * DAILY_POINTS,
        minFunds: oct23LpMinFunds,
        minTokens: oct23LpMinFunds / liveAlUsdPrice,
        status: weighted.oct23.isMatured ? 'MATURED' : 'Active',
        isMatured: weighted.oct23.isMatured,
        market: 'oct23'
    });
    
    // December 11 Market - YT
    const dec11YtBoost = weighted.dec11.ytBoost;
    const dec11YtMinFunds = dec11YtBoost > 0 ? weightedAmountFor1Point / dec11YtBoost : Infinity;
    const dec11YtMinFundsTokens = dec11YtMinFunds / liveAlUsdPrice;
    pools.push({
        name: 'YT-alUSD (Dec 11)',
        boost: dec11YtBoost + 'x',
        boostNum: dec11YtBoost,
        dailyPoolPoints: (weighted.dec11.weightedYt / totalWeighted) * DAILY_POINTS,
        minFunds: dec11YtMinFunds,
        minTokens: dec11YtMinFundsTokens,
        status: weighted.dec11.isMatured ? 'MATURED' : 'Active',
        isMatured: weighted.dec11.isMatured,
        market: 'dec11'
    });
    
    // December 11 Market - LP (SY portion only)
    const dec11LpBoost = weighted.dec11.lpBoost;
    const dec11LpMinFunds = dec11LpBoost > 0 ? weightedAmountFor1Point / dec11LpBoost : Infinity;
    pools.push({
        name: 'LP-alUSD SY (Dec 11)',
        boost: dec11LpBoost + 'x',
        boostNum: dec11LpBoost,
        dailyPoolPoints: (weighted.dec11.weightedLp / totalWeighted) * DAILY_POINTS,
        minFunds: dec11LpMinFunds,
        minTokens: dec11LpMinFunds / liveAlUsdPrice,
        status: weighted.dec11.isMatured ? 'MATURED' : 'Active',
        isMatured: weighted.dec11.isMatured,
        market: 'dec11'
    });
    
    // Curve Pool
    const curveBoost = window.PendleAPI.ALMANAK_POINTS_CONFIG.boosts.curve;
    const curveMinFunds = weightedAmountFor1Point / curveBoost;
    pools.push({
        name: 'Curve Pool',
        boost: curveBoost + 'x',
        boostNum: curveBoost,
        dailyPoolPoints: (weighted.weightedCurve / totalWeighted) * DAILY_POINTS,
        minFunds: curveMinFunds,
        minTokens: curveMinFunds / liveAlUsdPrice,
        status: 'Active',
        isMatured: false,
        market: 'shared'
    });
    
    // Other TVL (renamed to alUSD/alpUSD in wallet)
    const otherBoost = window.PendleAPI.ALMANAK_POINTS_CONFIG.boosts.other;
    const otherMinFunds = weightedAmountFor1Point / otherBoost;
    pools.push({
        name: 'alUSD/alpUSD in wallet',
        boost: otherBoost + 'x',
        boostNum: otherBoost,
        dailyPoolPoints: (weighted.weightedOther / totalWeighted) * DAILY_POINTS,
        minFunds: otherMinFunds,
        minTokens: otherMinFunds / liveAlUsdPrice,
        status: 'Active',
        isMatured: false,
        market: 'shared',
        tokenType: 'alUSD'
    });
    
    // Filter out matured pools
    const activePools = pools.filter(pool => !pool.isMatured);
    
    // Generate HTML rows (only for active pools)
    const tableRows = activePools.map(pool => {
        const statusColor = '#10b981'; // All active pools are green
        
        // Determine display format based on pool type
        let minTokensDisplay;
        if (pool.minFunds === Infinity) {
            minTokensDisplay = 'N/A (0 points)';
        } else if (pool.name.includes('YT')) {
            // For YT pools, show YT amount only
            minTokensDisplay = `${formatNumber(pool.minTokens)} YT`;
        } else {
            // For LP, Curve, and wallet, show $ value with alUSD amount below
            minTokensDisplay = `$${formatCurrency(pool.minFunds).replace('$', '')}<br><span style="font-size: 0.85em; color: ${colors.grayText};">(${formatNumber(pool.minTokens)} alUSD)</span>`;
        }
        
        const netPoints = pool.boostNum === 5 ? pool.dailyPoolPoints * 0.95 : pool.dailyPoolPoints;
        const pendleFee = pool.boostNum === 5 ? pool.dailyPoolPoints * 0.05 : 0;
        
        let dailyPointsDisplay = formatNumber(pool.dailyPoolPoints);
        if (pool.boostNum === 5) {
            dailyPointsDisplay = `
                <div>${formatNumber(netPoints)} (net)</div>
                <div style="font-size: 0.75em; color: #6c757d; margin-top: 2px;">
                    ${formatNumber(pool.dailyPoolPoints)} gross<br>
                    <span style="color: #dc2626;">-${formatNumber(pendleFee)} fee (5%)</span>
                </div>
            `;
        }
        
        return `
            <tr>
                <td style="text-align: left;"><strong>${pool.name}</strong></td>
                <td style="text-align: center;">${pool.boost}</td>
                <td style="text-align: center;">${dailyPointsDisplay}</td>
                <td style="text-align: center;">${minTokensDisplay}</td>
                <td style="text-align: center; color: ${statusColor}; font-weight: 600;">${pool.status}</td>
            </tr>
        `;
    }).join('');
    
    // Add summary row
    const summaryRow = `
        <tr style="background-color: ${colors.lightBlue}; border-top: 3px solid ${colors.borderBlack};">
            <td colspan="5" style="padding: 12px 16px; text-align: center;">
                <strong>Total Daily Points:</strong> ${formatNumber(DAILY_POINTS)} 
                <span style="font-size: 0.85em; color: ${colors.grayText}; margin-left: 8px;">(95% of 333,333 - 5% reserved for referrals)</span>
            </td>
        </tr>
    `;
    
    elements.minFundsTableBody.innerHTML = tableRows + summaryRow;
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
    displayMinimumFunds,
    switchToNewTrade,
    switchToExistingYt,
    switchToMinFunds,
    downloadTableAsPNG
};
