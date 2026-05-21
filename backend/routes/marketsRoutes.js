'use strict';

/**
 * marketsRoutes.js
 *
 * Two endpoints:
 *
 *   GET /api/markets
 *     Returns lightweight summary for ALL sectors and indices (no historical arrays).
 *     Reads all 15 cache keys in parallel — fast even on first load.
 *     Response: { benchmarks: [...summaries], sectors: [...summaries] }
 *
 *   GET /api/markets/:symbol
 *     Returns full data (including historicalCloses, dma series etc.) for ONE symbol.
 *     Symbol must be URL-encoded by the caller: encodeURIComponent('^NSEI') = '%5ENSEI'.
 *     Express decodes req.params.symbol back to '^NSEI' automatically.
 *     Validates against the sectors.json allowlist to prevent arbitrary YF lookups.
 *     Response: full getSectorData() object
 *
 *
 *   GET /api/markets/:symbol/stocks
 *     Returns multi-period returns for all constituent stocks of a sector index.
 *     Only valid for sector indices (not benchmarks — those have no mapped constituents).
 *     Reads individual stock price caches in parallel — no fresh Yahoo Finance calls.
 *     Stocks absent from Redis are marked available:false (no error thrown).
 *     Response: { sectorSymbol, sectorName, sectorReturns, stocks[], totalStocks, availableStocks }
 *
 * All endpoints support ?refresh=true to bypass the cache.
 */

const express  = require('express');
const router   = express.Router();
const logger   = require('../utils/logger');
const { getSectorData, toSummary } = require('../services/sectorService');
const { getStockData }             = require('../services/priceService');
const { getCache, cacheKeys }      = require('../services/cacheService');

// ── Static catalogs ────────────────────────────────────────────────────────────
const SECTORS      = require('../../frontend/src/data/sectors.json');
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

// ── GET /api/markets/:symbol/stocks ─────────────────────────────────────────
/**
 * Returns multi-period returns for each constituent stock of a sector index.
 *
 * Uses getStockData (cache-first): reads from Redis if available; falls back to
 * a fresh Yahoo Finance fetch only on cache miss. This ensures the stocks table
 * always shows real data, not just "—" on a cold cache.
 *
 * The sector's own pre-computed returns are included for the reference row.
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

    // ── Validate against sector allowlist ──────────────────────────────────────
    const meta = SECTOR_MAP.get(upperSymbol);
    if (!meta) {
        return res.status(404).json({
            error: `Symbol '${rawSymbol}' is not in the supported sector catalog.`,
        });
    }

    // ── Check constituent mapping exists ──────────────────────────────────────
    const constituentList = CONSTITUENTS[meta.symbol];
    if (!constituentList || constituentList.length === 0) {
        return res.status(404).json({
            error: `No constituent data available for '${rawSymbol}'. Only sector indices (not benchmarks) have constituent mappings.`,
        });
    }

    try {
        // ── Read sector cache for reference returns ────────────────────────────
        // Used to populate the reference row in the frontend's stocks table.
        const sectorCache = await getSectorData(meta.symbol, { ctx, meta });
        const sectorReturns = sectorCache?.returns ?? null;

        // ── Compute return helper (same formula as sectorService) ─────────────────
        const PERIOD_DAYS = { r1m: 21, r3m: 63, r6m: 126, r1y: 252, r2y: 494 };

        function computeReturn(closes, days) {
            if (!Array.isArray(closes) || closes.length < days + 1) return null;
            const latest = closes[closes.length - 1];
            const past   = closes[closes.length - 1 - days];
            if (!latest || !past || !isFinite(latest) || !isFinite(past) || past === 0) return null;
            return +(((latest - past) / past) * 100).toFixed(2);
        }

        // ── Fetch constituent stocks (cache-first, Yahoo fallback) ─────────────────
        const results = await Promise.allSettled(
            constituentList.map((stock) =>
                getStockData(stock.symbol, { ctx })
            )
        );

        let availableStocks = 0;

        const stocks = results.map((result, i) => {
            const stock = constituentList[i];

            if (result.status === 'rejected' || !result.value) {
                logger.warn('Stock data unavailable for constituent', {
                    ...ctx, constituent: stock.symbol,
                    reason: result.reason?.message ?? 'no data returned',
                });
                return {
                    symbol:      stock.symbol,
                    name:        stock.name,
                    latestClose: null,
                    returns:     null,
                    available:   false,
                };
            }

            const cached  = result.value;
            const closes  = cached.historicalCloses ?? [];
            const returns = {};

            for (const [key, days] of Object.entries(PERIOD_DAYS)) {
                returns[key] = computeReturn(closes, days);
            }

            availableStocks++;
            return {
                symbol:      stock.symbol,
                name:        stock.name,
                latestClose: cached.latestClose ?? null,
                returns,
                available:   true,
            };
        });

        res.json({
            sectorSymbol:    meta.symbol,
            sectorName:      meta.name,
            sectorReturns,
            stocks,
            totalStocks:     constituentList.length,
            availableStocks,
        });

    } catch (err) {
        const status = err.statusCode || 500;
        logger.error('Request handler error — /markets/:symbol/stocks', {
            ...ctx, errorMessage: err.message, statusCode: status,
        });
        res.status(status).json({ error: err.message });
    }
});

module.exports = router;
