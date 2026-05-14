'use strict';

/**
 * sectorService.js
 *
 * Fetches and caches historical data for NSE sector indices and benchmark indices.
 * Mirrors the pattern of priceService.js with the following differences:
 *
 *   1. No .NS suffix appending — sector symbols (^NSEI, NIFTYMIDCAP150.NS) are used as-is.
 *   2. No currency validation — all NSE indices are INR by definition.
 *   3. No OBV/RSI in Phase 1 — can be added later from indicators.js.
 *   4. Pre-computed multi-period returns (r1m, r3m, r6m, r1y, r2y) baked into the response.
 *   5. Cache namespace: sector:<SYMBOL>  (no version prefix — additive namespace,
 *      won't be invalidated when stock cache version is bumped).
 *   6. toSummary() strips heavy arrays — used by /api/markets to keep the list response lean.
 *
 * Cache TTL: 4 hours (14400 seconds) — same as priceService.
 */

const yahooFinance    = require('../utils/yahooFinanceClient');
const { determineTrend } = require('../utils/trendUtils');
const { getCache, setCache, cacheKeys } = require('./cacheService');
const logger          = require('../utils/logger');
const { withRetry, withTimeout } = require('../utils/withRetry');
const { computeRollingMA } = require('../utils/indicators');

// ── Period windows ─────────────────────────────────────────────────────────────
// Approximate trading day counts for each return window.
const PERIOD_DAYS = {
    r1m:  21,   // ~1 month
    r3m:  63,   // ~3 months
    r6m:  126,  // ~6 months
    r1y:  252,  // ~1 year
    r2y:  494,  // ~2 years
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Compute % return over the last `tradingDays` bars.
 * Returns null if insufficient history or prices are zero/invalid.
 *
 * With a 2.5-year fetch window (~630 bars), the strict guard of
 * `tradingDays + 1` is comfortably satisfied for all periods up to r2y (495).
 *
 * @param {number[]} closes
 * @param {number}   tradingDays
 * @returns {number|null}  Rounded to 2 dp, e.g. 14.23
 */
function computeReturn(closes, tradingDays) {
    if (!Array.isArray(closes) || closes.length < tradingDays + 1) return null;
    const latest = closes[closes.length - 1];
    const past   = closes[closes.length - 1 - tradingDays];
    if (
        latest == null || past == null ||
        !isFinite(latest) || !isFinite(past) ||
        past === 0
    ) return null;
    return +(((latest - past) / past) * 100).toFixed(2);
}

// ── Service ────────────────────────────────────────────────────────────────────

/**
 * Fetch and cache full historical data for a single sector/index symbol.
 *
 * @param {string} symbol        Yahoo Finance symbol, e.g. '^NSEI', 'NIFTYMIDCAP150.NS'
 * @param {object} [options]
 * @param {boolean}  [options.forceRefresh]  Skip cache read and force a fresh fetch.
 * @param {object}   [options.ctx]           Logging context (correlationId etc.)
 * @param {object}   [options.meta]          Static metadata from sectors.json
 *                                           { name, group, shortName, hasVolume }
 * @returns {Promise<object>}  Full sector data object (see responseData shape below).
 */
const getSectorData = async (symbol, { forceRefresh = false, ctx = {}, meta = {} } = {}) => {
    const cacheKey = cacheKeys.sector(symbol);

    // ── Cache read ──────────────────────────────────────────────────────────────
    if (!forceRefresh) {
        const cached = await getCache(cacheKey, ctx);
        if (cached) return cached;
    } else {
        logger.info('Cache read skipped — forceRefresh active', {
            ...ctx, event: 'CACHE_SKIP_READ', key: cacheKey,
        });
    }

    // ── Fetch 2.5 years of history (~630 trading days) ────────────────────────
    const endDate   = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 30); // 2.5 years (JS handles month wrap correctly)

    let result;
    try {
        result = await withRetry(
            () => withTimeout(
                () => yahooFinance.historical(symbol, {
                    period1:  startDate,
                    period2:  endDate,
                    interval: '1d',
                }),
                15000,
                symbol
            ),
            { label: symbol }
        );
    } catch (err) {
        // Re-throw with a status code for the route layer to handle
        const fetchError = new Error(`Yahoo Finance fetch failed for ${symbol}: ${err.message}`);
        fetchError.statusCode = 502;
        throw fetchError;
    }

    if (!result || result.length === 0) {
        const error = new Error(`No data found for symbol: ${symbol}`);
        error.statusCode = 404;
        throw error;
    }

    // Filter out rows with null/invalid close (holidays, data gaps)
    const validResult = result.filter(
        (d) => d.close != null && typeof d.close === 'number' && isFinite(d.close)
    );

    if (!validResult.length) {
        const error = new Error(`No valid price data for symbol: ${symbol}`);
        error.statusCode = 404;
        throw error;
    }

    // ── Extract closes, dates, volumes ─────────────────────────────────────────
    const allCloses = validResult.map((d) => d.close);

    const allDates = validResult.map((d) => {
        const dt = d.date instanceof Date ? d.date : new Date(d.date);
        return dt.toISOString().split('T')[0]; // YYYY-MM-DD
    });

    // Volume: optional — many sector indices don't have meaningful volume.
    // Use meta.hasVolume as a hint; always verify with actual data.
    const allVolumes = validResult.map((d) =>
        (d.volume != null && isFinite(d.volume) && d.volume > 0) ? d.volume : null
    );
    const hasVolume = allVolumes.some((v) => v !== null);

    // ── DMA computation ─────────────────────────────────────────────────────────
    const allDma50Series  = computeRollingMA(allCloses, 50);
    const allDma200Series = computeRollingMA(allCloses, 200);

    const latestClose = allCloses[allCloses.length - 1];
    const dma50       = allDma50Series[allDma50Series.length - 1];   // null if < 50 days
    const dma200      = allDma200Series[allDma200Series.length - 1]; // null if < 200 days

    // ── Trend detection — identical logic to priceService ──────────────────────
    let trend;
    if (dma50 == null || dma200 == null) {
        trend = 'Insufficient Data';
    } else {
        const spreadPct = Math.abs(dma50 - dma200) / dma200;
        if (spreadPct < 0.02) {
            trend = 'Sideways'; // DMAs within 2% — treat as sideways
        } else {
            trend = determineTrend(latestClose, dma50, dma200);
        }
    }

    // ── Pre-computed multi-period returns ───────────────────────────────────────
    // Computed server-side so /api/markets can return them directly without
    // the frontend recalculating from the full historical arrays.
    const returns = {};
    for (const [key, days] of Object.entries(PERIOD_DAYS)) {
        returns[key] = computeReturn(allCloses, days);
    }

    // ── Assemble response ───────────────────────────────────────────────────────
    const responseData = {
        // Identity
        symbol,
        name:      meta.name      || symbol,
        group:     meta.group     || 'sector',
        shortName: meta.shortName || symbol,

        // Scalars
        latestClose,
        dma50,
        dma200,
        trend,
        hasVolume,
        lastUpdated: new Date().toISOString(),
        totalDays:   allCloses.length,

        // Pre-computed returns
        returns,

        // Full arrays (for chart rendering — only sent by /api/markets/:symbol)
        historicalCloses:  allCloses,
        historicalDates:   allDates,
        historicalVolumes: hasVolume ? allVolumes : null, // null = no volume data
        dma50Series:       allDma50Series,
        dma200Series:      allDma200Series,
    };

    // ── Cache validation guard ──────────────────────────────────────────────────
    const isValidForCache =
        typeof responseData.latestClose === 'number' &&
        isFinite(responseData.latestClose) &&
        Array.isArray(responseData.historicalCloses) &&
        responseData.historicalCloses.length > 0;

    if (isValidForCache) {
        await setCache(cacheKey, responseData, 14400, ctx); // 4h TTL
    } else {
        logger.warn('SKIP_CACHE_INVALID_DATA — sector data failed validation', {
            ...ctx,
            event:  'SKIP_CACHE_INVALID_DATA',
            symbol,
            reason: 'latestClose null/NaN or historicalCloses empty',
        });
    }

    return responseData;
};

// ── Summary strip ──────────────────────────────────────────────────────────────

/**
 * Strip a full sector data object down to lightweight summary fields.
 *
 * Used by GET /api/markets to return all sectors in one response without
 * transmitting 15 × ~630-point arrays over the wire. Full arrays only travel
 * when the user clicks a sector to see its chart (GET /api/markets/:symbol).
 *
 * @param {object} data  Full sector data object from getSectorData()
 * @returns {object}     Lightweight summary
 */
const toSummary = (data) => ({
    symbol:      data.symbol,
    name:        data.name,
    group:       data.group,
    shortName:   data.shortName,
    latestClose: data.latestClose,
    trend:       data.trend,
    dma50:       data.dma50,
    dma200:      data.dma200,
    hasVolume:   data.hasVolume,
    returns:     data.returns,
    totalDays:   data.totalDays,
    lastUpdated: data.lastUpdated,
});

module.exports = { getSectorData, toSummary };
