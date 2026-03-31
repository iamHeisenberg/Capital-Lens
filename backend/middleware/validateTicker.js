'use strict';

const logger = require('../utils/logger');

/**
 * Ticker Validation & Normalization Middleware
 *
 * - Rejects empty or malformed tickers with a 400 early
 * - Normalizes to uppercase (trim included)
 * - Attaches req.ticker so all downstream handlers use the clean value
 * - Integrates with the structured JSON logger (correlationId-aware)
 *
 * Accepted format: letters, digits, dots, hyphens — max 20 chars
 * Examples: RELIANCE.NS  TCS.NS  HDFCBANK.NS  INFY
 */
const TICKER_REGEX = /^[A-Z0-9.\-]{1,20}$/;

function validateTicker(req, res, next) {
    const ctx = {
        correlationId: req.correlationId,
        endpoint: req.originalUrl,
        method: req.method,
    };

    const raw = req.params.ticker;

    // Guard: missing or empty
    if (!raw || raw.trim() === '') {
        logger.warn('Ticker validation failed — empty ticker', ctx);
        return res.status(400).json({
            error: 'Ticker is required',
            correlationId: req.correlationId,
        });
    }

    const normalized = raw.trim().toUpperCase();

    // Guard: invalid characters or length
    if (!TICKER_REGEX.test(normalized)) {
        logger.warn('Ticker validation failed — invalid format', ctx, {
            rawTicker: raw,
            normalizedTicker: normalized,
        });
        return res.status(400).json({
            error: 'Invalid ticker format. Use letters, digits, dots, or hyphens (max 20 chars).',
            correlationId: req.correlationId,
        });
    }

    // Attach clean, normalized ticker for all downstream handlers
    req.ticker = normalized;

    logger.debug('Ticker validated', { ...ctx, ticker: normalized });

    next();
}

module.exports = validateTicker;
