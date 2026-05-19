'use strict';

/**
 * marketsRoutes.js
 *
 * Three endpoints:
 *
 *   GET /api/markets
 *     Returns lightweight summary for ALL sectors and indices (no historical arrays).
 *     Response: { benchmarks: [...summaries], sectors: [...summaries] }
 *
 *   GET /api/markets/:symbol
 *     Returns full data (historicalCloses, dma series etc.) for ONE symbol.
 *     Symbol must be URL-encoded: encodeURIComponent('^NSEI') = '%5ENSEI'.
 *
 *   GET /api/markets/:symbol/stocks
 *     Returns constituent stock returns for a sector index.
 *     Only available for sectors (group='sector') — benchmarks return 404.
 *     Reads stock price cache in parallel, computes 1M/3M/6M/1Y/2Y returns.
 *     Response: { sectorSymbol, sectorName, sectorReturns, stocks[], totalStocks, availableStocks }
 *
 * All endpoints support ?refresh=true to bypass the cache.
 */

const express = require('express');
const router  = express.Router();
const logger  = require('../utils/logger');
const { getSectorData, toSummary } = require('../services/sectorService');
const { getCache, cacheKeys }      = require('../services/cacheService');

// ── Sector catalog (allowlist + metadata source) ───────────────────────────────
const SECTORS = require('../../frontend/src/data/sectors.json');

// ── Constituent stock mapping (sector → stock list) ────────────────────────────
const CONSTITUENTS = require('../../frontend/src/data/sectorConstituents.json');

// Index by upper-cased symbol for O(1) lookup
const SECTOR_MAP = new Map(
    SECTORS.map((s) => [s.symbol.toUpperCase(), s])
);

// ── GET /api/markets ───────────────────────────────────────────────────────────
/**
 * Returns summary data for all 15 sector/index symbols in parallel.
 * Uses Promise.allSettled so a single Yahoo Finance failure does NOT
 * prevent the other 14 sectors from being returned.
 */
router.get('/markets', async (req, res) => {
    const forceRefresh = req.query.refresh === 'true';

    const ctx = {
        correlationId: req.correlationId,
        endpoint:      req.originalUrl,
        method:        req.method,
    };

    if (forceRefresh) {
        logger.info('Cache bypass requested — /markets', { ...ctx, event: 'CACHE_BYPASS_FORCE_REFRESH' });
    }

    // Fetch all sectors in parallel — settled means partial failure is OK
    const results = await Promise.allSettled(
        SECTORS.map((entry) =>
            getSectorData(entry.symbol, { forceRefresh, ctx, meta: entry })
        )
    );

    // Partition into summaries vs failed
    const summaries = [];
    const failed    = [];

    results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
            summaries.push(toSummary(result.value));
        } else {
            const sym = SECTORS[i].symbol;
            failed.push(sym);
            logger.error('Sector fetch failed — excluded from /api/markets response', {
                ...ctx,
                symbol: sym,
                error:  result.reason?.message,
            });
        }
    });

    if (failed.length > 0) {
        logger.warn(`/api/markets: ${failed.length} sector(s) failed`, {
            ...ctx,
            failed,
        });
    }

    // Split into groups — order within each group preserved from sectors.json
    const benchmarks = summaries.filter((s) => s.group === 'benchmark');
    const sectors    = summaries.filter((s) => s.group === 'sector');

    res.json({ benchmarks, sectors, failedSymbols: failed.length > 0 ? failed : undefined });
});

// ── GET /api/markets/:symbol ───────────────────────────────────────────────────
/**
 * Returns FULL data (with historical arrays) for a single sector.
 * Symbol must be URL-encoded in the request:
 *   ^NSEI        → /api/markets/%5ENSEI
 *   NIFTYMIDCAP150.NS → /api/markets/NIFTYMIDCAP150.NS
 *
 * Validates against the sectors.json allowlist to prevent
 * the endpoint being used to look up arbitrary Yahoo Finance symbols.
 */
router.get('/markets/:symbol', async (req, res) => {
    // Express auto-decodes %5E → ^ in req.params
    const rawSymbol    = req.params.symbol;
    const upperSymbol  = rawSymbol.toUpperCase();
    const forceRefresh = req.query.refresh === 'true';

    const ctx = {
        correlationId: req.correlationId,
        endpoint:      req.originalUrl,
        method:        req.method,
        symbol:        upperSymbol,
    };

    // ── Allowlist validation ────────────────────────────────────────────────────
    const meta = SECTOR_MAP.get(upperSymbol);
    if (!meta) {
        logger.warn('Unknown sector symbol requested', { ...ctx, event: 'INVALID_SECTOR_SYMBOL' });
        return res.status(404).json({
            error: `Symbol '${rawSymbol}' is not in the supported sector catalog.`,
        });
    }

    if (forceRefresh) {
        logger.info('Cache bypass requested', { ...ctx, event: 'CACHE_BYPASS_FORCE_REFRESH' });
    }

    try {
        // Full data — includes historicalCloses, dma50Series, dma200Series etc.
        const data = await getSectorData(meta.symbol, { forceRefresh, ctx, meta });
        res.json(data);
    } catch (err) {
        const status = err.statusCode || 500;
        logger.error('Request handler error — /markets/:symbol', {
            ...ctx,
            errorMessage: err.message,
            statusCode:   status,
            stack:        err.stack,
        });
        res.status(status).json({ error: err.message });
    }
});

// ── GET /api/markets/:symbol/stocks ───────────────────────────────────────────
/**
 * Returns constituent stock returns for a single sector index.
 * Only available for group='sector' entries — benchmarks have no constituent map.
 *
 * Strategy:
 *   1. Validate symbol is a known sector (not benchmark)
 *   2. Look up constituent list from sectorConstituents.json
 *   3. Parallel-read all stock price caches (Promise.allSettled — partial OK)
 *   4. Compute 1M/3M/6M/1Y/2Y returns from historicalCloses server-side
 *   5. Return sorted by 1Y return desc (frontend re-sorts by selectedPeriod)
 */
router.get('/markets/:symbol/stocks', async (req, res) => {
    const rawSymbol   = req.params.symbol;
    const upperSymbol = rawSymbol.toUpperCase();

    const ctx = {
        correlationId: req.correlationId,
        endpoint:      req.originalUrl,
        method:        req.method,
        symbol:        upperSymbol,
    };

    // ── Allowlist validation ────────────────────────────────────────────────────
    const meta = SECTOR_MAP.get(upperSymbol);
    if (!meta) {
        return res.status(404).json({
            error: `Symbol '${rawSymbol}' is not in the supported sector catalog.`,
        });
    }

    // ── Benchmarks have no constituent map ─────────────────────────────────────
    if (meta.group === 'benchmark') {
        return res.status(404).json({
            error: `Constituent data is not available for benchmark indices.`,
        });
    }

    // ── Look up constituent list ────────────────────────────────────────────────
    const constituents = CONSTITUENTS[meta.symbol] || CONSTITUENTS[upperSymbol];
    if (!constituents || constituents.length === 0) {
        return res.status(404).json({
            error: `No constituent list found for '${rawSymbol}'.`,
        });
    }

    // ── Fetch sector data (for sectorReturns reference) ────────────────────────
    // Read from cache only — do not force a fresh fetch on every /stocks call
    let sectorSummary = null;
    try {
        sectorSummary = await getCache(cacheKeys.sector(meta.symbol), ctx);
    } catch (_) { /* non-fatal — sectorReturns will be null */ }

    // ── Parallel stock cache reads ──────────────────────────────────────────────
    const PERIOD_DAYS = { r1m: 21, r3m: 63, r6m: 126, r1y: 252, r2y: 494 };

    function computeReturn(closes, tradingDays) {
        if (!Array.isArray(closes) || closes.length < tradingDays + 1) return null;
        const latest = closes[closes.length - 1];
        const past   = closes[closes.length - 1 - tradingDays];
        if (latest == null || past == null || !isFinite(latest) || !isFinite(past) || past === 0) return null;
        return +(((latest - past) / past) * 100).toFixed(2);
    }

    const stockResults = await Promise.allSettled(
        constituents.map(async (entry) => {
            const ticker   = entry.symbol.toUpperCase().endsWith('.NS')
                ? entry.symbol
                : entry.symbol + '.NS';
            const cacheKey = cacheKeys.price(ticker);
            const cached   = await getCache(cacheKey, ctx);

            if (!cached || !Array.isArray(cached.historicalCloses)) {
                return { symbol: entry.symbol, name: entry.name, available: false, latestClose: null, returns: null };
            }

            const closes  = cached.historicalCloses;
            const returns = {};
            for (const [key, days] of Object.entries(PERIOD_DAYS)) {
                returns[key] = computeReturn(closes, days);
            }

            return {
                symbol:      entry.symbol,
                name:        entry.name,
                latestClose: closes[closes.length - 1] ?? null,
                returns,
                available:   true,
            };
        })
    );

    // ── Flatten results ─────────────────────────────────────────────────────────
    const stocks = stockResults.map((result, i) => {
        if (result.status === 'fulfilled') return result.value;
        logger.warn('Stock constituent fetch failed', {
            ...ctx,
            stock: constituents[i].symbol,
            error: result.reason?.message,
        });
        return { symbol: constituents[i].symbol, name: constituents[i].name, available: false, latestClose: null, returns: null };
    });

    const availableStocks = stocks.filter((s) => s.available).length;

    logger.info(`/markets/${rawSymbol}/stocks — ${availableStocks}/${stocks.length} available`, ctx);

    res.json({
        sectorSymbol:  meta.symbol,
        sectorName:    meta.name,
        sectorReturns: sectorSummary?.returns ?? null,
        stocks,
        totalStocks:   stocks.length,
        availableStocks,
    });
});

module.exports = router;
