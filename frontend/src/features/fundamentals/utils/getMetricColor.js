/**
 * Color utility for fundamental metrics.
 *
 * India-adjusted thresholds aligned with:
 *   - Nominal GDP growth ~10–12% (growth benchmarks)
 *   - Compounder identification (capital efficiency)
 *   - Sector-variable margins (profitability)
 *
 * Returns CSS color string: green, amber, red, or neutral gray.
 */

const COLORS = {
    green: '#22c55e',
    amber: '#f59e0b',
    red: '#ef4444',
    lightRed: '#f87171',
    neutral: '#5a5a6e',
};

// ─── Growth (Sales YoY/CAGR, Profit YoY/CAGR) ───────────────
// India nominal GDP ~10–12%, so >15% = outperforming
export function getGrowthColor(value) {
    if (value == null) return COLORS.neutral;
    if (value > 15) return COLORS.green;
    if (value >= 8) return COLORS.amber;
    if (value >= 0) return COLORS.lightRed;
    return COLORS.red;
}

// ─── EBITDA Margin ────────────────────────────────────────────
export function getEbitdaMarginColor(value) {
    if (value == null) return COLORS.neutral;
    if (value > 25) return COLORS.green;
    if (value >= 15) return COLORS.amber;
    return COLORS.red;
}

// ─── OPM (Operating Profit Margin) ───────────────────────────
export function getOpmColor(value) {
    if (value == null) return COLORS.neutral;
    if (value > 18) return COLORS.green;
    if (value >= 10) return COLORS.amber;
    return COLORS.red;
}

// ─── NPM (Net Profit Margin) ─────────────────────────────────
export function getNpmColor(value) {
    if (value == null) return COLORS.neutral;
    if (value > 12) return COLORS.green;
    if (value >= 6) return COLORS.amber;
    return COLORS.red;
}

// ─── ROE ──────────────────────────────────────────────────────
export function getRoeColor(value) {
    if (value == null) return COLORS.neutral;
    if (value > 20) return COLORS.green;
    if (value >= 12) return COLORS.amber;
    return COLORS.red;
}

// ─── ROCE ─────────────────────────────────────────────────────
export function getRoceColor(value) {
    if (value == null) return COLORS.neutral;
    if (value > 20) return COLORS.green;
    if (value >= 12) return COLORS.amber;
    return COLORS.red;
}

// ─── CFO / EBITDA (cash conversion) ──────────────────────────
export function getCfoEbitdaColor(value) {
    if (value == null) return COLORS.neutral;
    if (value > 0.9) return COLORS.green;
    if (value >= 0.7) return COLORS.amber;
    return COLORS.red;
}

// ─── Valuation helpers ───────────────────────────────────────
export function getPeColor(value) {
    if (value == null) return COLORS.neutral;
    if (value < 25) return COLORS.green;
    if (value <= 45) return COLORS.amber;
    return COLORS.red;
}

export function getPegColor(value) {
    if (value == null) return COLORS.neutral;
    if (value < 1.2) return COLORS.green;
    if (value <= 2.2) return COLORS.amber;
    return COLORS.red;
}

// ─── EV / EBITDA ──────────────────────────────────────────────
export function getEvEbitdaColor(value) {
    if (value == null) return COLORS.neutral;
    if (value < 8) return COLORS.amber;
    if (value <= 25) return COLORS.green;
    if (value <= 35) return COLORS.amber;
    return COLORS.red;
}

// ─── Market Cap / Sales ───────────────────────────────────────
export function getMarketCapToSalesColor(value) {
    if (value == null) return COLORS.neutral;
    // For Indian compounders:
    // < 3 is excellent
    // 3 - 8 is typical/acceptable for high growth
    // > 8 is significantly stretched unless software/platform
    if (value < 3) return COLORS.green;
    if (value <= 8) return COLORS.amber;
    return COLORS.red;
}

// ─── Debt/Equity ─────────────────────────────────────────────
export function getDebtEquityColor(value) {
    if (value == null) return COLORS.neutral;
    if (value < 0.5) return COLORS.green;
    if (value <= 1) return COLORS.amber;
    return COLORS.red;
}

export { COLORS };
