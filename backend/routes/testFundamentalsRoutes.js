const express = require('express');
const router = express.Router();
const { fetchFinancials } = require('../services/fundamentals/fetchFinancials');

/**
 * GET /api/test-financials/:ticker
 *
 * Temporary test route to verify fetchFinancials works.
 * Returns statement counts and sample values — NOT the full payload.
 */
router.get('/test-financials/:ticker', async (req, res) => {
    try {
        const { ticker } = req.params;
        const data = await fetchFinancials(ticker);

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
        res.status(status).json({ error: err.message });
    }
});

module.exports = router;
