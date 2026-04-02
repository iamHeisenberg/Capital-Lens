const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const { calculateDMA } = require('../utils/dmaUtils');
const { determineTrend } = require('../utils/trendUtils');
const { getCache, setCache, cacheKeys } = require('./cacheService');
const logger = require('../utils/logger');

/**
 * Fetches stock data for a given ticker (NSE Indian stocks only).
 * Returns structured JSON with price, DMA, and trend data.
 *
 * @param {string} ticker
 * @param {object} [options]
 * @param {boolean} [options.forceRefresh] - Skip cache read when true (?refresh=true)
 * @param {object}  [options.ctx]          - Request context for structured logging
 */
const getStockData = async (ticker, { forceRefresh = false, ctx = {} } = {}) => {
    const nseTicker = ticker.toUpperCase().endsWith('.NS')
        ? ticker.toUpperCase()
        : ticker.toUpperCase() + '.NS';

    const cacheKey = cacheKeys.price(nseTicker);

    // ── Cache read (skipped when forceRefresh=true) ────────────────────────────
    if (!forceRefresh) {
        const cachedData = await getCache(cacheKey, ctx);
        if (cachedData) {
            return cachedData;
        }
    } else {
        logger.info('Cache read skipped — forceRefresh active', {
            ...ctx,
            event: 'CACHE_SKIP_READ',
            key: cacheKey,
        });
    }

    // ── Fetch from Yahoo Finance ───────────────────────────────────────────────
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    const result = await yahooFinance.historical(nseTicker, {
        period1: startDate,
        period2: endDate,
        interval: '1d',
    });

    if (!result || result.length === 0) {
        const error = new Error('No data found for ticker: ' + nseTicker);
        error.statusCode = 404;
        throw error;
    }

    // Fetch quote for currency info
    const quote = await yahooFinance.quote(nseTicker);
    const currency = quote.currency || 'INR';

    if (currency !== 'INR') {
        const error = new Error('Only INR stocks supported');
        error.statusCode = 400;
        throw error;
    }

    const historicalCloses = result.slice(-200).map((day) => day.close);
    const latestData = result[result.length - 1];
    const latestClose = latestData.close;

    const dma50 = calculateDMA(historicalCloses, 50);
    const dma200 = calculateDMA(historicalCloses, 200);

    const trend = (dma50 !== null && dma200 !== null)
        ? determineTrend(latestClose, dma50, dma200)
        : 'Insufficient Data';

    const responseData = {
        ticker: nseTicker,
        latestClose,
        currency,
        lastUpdated: new Date().toISOString(),
        historicalCloses,
        dma50,
        dma200,
        trend,
    };

    // ── Cache validation guard ─────────────────────────────────────────────────
    // Do not cache if core fields are missing/invalid or response contains an error.
    const isValidForCache =
        responseData &&
        !responseData.error &&
        typeof responseData.latestClose === 'number' &&
        isFinite(responseData.latestClose) &&
        Array.isArray(responseData.historicalCloses) &&
        responseData.historicalCloses.length > 0;

    if (isValidForCache) {
        await setCache(cacheKey, responseData, 3600, ctx);
    } else {
        logger.warn('SKIP_CACHE_INVALID_DATA — price data failed validation', {
            ...ctx,
            event: 'SKIP_CACHE_INVALID_DATA',
            ticker: nseTicker,
            reason: 'latestClose is null/NaN or historicalCloses is empty',
        });
    }

    return responseData;
};

module.exports = { getStockData };
