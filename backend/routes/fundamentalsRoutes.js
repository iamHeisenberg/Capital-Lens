const express = require('express');
const router = express.Router();
const { fetchFinancials } = require('../services/fundamentals/fetchFinancials');
const { computeMetrics } = require('../services/fundamentals/computeMetrics');
const { calculateCompounderScore } = require('../services/scoring/compounderScore');

/**
 * GET /api/fundamentals/:ticker
 *
 * Production endpoint — returns computed fundamental metrics.
 * No raw data, no debug fields, no statement counts.
 */
router.get('/fundamentals/:ticker', async (req, res) => {
    try {
        const { ticker } = req.params;
        const rawData = await fetchFinancials(ticker);
        const metrics = computeMetrics(rawData);
        const scoreResult = calculateCompounderScore(metrics);
        res.json({
            fundamentals: metrics,
            score: {
                total: scoreResult.totalScore,
                classification: scoreResult.classification,
                breakdown: scoreResult.breakdown,
                metrics: scoreResult.metrics,
            },
        });
    } catch (err) {
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message });
    }
});

module.exports = router;
