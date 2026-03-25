const express = require('express');
const router = express.Router();
const { fetchFinancials } = require('../services/fundamentals/fetchFinancials');
const { computeMetrics } = require('../services/fundamentals/computeMetrics');
const { calculateCompounderScore } = require('../services/scoring/compounderScore');
const logger = require('../utils/logger');

/**
 * GET /api/fundamentals/:ticker
 *
 * Production endpoint — returns computed fundamental metrics.
 * No raw data, no debug fields, no statement counts.
 */
router.get('/fundamentals/:ticker', async (req, res) => {
    const { ticker } = req.params;
    const ctx = {
        correlationId: req.correlationId,
        endpoint: req.originalUrl,
        method: req.method,
        ticker: ticker.toUpperCase(),
    };

    try {
        const rawData = await fetchFinancials(ticker, ctx);
        const metrics = computeMetrics(rawData);
        const scoreResult = calculateCompounderScore(metrics);
        res.json({
            fundamentals: metrics,
            score: {
                total: scoreResult.totalScore,
                classification: scoreResult.classification,
                breakdown: scoreResult.breakdown,
                metricBreakdown: scoreResult.metricBreakdown,
            },
        });
    } catch (err) {
        const status = err.statusCode || 500;
        logger.error('Request handler error — /fundamentals', ctx, {
            errorMessage: err.message,
            statusCode: status,
            stack: err.stack,
        });
        res.status(status).json({ error: err.message });
    }
});

module.exports = router;
