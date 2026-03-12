/**
 * computeMetrics.js
 *
 * Pure computation module — no Express, no API calls.
 * Receives raw financial data from fetchFinancials() and returns
 * structured, grouped metrics.
 *
 * Data sources:
 *   - incomeStatementHistory: totalRevenue + netIncome per year (growth)
 *   - financialData: margins, EBITDA, debt, revenue (TTM)
 *   - defaultKeyStatistics: PE, PB, EV ratios, shares outstanding
 *   - timeSeries (fundamentalsTimeSeries): annual balance-sheet and
 *     cash-flow data (totalAssets, currentLiabilities, EBIT, EBITDA,
 *     operatingCashFlow) — restores ROCE and CFO/EBITDA
 *
 * Strategy:
 *   - Growth (CAGR): from annual income statements
 *   - Profitability: from financialData margins
 *   - Capital efficiency: ROCE from timeSeries; ROE from keyStats;
 *     CFO/EBITDA from timeSeries
 *   - Valuation: from defaultKeyStatistics + financialData
 *   - Balance sheet: from financialData
 */

// ─── Helper Functions ─────────────────────────────────────────

/**
 * Safe division — returns null if divisor is 0 or either value is missing.
 */
function safeDivide(numerator, denominator) {
    if (numerator == null || denominator == null || denominator === 0) {
        return null;
    }
    return numerator / denominator;
}

/**
 * Round to n decimal places. Returns null if value is not a finite number.
 */
function round(value, decimals = 2) {
    if (value == null || !isFinite(value)) return null;
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Convert a ratio to percentage and round.
 * e.g. 0.164 → 16.4
 */
function toPercent(value, decimals = 2) {
    if (value == null) return null;
    return round(value * 100, decimals);
}

/**
 * Year-over-year growth: (current - previous) / |previous|
 * Returns percentage value (e.g. 12.4 for 12.4%).
 */
function calculateYoY(current, previous) {
    const ratio = safeDivide(current - previous, Math.abs(previous));
    return toPercent(ratio);
}

/**
 * CAGR: (End / Start)^(1/n) - 1
 * n = number of years between start and end.
 * Returns percentage value.
 */
function calculateCAGR(endValue, startValue, years) {
    if (endValue == null || startValue == null || startValue <= 0 || years <= 0) {
        return null;
    }
    if (endValue <= 0) return null; // Can't compute CAGR with negative end value

    const cagr = Math.pow(endValue / startValue, 1 / years) - 1;
    return toPercent(cagr);
}

// ─── Time-Series Helpers ──────────────────────────────────────

/**
 * Get the most recent entry from timeSeries that has a given field.
 */
function getLatestTS(timeSeries, field) {
    if (!timeSeries || !timeSeries.length) return null;
    // timeSeries is sorted ascending (oldest first), walk backwards
    for (let i = timeSeries.length - 1; i >= 0; i--) {
        if (timeSeries[i][field] != null) return timeSeries[i];
    }
    return null;
}

// ─── Growth Metrics ───────────────────────────────────────────

/**
 * Compute sales and profit growth from timeSeries data (consolidated).
 * Falls back to quoteSummary incomeAnnual if timeSeries is unavailable.
 *
 * timeSeries is sorted ascending (oldest first) by fetchFinancials.
 */
function computeGrowth(timeSeries, incomeAnnual) {
    // Prefer timeSeries (consolidated). Filter entries that have revenue or netIncome.
    const tsRevEntries = (timeSeries || []).filter((e) => e.totalRevenue != null);
    const tsNIEntries = (timeSeries || []).filter((e) => e.netIncome != null);

    let revenues, netIncomes;

    if (tsRevEntries.length >= 2) {
        // timeSeries is ascending → reverse to get descending (most recent first)
        revenues = [...tsRevEntries].reverse().map((e) => e.totalRevenue);
    } else {
        // Fallback to quoteSummary incomeAnnual
        const sorted = [...incomeAnnual].sort(
            (a, b) => new Date(b.endDate) - new Date(a.endDate)
        );
        revenues = sorted.map((s) => s.totalRevenue).filter((v) => v != null);
    }

    if (tsNIEntries.length >= 2) {
        netIncomes = [...tsNIEntries].reverse().map((e) => e.netIncome);
    } else {
        const sorted = [...incomeAnnual].sort(
            (a, b) => new Date(b.endDate) - new Date(a.endDate)
        );
        netIncomes = sorted.map((s) => s.netIncome).filter((v) => v != null);
    }

    return {
        sales: {
            yoy: revenues.length >= 2 ? calculateYoY(revenues[0], revenues[1]) : null,
            cagr3y: revenues.length >= 4 ? calculateCAGR(revenues[0], revenues[3], 3) : null,
        },
        profit: {
            yoy: netIncomes.length >= 2 ? calculateYoY(netIncomes[0], netIncomes[1]) : null,
            cagr3y: netIncomes.length >= 4 ? calculateCAGR(netIncomes[0], netIncomes[3], 3) : null,
        },
    };
}

// ─── Profitability Metrics ────────────────────────────────────

/**
 * Compute margins from financialData (TTM values from Yahoo).
 * Yahoo provides these as ratios (e.g. 0.164), we convert to %.
 */
function computeProfitability(financialData) {
    return {
        ebitdaMargin: toPercent(financialData.ebitdaMargins ?? null),
        opm: toPercent(financialData.operatingMargins ?? null),
        npm: toPercent(financialData.profitMargins ?? null),
    };
}

// ─── Capital Efficiency Metrics ───────────────────────────────

/**
 * Compute ROE, ROCE, CFO/EBITDA.
 *
 * ROE: Net Income / Shareholder Equity (from keyStats)
 *
 * ROCE: EBIT / Capital Employed
 *   Capital Employed = Total Assets − Current Liabilities
 *   Uses timeSeries data (fundamentalsTimeSeries) for all three fields.
 *
 * CFO/EBITDA: Operating Cash Flow / EBITDA
 *   Uses timeSeries for operatingCashFlow and EBITDA.
 *   Measures quality of earnings: >1 means EBITDA is backed by real cash.
 */
function computeCapitalEfficiency(financialData, keyStats, timeSeries) {
    // ── ROE from timeSeries ─────────────────────────────────────
    // ROE = Net Income / Stockholders' Equity (from annual balance sheet)
    // Falls back to keyStats approximation if timeSeries unavailable.
    let roe = null;
    const latestEquity = getLatestTS(timeSeries, 'stockholdersEquity');
    const latestNI = getLatestTS(timeSeries, 'netIncome');

    if (latestEquity && latestNI) {
        const tsEquity = latestEquity.stockholdersEquity;
        const tsNetIncome = latestNI.netIncome;
        roe = toPercent(safeDivide(tsNetIncome, tsEquity));
    }

    // Fallback: approximate from keyStats
    if (roe == null) {
        const bookValue = keyStats.bookValue;
        const shares = keyStats.sharesOutstanding;
        const netIncome = keyStats.netIncomeToCommon;
        const equity = (bookValue != null && shares != null) ? bookValue * shares : null;
        roe = toPercent(safeDivide(netIncome, equity));
    }

    // ── ROCE from timeSeries ────────────────────────────────────
    let roce = null;
    const latestBS = getLatestTS(timeSeries, 'totalAssets');
    const latestFin = getLatestTS(timeSeries, 'EBIT');

    if (latestBS && latestFin) {
        const totalAssets = latestBS.totalAssets;
        const currentLiab = latestBS.currentLiabilities;
        const ebit = latestFin.EBIT;

        if (totalAssets != null && currentLiab != null && ebit != null) {
            const capitalEmployed = totalAssets - currentLiab;
            roce = toPercent(safeDivide(ebit, capitalEmployed));
        }
    }

    // ── CFO/EBITDA from timeSeries ──────────────────────────────
    let cfoToEbitda = null;
    const latestCF = getLatestTS(timeSeries, 'operatingCashFlow');
    const latestEBITDA = getLatestTS(timeSeries, 'EBITDA');

    if (latestCF && latestEBITDA) {
        const cfo = latestCF.operatingCashFlow;
        const ebitda = latestEBITDA.EBITDA;

        if (cfo != null && ebitda != null && ebitda > 0) {
            cfoToEbitda = round(safeDivide(cfo, ebitda));
        }
    }

    return { roe, roce, cfoToEbitda };
}

// ─── Balance Sheet Metrics ────────────────────────────────────

/**
 * Debt/Equity from financialData.
 * Yahoo provides debtToEquity as a percentage (e.g. 35.65 = 35.65%).
 * We return as a ratio (0.36).
 */
function computeBalanceSheet(financialData) {
    const rawD2E = financialData.debtToEquity;
    // Yahoo returns D/E as percentage, convert to ratio
    const debtToEquity = rawD2E != null ? round(rawD2E / 100) : null;

    return { debtToEquity };
}

// ─── Valuation Metrics ────────────────────────────────────────

/**
 * Compute EPS Growth (TTM YoY) using timeSeries net income (consolidated).
 * Falls back to quoteSummary incomeAnnual if timeSeries unavailable.
 *
 * EPS = Net Income / Shares Outstanding
 * EPS Growth = ((epsCurrent - epsPrevious) / |epsPrevious|) * 100
 *
 * Returns null if:
 *   - Less than 2 annual statements
 *   - Previous EPS ≤ 0 (can't compute meaningful growth)
 *   - Current EPS ≤ 0 (negative growth → PEG undefined)
 */
function computeEpsGrowth(timeSeries, incomeAnnual, keyStats) {
    const shares = keyStats.sharesOutstanding;
    if (!shares || shares <= 0) return null;

    let netIncomeCurrent, netIncomePrevious;

    // Prefer timeSeries (consolidated)
    const tsNI = (timeSeries || []).filter((e) => e.netIncome != null);
    if (tsNI.length >= 2) {
        netIncomeCurrent = tsNI[tsNI.length - 1].netIncome;
        netIncomePrevious = tsNI[tsNI.length - 2].netIncome;
    } else {
        // Fallback to quoteSummary
        const sorted = [...incomeAnnual].sort(
            (a, b) => new Date(b.endDate) - new Date(a.endDate)
        );
        if (sorted.length < 2) return null;
        netIncomeCurrent = sorted[0]?.netIncome;
        netIncomePrevious = sorted[1]?.netIncome;
    }

    if (netIncomeCurrent == null || netIncomePrevious == null) return null;

    // EPS for current and previous year
    const epsCurrent = netIncomeCurrent / shares;
    const epsPrevious = netIncomePrevious / shares;

    // Guard: previous EPS must be positive for meaningful growth
    if (epsPrevious <= 0) return null;
    // Guard: negative current EPS → negative growth → PEG undefined
    if (epsCurrent <= 0) return null;

    // Fallback: use trailingEps from Yahoo if available
    const trailingEps = keyStats.trailingEps ?? epsCurrent;

    // YoY growth percentage
    return calculateYoY(trailingEps, epsPrevious);
}

/**
 * Compute valuation ratios.
 *
 * PE  = Market Cap / Net Income (trailing)
 * PEG = PE / EPS Growth (TTM YoY)
 * PEG3Y = PE / 3-Year Profit CAGR (more stable, industry-standard)
 * Market Cap / Sales
 */
function computeValuation(financialData, keyStats, timeSeries, incomeAnnual, growth) {
    const currentPrice = financialData.currentPrice;
    const shares = keyStats.sharesOutstanding;
    const marketCap = (currentPrice != null && shares != null)
        ? currentPrice * shares
        : null;

    const totalRevenue = financialData.totalRevenue;
    const netIncome = keyStats.netIncomeToCommon;

    // PE = Market Cap / Net Income (trailing)
    const pe = round(safeDivide(marketCap, netIncome));

    // Market Cap / Sales
    const marketCapToSales = round(safeDivide(marketCap, totalRevenue));

    // EPS Growth (TTM YoY) — uses timeSeries for consolidated data
    const epsGrowthYoY = computeEpsGrowth(timeSeries, incomeAnnual, keyStats);

    // PEG = PE / EPS Growth (1Y)
    // Only valid when both PE and epsGrowth are positive
    const peg = (pe != null && pe > 0 && epsGrowthYoY != null && epsGrowthYoY > 0)
        ? round(pe / epsGrowthYoY)
        : null;

    // PEG3Y = PE / 3-Year Profit CAGR (more stable, industry-standard)
    const profitCagr3y = growth?.profit?.cagr3y;
    const peg3y = (pe != null && pe > 0 && profitCagr3y != null && profitCagr3y > 0)
        ? round(pe / profitCagr3y)
        : null;

    // EV / EBITDA
    const evToEbitda = keyStats.enterpriseToEbitda != null
        ? round(keyStats.enterpriseToEbitda)
        : null;

    return { pe, epsGrowthYoY, peg, peg3y, evToEbitda, marketCapToSales };
}

// ─── Main Entry Point ─────────────────────────────────────────

/**
 * Compute all fundamental metrics from raw financial data.
 *
 * @param {Object} rawData - Output of fetchFinancials()
 * @returns {Object} Grouped metrics object
 */
function computeMetrics(rawData) {
    const { ticker, quote, incomeAnnual, timeSeries } = rawData;
    const financialData = quote.financialData || {};
    const keyStats = quote.defaultKeyStatistics || {};

    const ts = timeSeries || [];

    const growth = computeGrowth(ts, incomeAnnual);
    const profitability = computeProfitability(financialData);
    const capitalEfficiency = computeCapitalEfficiency(financialData, keyStats, ts);
    const balanceSheet = computeBalanceSheet(financialData);
    const valuation = computeValuation(financialData, keyStats, ts, incomeAnnual, growth);

    return {
        ticker,
        valuation,
        growth,
        profitability,
        capitalEfficiency,
        balanceSheet,
    };
}

module.exports = { computeMetrics };
