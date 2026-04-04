const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const { calculateDMA } = require('../utils/dmaUtils');
const { determineTrend } = require('../utils/trendUtils');
const { getCache, setCache, cacheKeys } = require('./cacheService');
const logger = require('../utils/logger');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * O(N) sliding-window rolling average.
 * Returns null for i < period-1 (insufficient history).
 */
function computeRollingMA(prices, period) {
    const result = new Array(prices.length).fill(null);
    let sum = 0;
    for (let i = 0; i < prices.length; i++) {
        sum += prices[i];
        if (i >= period) sum -= prices[i - period];
        if (i >= period - 1) result[i] = sum / period;
    }
    return result;
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * Fetches stock data for a given NSE ticker.
 *
 * Strategy:
 *   1. Fetch ~400 trading days (~2 years) of history
 *   2. Compute rolling DMA50 + DMA200 on the FULL dataset
 *   3. Return last 200 data points for display,
 *      but DMA lines are accurate because they were computed on 2 years
 *
 * Response:
 *   historicalCloses  — last 200 close prices      (backward-compat)
 *   historicalDates   — last 200 date strings       (NEW, for X-axis)
 *   dma50Series       — last 200 DMA50 values       (NEW, for chart)
 *   dma200Series      — last 200 DMA200 values      (NEW, for chart)
 *   dma50             — latest single DMA50 value   (backward-compat, for PriceCard)
 *   dma200            — latest single DMA200 value  (backward-compat, for PriceCard)
 *
 * @param {string} ticker
 * @param {object} [options]
 * @param {boolean} [options.forceRefresh]
 * @param {object}  [options.ctx]
 */
const getStockData = async (ticker, { forceRefresh = false, ctx = {} } = {}) => {
    const nseTicker = ticker.toUpperCase().endsWith('.NS')
        ? ticker.toUpperCase()
        : ticker.toUpperCase() + '.NS';

    const cacheKey = cacheKeys.price(nseTicker);

    // ── Cache read ─────────────────────────────────────────────────────────────
    if (!forceRefresh) {
        const cachedData = await getCache(cacheKey, ctx);
        if (cachedData) return cachedData;
    } else {
        logger.info('Cache read skipped — forceRefresh active', {
            ...ctx, event: 'CACHE_SKIP_READ', key: cacheKey,
        });
    }

    // ── Fetch 2 years of history (~400 trading days) ───────────────────────────
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2); // 2 years

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

    // Filter out days with null/invalid close (holidays, data gaps)
    const validResult = result.filter(
        (d) => d.close != null && typeof d.close === 'number' && isFinite(d.close)
    );

    if (!validResult.length) {
        const error = new Error('No valid price data for ticker: ' + nseTicker);
        error.statusCode = 404;
        throw error;
    }

    // Fetch quote for currency check
    const quote = await yahooFinance.quote(nseTicker);
    const currency = quote?.currency || 'INR';

    if (currency !== 'INR') {
        const error = new Error('Only INR stocks supported');
        error.statusCode = 400;
        throw error;
    }

    // ── Compute DMA on full dataset ────────────────────────────────────────────
    const allCloses = validResult.map((d) => d.close);
    const allDates  = validResult.map((d) => {
        const dt = d.date instanceof Date ? d.date : new Date(d.date);
        return dt.toISOString().split('T')[0]; // YYYY-MM-DD
    });

    const allDma50Series  = computeRollingMA(allCloses, 50);
    const allDma200Series = computeRollingMA(allCloses, 200);

    // Return ALL fetched data — the frontend period selector handles slicing.
    // 1Y shows last 200 pts, 2Y shows all ~400 pts. No backend cap needed.
    const historicalCloses = allCloses;
    const historicalDates  = allDates;
    const dma50Series      = allDma50Series;
    const dma200Series     = allDma200Series;

    // Single values for PriceCard / TrendCard (backward-compat)
    const latestClose = historicalCloses[historicalCloses.length - 1];
    const dma50       = allDma50Series[allDma50Series.length - 1];   // null if < 50 days
    const dma200      = allDma200Series[allDma200Series.length - 1]; // null if < 200 days

    // Detect trend — Sideways when DMAs are within 2% of each other
    let trend;
    if (dma50 == null || dma200 == null) {
        trend = 'Insufficient Data';
    } else {
        const spreadPct = Math.abs(dma50 - dma200) / dma200;
        if (spreadPct < 0.02) {
            trend = 'Sideways';
        } else {
            trend = determineTrend(latestClose, dma50, dma200);
        }
    }

    const responseData = {
        ticker: nseTicker,
        latestClose,
        currency,
        lastUpdated: new Date().toISOString(),
        // Display arrays (200 points each, always aligned)
        historicalCloses,
        historicalDates,
        dma50Series,
        dma200Series,
        // Single values (backward-compat)
        dma50,
        dma200,
        trend,
        // Metadata
        totalDays: allCloses.length,
    };

    // ── Cache validation guard ─────────────────────────────────────────────────
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
            reason: 'latestClose null/NaN or historicalCloses empty',
        });
    }

    return responseData;
};

module.exports = { getStockData };
