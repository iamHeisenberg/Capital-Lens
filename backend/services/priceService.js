const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const { calculateDMA } = require('../utils/dmaUtils');
const { determineTrend } = require('../utils/trendUtils');

/**
 * Fetches stock data for a given ticker (NSE Indian stocks only).
 * Returns structured JSON with price, DMA, and trend data.
 */
const getStockData = async (ticker) => {
    // Ensure ticker is in NSE format (TICKER.NS)
    const nseTicker = ticker.toUpperCase().endsWith('.NS')
        ? ticker.toUpperCase()
        : ticker.toUpperCase() + '.NS';

    // Calculate date range (1 year ago to today)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    // Fetch historical data from Yahoo Finance
    const result = await yahooFinance.historical(nseTicker, {
        period1: startDate,
        period2: endDate,
        interval: '1d'
    });

    if (!result || result.length === 0) {
        const error = new Error('No data found for ticker: ' + nseTicker);
        error.statusCode = 404;
        throw error;
    }

    // Fetch quote for currency info
    const quote = await yahooFinance.quote(nseTicker);
    const currency = quote.currency || 'INR';

    // Only support INR stocks
    if (currency !== 'INR') {
        const error = new Error('Only INR stocks supported');
        error.statusCode = 400;
        throw error;
    }

    // Get the last 200 daily closing prices (most recent last)
    const historicalCloses = result
        .slice(-200)
        .map((day) => day.close);

    // Get latest closing price
    const latestData = result[result.length - 1];
    const latestClose = latestData.close;

    // Calculate DMAs
    const dma50 = calculateDMA(historicalCloses, 50);
    const dma200 = calculateDMA(historicalCloses, 200);

    // Determine trend
    const trend = (dma50 !== null && dma200 !== null)
        ? determineTrend(latestClose, dma50, dma200)
        : 'Insufficient Data';

    return {
        ticker: nseTicker,
        latestClose,
        currency,
        lastUpdated: new Date().toISOString(),
        historicalCloses,
        dma50,
        dma200,
        trend
    };
};

module.exports = { getStockData };
