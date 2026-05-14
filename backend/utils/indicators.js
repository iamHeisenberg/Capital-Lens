'use strict';

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Linear regression slope over an array of numbers.
 * Returns 0 if array has fewer than 2 points or zero variance in x.
 * Used for OBV divergence detection.
 */
function linearRegressionSlope(values) {
    const n = values.length;
    if (n < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / n;
    const xMid = (n - 1) / 2;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        const dx = i - xMid;
        num += dx * (values[i] - mean);
        den += dx * dx;
    }
    return den === 0 ? 0 : num / den;
}

// ── OBV ───────────────────────────────────────────────────────────────────────

/**
 * Computes On-Balance Volume for the given close/volume arrays.
 *
 * Rules:
 *   Close > PrevClose  → OBV += volume
 *   Close < PrevClose  → OBV -= volume
 *   Close = PrevClose  → OBV unchanged
 *   Volume null/NaN    → treated as 0 (OBV unchanged for that day)
 *
 * Edge cases:
 *   - Arrays of different lengths → returns []
 *   - All volumes null/zero       → OBV stays at 0 the whole time (valid, neutral)
 *   - First day                   → OBV = 0 (no previous close to compare)
 *
 * @param {(number|null)[]} closes
 * @param {(number|null)[]} volumes
 * @returns {number[]} OBV series, same length as inputs (starts at 0)
 */
function computeOBV(closes, volumes) {
    if (!Array.isArray(closes) || !Array.isArray(volumes)) return [];
    if (closes.length !== volumes.length) return [];
    if (closes.length === 0) return [];

    const obv = new Array(closes.length).fill(0);
    // Day 0: no previous close, OBV = 0 by convention
    for (let i = 1; i < closes.length; i++) {
        const vol  = (volumes[i] != null && isFinite(volumes[i]) && volumes[i] > 0)
                   ? volumes[i] : 0;
        const prev = closes[i - 1];
        const curr = closes[i];

        if (curr == null || prev == null || !isFinite(curr) || !isFinite(prev)) {
            // Price data unavailable — carry forward
            obv[i] = obv[i - 1];
        } else if (curr > prev) {
            obv[i] = obv[i - 1] + vol;
        } else if (curr < prev) {
            obv[i] = obv[i - 1] - vol;
        } else {
            // Unchanged price → OBV unchanged
            obv[i] = obv[i - 1];
        }
    }
    return obv;
}

/**
 * Derives an OBV signal by comparing the linear regression slope of OBV
 * vs the slope of price over the last `lookback` days.
 *
 * A divergence is only flagged when both slopes exceed a noise threshold
 * (ε = 0.001 × mean of the values) to avoid false signals on low-volume stocks.
 *
 * Signals:
 *   'BullishDivergence'  — OBV rising while price flat/falling (accumulation)
 *   'BearishDivergence'  — OBV falling while price flat/rising (distribution)
 *   'Confirmed'          — OBV and price moving in the same direction
 *   'Neutral'            — Slopes too close to zero to be meaningful
 *   'InsufficientData'   — Fewer than lookback data points available
 *
 * @param {number[]}       obvSeries
 * @param {number[]}       closes
 * @param {number}         [lookback=20]
 * @returns {{ signal: string, slopeOBV: number, slopePrice: number }}
 */
function computeOBVSignal(obvSeries, closes, lookback = 20) {
    const n = Math.min(obvSeries.length, closes.length);
    if (n < lookback) {
        return { signal: 'InsufficientData', slopeOBV: 0, slopePrice: 0 };
    }

    const recentOBV   = obvSeries.slice(-lookback);
    const recentPrice = closes.slice(-lookback);

    // Ensure no nulls in the lookback window
    const validPairs = recentOBV
        .map((o, i) => ({ o, p: recentPrice[i] }))
        .filter(({ o, p }) => o != null && p != null && isFinite(o) && isFinite(p));

    if (validPairs.length < lookback * 0.75) {
        // Too many gaps in the lookback window — don't make a claim
        return { signal: 'Neutral', slopeOBV: 0, slopePrice: 0 };
    }

    const slopeOBV   = linearRegressionSlope(validPairs.map(({ o }) => o));
    const slopePrice = linearRegressionSlope(validPairs.map(({ p }) => p));

    // Noise thresholds: proportional to average magnitude of each series
    const meanOBV   = Math.abs(validPairs.reduce((s, { o }) => s + o, 0) / validPairs.length) || 1;
    const meanPrice = Math.abs(validPairs.reduce((s, { p }) => s + p, 0) / validPairs.length) || 1;
    const epsilonOBV   = 0.001 * meanOBV;
    const epsilonPrice = 0.001 * meanPrice;

    const obvRising   = slopeOBV   >  epsilonOBV;
    const obvFalling  = slopeOBV   < -epsilonOBV;
    const priceRising = slopePrice >  epsilonPrice;
    const priceFalling= slopePrice < -epsilonPrice;

    if (obvRising && priceFalling) return { signal: 'BullishDivergence', slopeOBV, slopePrice };
    if (obvFalling && priceRising) return { signal: 'BearishDivergence', slopeOBV, slopePrice };
    if ((obvRising && priceRising) || (obvFalling && priceFalling)) {
        return { signal: 'Confirmed', slopeOBV, slopePrice };
    }
    return { signal: 'Neutral', slopeOBV, slopePrice };
}

// ── RSI ───────────────────────────────────────────────────────────────────────

/**
 * Wilder's Relative Strength Index.
 *
 * Algorithm:
 *   1. Seed avgGain / avgLoss with a simple average over the first `period` deltas.
 *   2. Apply Wilder's smoothing for every subsequent bar:
 *        avgGain = (avgGain × (period-1) + gain) / period
 *
 * Edge cases:
 *   avgGain = 0 AND avgLoss = 0  → RSI = 50 (flat price, no movement)
 *   avgLoss = 0                  → RSI = 100  (only up-days)
 *   avgGain = 0                  → RSI = 0    (only down-days, 100 - 100/(1+0))
 *   null / NaN close for a bar   → treated as gain=0, loss=0 (no-change day)
 *
 * @param {(number|null)[]} closes
 * @param {number}          [period=14]
 * @returns {(number|null)[]}  Same length as closes.
 *                             Indices 0 … period-1 are null (warm-up).
 *                             Index period onwards holds a value in [0, 100].
 */
function computeRSI(closes, period = 14) {
    // Guard: need at least period+1 data points to produce one value
    if (!Array.isArray(closes) || closes.length < period + 1) {
        return new Array(closes?.length || 0).fill(null);
    }

    const rsi = new Array(closes.length).fill(null);

    // ── Step 1: seed with simple average of first `period` deltas ─────────────
    let sumGain = 0;
    let sumLoss = 0;
    for (let i = 1; i <= period; i++) {
        const prev  = closes[i - 1];
        const curr  = closes[i];
        if (curr == null || prev == null || !isFinite(curr) || !isFinite(prev)) continue;
        const delta = curr - prev;
        if (delta > 0) sumGain += delta;
        else if (delta < 0) sumLoss += Math.abs(delta);
    }
    let avgGain = sumGain / period;
    let avgLoss = sumLoss / period;
    rsi[period] = wilderRSI(avgGain, avgLoss);

    // ── Step 2: Wilder's smoothed average for all subsequent bars ─────────────
    for (let i = period + 1; i < closes.length; i++) {
        const prev  = closes[i - 1];
        const curr  = closes[i];
        let gain = 0;
        let loss = 0;
        if (curr != null && prev != null && isFinite(curr) && isFinite(prev)) {
            const delta = curr - prev;
            if (delta > 0) gain = delta;
            else if (delta < 0) loss = Math.abs(delta);
        }
        // Null/gap bars: gain=loss=0 — averages decay toward each other naturally
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        rsi[i]  = wilderRSI(avgGain, avgLoss);
    }

    return rsi;
}

/** Converts avgGain / avgLoss into an RSI value [0, 100]. */
function wilderRSI(avgGain, avgLoss) {
    if (avgGain === 0 && avgLoss === 0) return 50; // No price movement — neutral
    if (avgLoss === 0) return 100;                  // All gains
    return 100 - (100 / (1 + avgGain / avgLoss));
}

// ── Rolling Moving Average ─────────────────────────────────────────────────────

/**
 * O(N) sliding-window rolling average.
 *
 * @param {number[]} prices  Array of close prices (no nulls expected).
 * @param {number}   period  Window length (e.g. 50 or 200).
 * @returns {(number|null)[]}  Same length as prices.
 *                             Indices 0 … period-2 are null (insufficient history).
 *                             Index period-1 onwards holds the moving average.
 *
 * Used by: priceService.js (DMA50/200 for stocks)
 *          sectorService.js (DMA50/200 for sector/index charts)
 */
function computeRollingMA(prices, period) {
    const result = new Array(prices.length).fill(null);
    let sum = 0;
    for (let i = 0; i < prices.length; i++) {
        sum += prices[i];
        if (i >= period) sum -= prices[i - period];
        if (i >= period - 1) result[i] = sum / period;
    }
    return result;
}

module.exports = {
    computeOBV,
    computeOBVSignal,
    computeRSI,
    computeRollingMA,
};
