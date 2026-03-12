const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const { getCache, setCache } = require('../cacheService');

/**
 * Fetch raw financial data from Yahoo Finance for an NSE ticker.
 *
 * Returns normalized object:
 *   { ticker, quote, incomeAnnual, incomeQuarterly, balanceSheet, cashflow, timeSeries }
 *
 * No calculations — this module is responsible ONLY for data fetching.
 *
 * `timeSeries` is fetched via fundamentalsTimeSeries (annual, module: 'all')
 * to restore balance-sheet and cash-flow data deprecated in quoteSummary.
 */
const fetchFinancials = async (ticker) => {
    const nseTicker = ticker.toUpperCase().endsWith('.NS')
        ? ticker.toUpperCase()
        : ticker.toUpperCase() + '.NS';

    const cacheKey = `fundamentals_${nseTicker}`;
    const cachedData = getCache(cacheKey);

    if (cachedData) {
        console.log(`[CACHE HIT] Returning cached fundamentals data for ${nseTicker}`);
        return cachedData;
    }

    console.log(`[CACHE MISS] Fetching fundamentals data from Yahoo for ${nseTicker}`);

    const modules = [
        'summaryDetail',
        'financialData',
        'defaultKeyStatistics',
        'incomeStatementHistory',
        'incomeStatementHistoryQuarterly',
        'balanceSheetHistory',
        'cashflowStatementHistory',
    ];

    // ── 1. quoteSummary (existing) ──────────────────────────────
    let result;
    try {
        result = await yahooFinance.quoteSummary(nseTicker, { modules });
    } catch (err) {
        const error = new Error(`Failed to fetch financials for ${nseTicker}: ${err.message}`);
        error.statusCode = 502;
        throw error;
    }

    if (!result) {
        const error = new Error(`No financial data found for ${nseTicker}`);
        error.statusCode = 404;
        throw error;
    }

    // ── 2. fundamentalsTimeSeries (new) ─────────────────────────
    // Fetches annual balance-sheet, income, and cash-flow data
    // over the last 6 years. Uses { validateResult: false } to
    // work around a known schema-validation issue for Indian stocks.
    let timeSeries = [];
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 6);

        const tsRaw = await yahooFinance.fundamentalsTimeSeries(nseTicker, {
            type: 'annual',
            module: 'all',
            period1: startDate,
            period2: endDate,
        }, { validateResult: false });

        // Sort by date ascending (oldest first)
        timeSeries = (tsRaw || [])
            .filter((e) => e.totalAssets != null || e.operatingCashFlow != null || e.EBIT != null)
            .sort((a, b) => {
                const da = a.date instanceof Date ? a.date.getTime() : a.date * 1000;
                const db = b.date instanceof Date ? b.date.getTime() : b.date * 1000;
                return da - db;
            });
    } catch (err) {
        // Non-fatal: time series is supplementary data
        console.warn(`[fetchFinancials] fundamentalsTimeSeries unavailable for ${nseTicker}: ${err.message}`);
    }

    // ── 3. Extract & normalize ──────────────────────────────────
    const quote = {
        summaryDetail: result.summaryDetail || {},
        financialData: result.financialData || {},
        defaultKeyStatistics: result.defaultKeyStatistics || {},
    };

    const incomeAnnual =
        result.incomeStatementHistory?.incomeStatementHistory || [];

    const incomeQuarterly =
        result.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];

    const balanceSheet =
        result.balanceSheetHistory?.balanceSheetStatements || [];

    const cashflow =
        result.cashflowStatementHistory?.cashflowStatements || [];

    const responseData = {
        ticker: nseTicker,
        quote,
        incomeAnnual,
        incomeQuarterly,
        balanceSheet,
        cashflow,
        timeSeries,
    };

    // Cache fundamentals data for 24 hours (86400 seconds)
    setCache(cacheKey, responseData, 86400);
    return responseData;
};

module.exports = { fetchFinancials };
