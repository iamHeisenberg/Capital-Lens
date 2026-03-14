/**
 * Calculates a Compounder Score (out of 100) based on financial fundamentals.
 */

function calculateCompounderScore(fundamentals) {
    const toFiniteNumberOrNull = (v) => {
        if (v == null) return null;
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isFinite(n) ? n : null;
    };

    let valuation = 0;
    let growth = 0;
    let profitability = 0;
    let capitalEfficiency = 0;
    let balanceSheet = 0;

    const v = fundamentals?.valuation || {};
    const g = fundamentals?.growth || {};
    const p = fundamentals?.profitability || {};
    const ce = fundamentals?.capitalEfficiency || {};
    const bs = fundamentals?.balanceSheet || {};

    // --- Valuation (Max 18) ---
    // PE (Max 4): < 25 -> 4, 25-40 -> 2, > 40 -> 1
    const pe = toFiniteNumberOrNull(v.pe);
    let peScore = 0;
    if (pe != null) {
        if (pe < 25) peScore = 4;
        else if (pe <= 40) peScore = 2;
        else peScore = 1;
    } else {
        peScore = 1;
    }
    valuation += peScore;

    // PEG 1Y (Max 4): < 1 -> 4, 1-2 -> 2, > 2 -> 1
    const peg1y = toFiniteNumberOrNull(v.peg);
    let peg1yScore = 0;
    if (peg1y != null) {
        if (peg1y < 1) peg1yScore = 4;
        else if (peg1y <= 2) peg1yScore = 2;
        else peg1yScore = 1;
    } else {
        peg1yScore = 1;
    }
    valuation += peg1yScore;

    // PEG 3Y (Max 3): < 1 -> 3, 1-2 -> 2, > 2 -> 1
    const peg3y = toFiniteNumberOrNull(v.peg3y);
    let peg3yScore = 0;
    if (peg3y != null) {
        if (peg3y < 1) peg3yScore = 3;
        else if (peg3y <= 2) peg3yScore = 2;
        else peg3yScore = 1;
    } else {
        peg3yScore = 1;
    }
    valuation += peg3yScore;

    // EV/EBITDA (Max 4): < 12 -> 4, 12-20 -> 2, > 20 -> 1
    const evToEbitda = toFiniteNumberOrNull(v.evToEbitda);
    let evToEbitdaScore = 0;
    if (evToEbitda != null) {
        if (evToEbitda < 12) evToEbitdaScore = 4;
        else if (evToEbitda <= 20) evToEbitdaScore = 2;
        else evToEbitdaScore = 1;
    } else {
        evToEbitdaScore = 1;
    }
    valuation += evToEbitdaScore;

    // MarketCap/Sales (Max 3): < 3 -> 3, 3-6 -> 2, > 6 -> 1
    const marketCapToSales = toFiniteNumberOrNull(v.marketCapToSales);
    let marketCapToSalesScore = 0;
    if (marketCapToSales != null) {
        if (marketCapToSales < 3) marketCapToSalesScore = 3;
        else if (marketCapToSales <= 6) marketCapToSalesScore = 2;
        else marketCapToSalesScore = 1;
    } else {
        marketCapToSalesScore = 1;
    }
    valuation += marketCapToSalesScore;

    // --- Growth (Max 27) ---
    // Sales CAGR 3Y: >18->14, 10-18->10, 5-10->5, <5->2
    const sales3y = toFiniteNumberOrNull(g.sales?.cagr3y);
    let sales3yScore = 0;
    if (sales3y != null) {
        if (sales3y > 18) sales3yScore = 14;
        else if (sales3y >= 10) sales3yScore = 10;
        else if (sales3y >= 5) sales3yScore = 5;
        else sales3yScore = 2;
    } else {
        sales3yScore = 2;
    }
    growth += sales3yScore;

    // Profit CAGR 3Y: >18->13, 10-18->9, 5-10->4, <5->2
    const prof3y = toFiniteNumberOrNull(g.profit?.cagr3y);
    let prof3yScore = 0;
    if (prof3y != null) {
        if (prof3y > 18) prof3yScore = 13;
        else if (prof3y >= 10) prof3yScore = 9;
        else if (prof3y >= 5) prof3yScore = 4;
        else prof3yScore = 2;
    } else {
        prof3yScore = 2;
    }
    growth += prof3yScore;

    // --- Profitability (Max 18) ---
    // EBITDA Margin (Max 6): >25->6, 15-25->4, <15->2
    const ebitdaMargin = toFiniteNumberOrNull(p.ebitdaMargin);
    let ebitdaMarginScore = 0;
    if (ebitdaMargin != null) {
        if (ebitdaMargin > 25) ebitdaMarginScore = 6;
        else if (ebitdaMargin >= 15) ebitdaMarginScore = 4;
        else ebitdaMarginScore = 2;
    } else {
        ebitdaMarginScore = 2;
    }
    profitability += ebitdaMarginScore;

    // OPM (Max 6): >18->6, 10-18->4, <10->2
    const opm = toFiniteNumberOrNull(p.opm);
    let opmScore = 0;
    if (opm != null) {
        if (opm > 18) opmScore = 6;
        else if (opm >= 10) opmScore = 4;
        else opmScore = 2;
    } else {
        opmScore = 2;
    }
    profitability += opmScore;

    // NPM (Max 6): >12->6, 6-12->4, <6->2
    const npm = toFiniteNumberOrNull(p.npm);
    let npmScore = 0;
    if (npm != null) {
        if (npm > 12) npmScore = 6;
        else if (npm >= 6) npmScore = 4;
        else npmScore = 2;
    } else {
        npmScore = 2;
    }
    profitability += npmScore;

    // --- Capital Efficiency (Max 25) ---
    // ROE (Max 10): >20->10, 15-20->7, 10-15->4, <10->1
    const roe = toFiniteNumberOrNull(ce.roe);
    let roeScore = 0;
    if (roe != null) {
        if (roe > 20) roeScore = 10;
        else if (roe >= 15) roeScore = 7;
        else if (roe >= 10) roeScore = 4;
        else roeScore = 1;
    } else {
        roeScore = 1;
    }
    capitalEfficiency += roeScore;

    // ROCE (Max 10): >20->10, 15-20->7, 10-15->4, <10->1
    const roce = toFiniteNumberOrNull(ce.roce);
    let roceScore = 0;
    if (roce != null) {
        if (roce > 20) roceScore = 10;
        else if (roce >= 15) roceScore = 7;
        else if (roce >= 10) roceScore = 4;
        else roceScore = 1;
    } else {
        roceScore = 1;
    }
    capitalEfficiency += roceScore;

    // CFO/EBITDA (Max 5): >0.9->5, 0.7-0.9->3, <0.7->1
    const cfoToEbitda = toFiniteNumberOrNull(ce.cfoToEbitda);
    let cfoToEbitdaScore = 0;
    if (cfoToEbitda != null) {
        if (cfoToEbitda > 0.9) cfoToEbitdaScore = 5;
        else if (cfoToEbitda >= 0.7) cfoToEbitdaScore = 3;
        else cfoToEbitdaScore = 1;
    } else {
        cfoToEbitdaScore = 1;
    }
    capitalEfficiency += cfoToEbitdaScore;
    
    // --- Balance Sheet (Max 12) ---
    // D/E: <0.3->12, 0.3-0.7->9, 0.7-1.5->5, >1.5->2
    const debtToEquity = toFiniteNumberOrNull(bs.debtToEquity);
    let debtToEquityScore = 0;
    if (debtToEquity != null) {
        if (debtToEquity < 0.3) debtToEquityScore = 12;
        else if (debtToEquity <= 0.7) debtToEquityScore = 9;
        else if (debtToEquity <= 1.5) debtToEquityScore = 5;
        else debtToEquityScore = 2;
    } else {
        debtToEquityScore = 2;
    }
    balanceSheet += debtToEquityScore;

    const totalScore = valuation + growth + profitability + capitalEfficiency + balanceSheet;

    let classification = "Avoid";
    if (totalScore >= 85) classification = "Elite Compounder";
    else if (totalScore >= 70) classification = "Strong Compounder";
    else if (totalScore >= 55) classification = "Emerging Compounder";
    else if (totalScore >= 40) classification = "Average Business";

    const metricBreakdown = {
        valuation: {
            pe: { value: pe, score: peScore, max: 4 },
            peg1y: { value: peg1y, score: peg1yScore, max: 4 },
            peg3y: { value: peg3y, score: peg3yScore, max: 3 },
            evToEbitda: { value: evToEbitda, score: evToEbitdaScore, max: 4 },
            marketCapToSales: { value: marketCapToSales, score: marketCapToSalesScore, max: 3 },
        },
        growth: {
            sales3y: { value: sales3y, score: sales3yScore, max: 14 },
            profit3y: { value: prof3y, score: prof3yScore, max: 13 },
        },
        profitability: {
            ebitdaMargin: { value: ebitdaMargin, score: ebitdaMarginScore, max: 6 },
            opm: { value: opm, score: opmScore, max: 6 },
            npm: { value: npm, score: npmScore, max: 6 },
        },
        capitalEfficiency: {
            roe: {
                value: roe,
                score: roeScore,
                max: 10,
            },
            roce: {
                value: roce,
                score: roceScore,
                max: 10,
            },
            cfoToEbitda: {
                value: cfoToEbitda,
                score: cfoToEbitdaScore,
                max: 5,
            },
        },
        balanceSheet: {
            debtToEquity: {
                value: debtToEquity,
                score: debtToEquityScore,
                max: 12,
            },
        },
    };

    return {
        totalScore,
        classification,
        breakdown: {
            valuation,
            growth,
            profitability,
            capitalEfficiency,
            balanceSheet,
        },
        metricBreakdown,
    };
}

module.exports = { calculateCompounderScore };
