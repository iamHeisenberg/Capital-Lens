/**
 * Calculates a Compounder Score (out of 100) based on financial fundamentals.
 */

function calculateCompounderScore(fundamentals) {
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
    if (v.pe != null) {
        if (v.pe < 25) valuation += 4;
        else if (v.pe <= 40) valuation += 2;
        else valuation += 1;
    } else valuation += 1;

    // PEG 1Y (Max 4): < 1 -> 4, 1-2 -> 2, > 2 -> 1
    if (v.peg != null) {
        if (v.peg < 1) valuation += 4;
        else if (v.peg <= 2) valuation += 2;
        else valuation += 1;
    } else valuation += 1;

    // PEG 3Y (Max 3): < 1 -> 3, 1-2 -> 2, > 2 -> 1
    if (v.peg3y != null) {
        if (v.peg3y < 1) valuation += 3;
        else if (v.peg3y <= 2) valuation += 2;
        else valuation += 1;
    } else valuation += 1;

    // EV/EBITDA (Max 4): < 12 -> 4, 12-20 -> 2, > 20 -> 1
    if (v.evToEbitda != null) {
        if (v.evToEbitda < 12) valuation += 4;
        else if (v.evToEbitda <= 20) valuation += 2;
        else valuation += 1;
    } else valuation += 1;

    // MarketCap/Sales (Max 3): < 3 -> 3, 3-6 -> 2, > 6 -> 1
    if (v.marketCapToSales != null) {
        if (v.marketCapToSales < 3) valuation += 3;
        else if (v.marketCapToSales <= 6) valuation += 2;
        else valuation += 1;
    } else valuation += 1;

    // --- Growth (Max 27) ---
    // Sales CAGR 3Y: >18->14, 10-18->10, 5-10->5, <5->2
    const sales3y = g.sales?.cagr3y;
    if (sales3y != null) {
        if (sales3y > 18) growth += 14;
        else if (sales3y >= 10) growth += 10;
        else if (sales3y >= 5) growth += 5;
        else growth += 2;
    } else growth += 2;

    // Profit CAGR 3Y: >18->13, 10-18->9, 5-10->4, <5->2
    const prof3y = g.profit?.cagr3y;
    if (prof3y != null) {
        if (prof3y > 18) growth += 13;
        else if (prof3y >= 10) growth += 9;
        else if (prof3y >= 5) growth += 4;
        else growth += 2;
    } else growth += 2;

    // --- Profitability (Max 18) ---
    // EBITDA Margin (Max 6): >25->6, 15-25->4, <15->2
    if (p.ebitdaMargin != null) {
        if (p.ebitdaMargin > 25) profitability += 6;
        else if (p.ebitdaMargin >= 15) profitability += 4;
        else profitability += 2;
    } else profitability += 2;

    // OPM (Max 6): >18->6, 10-18->4, <10->2
    if (p.opm != null) {
        if (p.opm > 18) profitability += 6;
        else if (p.opm >= 10) profitability += 4;
        else profitability += 2;
    } else profitability += 2;

    // NPM (Max 6): >12->6, 6-12->4, <6->2
    if (p.npm != null) {
        if (p.npm > 12) profitability += 6;
        else if (p.npm >= 6) profitability += 4;
        else profitability += 2;
    } else profitability += 2;

    // --- Capital Efficiency (Max 25) ---
    // ROE (Max 10): >20->10, 15-20->7, 10-15->4, <10->1
    if (ce.roe != null) {
        if (ce.roe > 20) capitalEfficiency += 10;
        else if (ce.roe >= 15) capitalEfficiency += 7;
        else if (ce.roe >= 10) capitalEfficiency += 4;
        else capitalEfficiency += 1;
    } else capitalEfficiency += 1;

    // ROCE (Max 10): >20->10, 15-20->7, 10-15->4, <10->1
    if (ce.roce != null) {
        if (ce.roce > 20) capitalEfficiency += 10;
        else if (ce.roce >= 15) capitalEfficiency += 7;
        else if (ce.roce >= 10) capitalEfficiency += 4;
        else capitalEfficiency += 1;
    } else capitalEfficiency += 1;

    // CFO/EBITDA (Max 5): >0.9->5, 0.7-0.9->3, <0.7->1
    if (ce.cfoToEbitda != null) {
        if (ce.cfoToEbitda > 0.9) capitalEfficiency += 5;
        else if (ce.cfoToEbitda >= 0.7) capitalEfficiency += 3;
        else capitalEfficiency += 1;
    } else capitalEfficiency += 1;
    
    // --- Balance Sheet (Max 12) ---
    // D/E: <0.3->12, 0.3-0.7->9, 0.7-1.5->5, >1.5->2
    if (bs.debtToEquity != null) {
        if (bs.debtToEquity < 0.3) balanceSheet += 12;
        else if (bs.debtToEquity <= 0.7) balanceSheet += 9;
        else if (bs.debtToEquity <= 1.5) balanceSheet += 5;
        else balanceSheet += 2;
    } else balanceSheet += 2;

    const totalScore = valuation + growth + profitability + capitalEfficiency + balanceSheet;

    let classification = "Avoid";
    if (totalScore >= 85) classification = "Elite Compounder";
    else if (totalScore >= 70) classification = "Strong Compounder";
    else if (totalScore >= 55) classification = "Emerging Compounder";
    else if (totalScore >= 40) classification = "Average Business";

    return {
        total: totalScore,
        classification,
        breakdown: {
            valuation,
            growth,
            profitability,
            capitalEfficiency,
            balanceSheet
        }
    };
}

module.exports = { calculateCompounderScore };
