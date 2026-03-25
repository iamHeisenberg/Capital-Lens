const express = require('express');
const router = express.Router();
const { fetchFinancials } = require('../services/fundamentals/fetchFinancials');
const logger = require('../utils/logger');

/**
 * GET /api/test-financials/:ticker
 *
 * Temporary test route to verify fetchFinancials works.
 * Returns statement counts and sample values — NOT the full payload.
 */
router.get('/test-financials/:ticker', async (req, res) => {
    const { ticker } = req.params;
    const ctx = {
        correlationId: req.correlationId,
        endpoint: req.originalUrl,
        method: req.method,
        ticker: ticker.toUpperCase(),
    };

    try {
        const data = await fetchFinancials(ticker, ctx);

        res.json({
            ticker: data.ticker,
            annualCount: data.incomeAnnual.length,
            quarterlyCount: data.incomeQuarterly.length,
            balanceSheetCount: data.balanceSheet.length,
            cashflowCount: data.cashflow.length,
            sampleRevenue: data.incomeAnnual[0]?.totalRevenue ?? null,
            sampleNetIncome: data.incomeAnnual[0]?.netIncome ?? null,
        });
    } catch (err) {
        const status = err.statusCode || 500;
        logger.error('Request handler error — /test-financials', ctx, {
            errorMessage: err.message,
            statusCode: status,
            stack: err.stack,
        });
        res.status(status).json({ error: err.message });
    }
});

module.exports = router;

