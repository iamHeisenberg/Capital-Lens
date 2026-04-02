const { getStockData } = require('../services/priceService');
const logger = require('../utils/logger');

/**
 * Controller for price-related endpoints.
 */
const getPrice = async (req, res) => {
    const ticker = req.ticker;
    // ?refresh=true bypasses cache and forces a fresh Yahoo Finance fetch.
    // Any value other than the string "true" is treated as false (edge case safe).
    const forceRefresh = req.query.refresh === 'true';

    const ctx = {
        correlationId: req.correlationId,
        endpoint: req.originalUrl,
        method: req.method,
        ticker: ticker.toUpperCase(),
    };

    if (forceRefresh) {
        logger.info('Cache bypass requested', {
            ...ctx,
            event: 'CACHE_BYPASS_FORCE_REFRESH',
        });
    }

    try {
        const data = await getStockData(ticker, { forceRefresh, ctx });
        res.json(data);
    } catch (err) {
        const statusCode = err.statusCode || 500;
        logger.error('Request handler error — /price', ctx, {
            errorMessage: err.message,
            statusCode,
            stack: err.stack,
        });
        res.status(statusCode).json({ error: err.message });
    }
};

module.exports = { getPrice };
