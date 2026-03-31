const { getStockData } = require('../services/priceService');
const logger = require('../utils/logger');

/**
 * Controller for price-related endpoints.
 */
const getPrice = async (req, res) => {
    const ticker = req.ticker;
    const ctx = {
        correlationId: req.correlationId,
        endpoint: req.originalUrl,
        method: req.method,
        ticker: ticker.toUpperCase(),
    };

    try {
        const data = await getStockData(ticker);
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

