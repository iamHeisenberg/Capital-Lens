'use strict';

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const { getCache, setCache, cacheKeys } = require('../cacheService');
const logger = require('../../utils/logger');

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
 *
 * @param {string} ticker
 * @param {object} [ctx]  - request context { correlationId, endpoint, method }
 */
const fetchFinancials = async (ticker, ctx = {}) => {
    const nseTicker = ticker.toUpperCase().endsWith('.NS')
        ? ticker.toUpperCase()
        : ticker.toUpperCase() + '.NS';

    const logCtx = { ...ctx, ticker: nseTicker };

    const cacheKey = cacheKeys.fundamentals(nseTicker);
    const cachedData = await getCache(cacheKey, logCtx);

    if (cachedData) {
        return cachedData;
    }

    logger.info('Cache miss — fetching fundamentals from Yahoo Finance', logCtx);

    const modules = [
        'summaryDetail',
        'financialData',
        'defaultKeyStatistics',
        'incomeStatementHistory',
        'incomeStatementHistoryQuarterly',
        'balanceSheetHistory',
        'cashflowStatementHistory',
    ];

    // ── 1. quoteSummary ────────────────────────────────────────────────────────
    let result;
    const t1 = Date.now();
    logger.info('Calling external API — quoteSummary', logCtx, { modules });

    try {
        result = await yahooFinance.quoteSummary(nseTicker, { modules });
        const latencyMs = Date.now() - t1;

        if (!result) {
            const error = new Error(`No financial data found for ${nseTicker}`);
            error.statusCode = 404;
            throw error;
        }

        // Build a high-level summary — never log the full payload
        const incomeRows = result.incomeStatementHistory?.incomeStatementHistory || [];
        const balanceRows = result.balanceSheetHistory?.balanceSheetStatements || [];
        const cashflowRows = result.cashflowStatementHistory?.cashflowStatements || [];

        const missingFields = [];
        if (!incomeRows.length) missingFields.push('incomeStatementHistory');
        if (!balanceRows.length) missingFields.push('balanceSheetStatements');
        if (!cashflowRows.length) missingFields.push('cashflowStatements');
        if (!result.financialData?.totalRevenue) missingFields.push('totalRevenue');
        if (!result.financialData?.netIncomeToCommon) missingFields.push('netIncomeToCommon');

        const summary = {
            hasRevenue: !!result.financialData?.totalRevenue,
            hasNetIncome: !!result.financialData?.netIncomeToCommon,
            incomeRows: incomeRows.length,
            balanceRows: balanceRows.length,
            cashflowRows: cashflowRows.length,
            missingFields,
        };

        logger.info('External API response received — quoteSummary', { ...logCtx, latencyMs }, summary);

        if (missingFields.length > 0) {
            logger.warn('Partial data received from external API — quoteSummary', logCtx, { missingFields });
        }
    } catch (err) {
        const latencyMs = Date.now() - t1;
        logger.error('External API call failed — quoteSummary', { ...logCtx, latencyMs }, {
            errorMessage: err.message,
            stack: err.stack,
        });
        const error = new Error(`Failed to fetch financials for ${nseTicker}: ${err.message}`);
        error.statusCode = err.statusCode || 502;
        throw error;
    }

    // ── 2. fundamentalsTimeSeries ──────────────────────────────────────────────
    let timeSeries = [];
    const t2 = Date.now();
    logger.info('Calling external API — fundamentalsTimeSeries', logCtx);

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

        const latencyMs = Date.now() - t2;

        // Sort by date ascending (oldest first)
        timeSeries = (tsRaw || [])
            .filter((e) => e.totalAssets != null || e.operatingCashFlow != null || e.EBIT != null)
            .sort((a, b) => {
                const da = a.date instanceof Date ? a.date.getTime() : a.date * 1000;
                const db = b.date instanceof Date ? b.date.getTime() : b.date * 1000;
                return da - db;
            });

        const missingTs = [];
        if (!timeSeries.some(e => e.totalAssets != null)) missingTs.push('totalAssets');
        if (!timeSeries.some(e => e.operatingCashFlow != null)) missingTs.push('operatingCashFlow');

        logger.info('External API response received — fundamentalsTimeSeries', { ...logCtx, latencyMs }, {
            rowCount: timeSeries.length,
            missingFields: missingTs,
        });

        if (missingTs.length > 0) {
            logger.warn('Partial data received from external API — fundamentalsTimeSeries', logCtx, { missingFields: missingTs });
        }
    } catch (err) {
        const latencyMs = Date.now() - t2;
        // Non-fatal: time series is supplementary data
        logger.warn('External API call failed (non-fatal) — fundamentalsTimeSeries', { ...logCtx, latencyMs }, {
            errorMessage: err.message,
        });
    }

    // ── 3. Extract & normalize ─────────────────────────────────────────────────
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
    await setCache(cacheKey, responseData, 86400, logCtx);
    return responseData;
};

module.exports = { fetchFinancials };
