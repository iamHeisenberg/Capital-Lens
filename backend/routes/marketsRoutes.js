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
 * Both endpoints support ?refresh=true to bypass the cache.
 */

const express = require('express');
const router  = express.Router();
const logger  = require('../utils/logger');
const { getSectorData, toSummary } = require('../services/sectorService');

// ── Sector catalog (allowlist + metadata source) ───────────────────────────────
const SECTORS = require('../../frontend/src/data/sectors.json');

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

module.exports = router;
