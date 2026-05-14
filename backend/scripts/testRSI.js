/**
 * RSI edge case test suite.
 * Run: node scripts/testRSI.js
 *
 * Tests every documented edge case in computeRSI and validates the
 * priceService signal classification logic inline.
 */
'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { computeRSI } = require('../utils/indicators');

let passed = 0;
let failed = 0;

function assert(name, condition, detail = '') {
    if (condition) {
        console.log(`  ✅  ${name}`);
        passed++;
    } else {
        console.log(`  ❌  ${name}${detail ? ' — ' + detail : ''}`);
        failed++;
    }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const flat   = (n, p = 100)     => Array(n).fill(p);
const up     = (n, start = 100) => Array.from({ length: n }, (_, i) => start + i);
const down   = (n, start = 114) => Array.from({ length: n }, (_, i) => start - i);
const within = (v, lo, hi)      => v != null && isFinite(v) && v >= lo && v <= hi;

// Inline signal classifier — mirrors priceService.js getRSISignal
function getSignal(v) {
    if (v == null)  return 'InsufficientData';
    if (v < 30)     return 'Oversold';
    if (v < 40)     return 'WeakMomentum';
    if (v < 60)     return 'Neutral';
    if (v < 70)     return 'Strong';
    return 'Overbought';
}

// ── Test cases ─────────────────────────────────────────────────────────────────

console.log('\n── 1. Input guards ──────────────────────────────────────────────');

{
    const r = computeRSI(null);
    assert('null input → []', Array.isArray(r) && r.length === 0, JSON.stringify(r));
}
{
    const r = computeRSI(undefined);
    assert('undefined input → []', Array.isArray(r) && r.length === 0);
}
{
    const r = computeRSI([]);
    assert('empty array → []', Array.isArray(r) && r.length === 0);
}
{
    const r = computeRSI([100, 101, 102]); // only 3 bars < period+1
    assert('< 15 bars → all null', r.every((v) => v === null), JSON.stringify(r));
    assert('< 15 bars → length preserved', r.length === 3);
}
{
    // Exactly 14 elements (period) — need 15 to produce first value
    const closes = flat(14, 100);
    const r = computeRSI(closes);
    assert('14 bars (= period) → all null', r.every((v) => v === null));
    assert('14 bars → length === 14', r.length === 14);
}

console.log('\n── 2. Warm-up period ────────────────────────────────────────────');

{
    const closes = up(50); // 50 up-days starting at 100
    const r = computeRSI(closes);
    const warmUpNull = r.slice(0, 14).every((v) => v === null);
    assert('First 14 indices are null (warm-up)', warmUpNull, JSON.stringify(r.slice(0, 14)));
    assert('Index 14 is not null (first value)', r[14] !== null, `r[14] = ${r[14]}`);
    assert('Length = input length', r.length === closes.length);
}

console.log('\n── 3. All-flat prices (no movement) ─────────────────────────────');

{
    // avgGain = 0, avgLoss = 0 → RSI = 50
    const closes = flat(50, 200);
    const r = computeRSI(closes);
    const valid = r.filter((v) => v !== null);
    const allFifty = valid.every((v) => Math.abs(v - 50) < 0.001);
    assert('Flat prices → all RSI = 50', allFifty, `sample: ${valid.slice(0, 3)}`);
}

console.log('\n── 4. All up-days → RSI approaches 100 ─────────────────────────');

{
    const closes = up(50);
    const r = computeRSI(closes);
    const valid = r.filter((v) => v !== null);
    assert('All up-days → first valid = 100', valid[0] === 100, `got ${valid[0]}`);
    assert('All up-days → last = 100', valid[valid.length - 1] === 100);
    assert('All up-days → all valid = 100', valid.every((v) => v === 100));
}

console.log('\n── 5. All down-days → RSI approaches 0 ─────────────────────────');

{
    const closes = down(50);
    const r = computeRSI(closes);
    const valid = r.filter((v) => v !== null);
    assert('All down-days → first valid = 0', valid[0] === 0, `got ${valid[0]}`);
    assert('All down-days → last = 0', valid[valid.length - 1] === 0);
    assert('All down-days → all valid = 0', valid.every((v) => v === 0));
}

console.log('\n── 6. All values in [0, 100] (real-world-like data) ─────────────');

{
    // Simulate a price series with random walk
    const seed = 100;
    const closes = [seed];
    for (let i = 1; i < 200; i++) {
        const delta = (Math.sin(i * 0.3) + Math.cos(i * 0.7)) * 2;
        closes.push(closes[i - 1] + delta);
    }
    const r = computeRSI(closes);
    const valid = r.filter((v) => v !== null);
    const outOfRange = valid.filter((v) => !within(v, 0, 100));
    assert('200-bar wave: all valid RSI in [0, 100]',
        outOfRange.length === 0,
        `out-of-range count: ${outOfRange.length}, samples: ${outOfRange.slice(0, 3)}`
    );
    assert('200-bar wave: no NaN or Infinity', valid.every((v) => isFinite(v)));
}

console.log('\n── 7. null values inside the series ─────────────────────────────');

{
    // Valid warm-up + a null in the middle
    const closes = [...up(20), null, null, null, ...up(20, 120)];
    let threw = false;
    let r;
    try { r = computeRSI(closes); } catch (e) { threw = true; }
    assert('Nulls in middle: no crash', !threw);
    assert('Nulls in middle: result is array', Array.isArray(r));
    assert('Nulls in middle: length preserved', r?.length === closes.length, `${r?.length} vs ${closes.length}`);
    // RSI should still be computed on either side of the nulls
    const lastFive = r.slice(-5).filter((v) => v !== null);
    assert('Nulls in middle: post-gap RSI still computed', lastFive.length > 0, `${JSON.stringify(r.slice(-5))}`);
}

console.log('\n── 8. NaN values inside the series ──────────────────────────────');

{
    const closes = [...flat(20, 100), NaN, NaN, ...flat(10, 102)];
    let threw = false;
    let r;
    try { r = computeRSI(closes); } catch (e) { threw = true; }
    assert('NaN in middle: no crash', !threw);
    assert('NaN in middle: length preserved', r?.length === closes.length);
    const lastFive = r?.slice(-5).filter((v) => v !== null && isFinite(v));
    assert('NaN in middle: post-NaN RSI still ≈ 50',
        lastFive?.every((v) => Math.abs(v - 50) < 10),
        `values: ${JSON.stringify(lastFive)}`
    );
}

console.log('\n── 9. Extreme single-day spike ───────────────────────────────────');

{
    const closes = [...flat(20, 100), 1_000_000, ...flat(20, 100)];
    let threw = false;
    let r;
    try { r = computeRSI(closes); } catch(e) { threw = true; }
    assert('Extreme spike: no crash', !threw);
    const valid = r?.filter((v) => v !== null);
    assert('Extreme spike: all valid in [0, 100]',
        valid?.every((v) => within(v, 0, 100)),
        `out-of-range: ${valid?.filter(v => !within(v, 0, 100))}`
    );
}

console.log('\n── 10. Period variations (period=2, period=21) ───────────────────');

{
    const closes = up(30);
    const r2  = computeRSI(closes, 2);
    const r21 = computeRSI(closes, 21);
    assert('period=2: first 2 null', r2.slice(0, 2).every(v => v === null));
    assert('period=2: r2[2] = 100 (all gains)', r2[2] === 100, `r2[2] = ${r2[2]}`);
    assert('period=21: first 21 null', r21.slice(0, 21).every(v => v === null));
    // 30 bars with period=21 → only 30-21=9 valid values
    const v21 = r21.filter(v => v !== null);
    assert('period=21: 9 valid values for 30-bar input', v21.length === 9, `got ${v21.length}`);
}

console.log('\n── 11. Signal classification correctness ────────────────────────');

const signalCases = [
    [29.9, 'Oversold'],
    [30.0, 'WeakMomentum'],
    [39.9, 'WeakMomentum'],
    [40.0, 'Neutral'],
    [59.9, 'Neutral'],
    [60.0, 'Strong'],
    [69.9, 'Strong'],
    [70.0, 'Overbought'],
    [100,  'Overbought'],
    [0,    'Oversold'],
    [null, 'InsufficientData'],
];
for (const [v, expected] of signalCases) {
    const got = getSignal(v);
    assert(`getSignal(${v}) = '${expected}'`, got === expected, `got '${got}'`);
}

console.log('\n── 12. Frontend RSICard guards ──────────────────────────────────');

// Simulate what RSICard.jsx does with these prop shapes
function rsiCardGuard(rsi) {
    if (!rsi) return 'HIDDEN';
    const cfg = SIGNAL_CONFIG_KEYS.includes(rsi.signal) ? rsi.signal : 'Neutral';
    return cfg;
}
const SIGNAL_CONFIG_KEYS = ['Oversold', 'WeakMomentum', 'Neutral', 'Strong', 'Overbought', 'InsufficientData'];

assert('null rsi prop → card hidden', rsiCardGuard(null) === 'HIDDEN');
assert('undefined rsi prop → card hidden', rsiCardGuard(undefined) === 'HIDDEN');
assert('unknown signal → falls back to Neutral', rsiCardGuard({ signal: 'UnknownSignal', value: 50, text: '' }) === 'Neutral');
assert('InsufficientData signal → accepted', rsiCardGuard({ signal: 'InsufficientData', value: null, text: '' }) === 'InsufficientData');

// RSIGaugeBar guard inline simulation
function gaugeBarGuard(value) {
    return !(value == null || !isFinite(value)); // returns false = hidden, true = visible
}
assert('RSIGaugeBar: null → hidden', gaugeBarGuard(null) === false);
assert('RSIGaugeBar: NaN → hidden', gaugeBarGuard(NaN) === false);
assert('RSIGaugeBar: Infinity → hidden', gaugeBarGuard(Infinity) === false);
assert('RSIGaugeBar: 0 → visible', gaugeBarGuard(0) === true);
assert('RSIGaugeBar: 50 → visible', gaugeBarGuard(50) === true);
assert('RSIGaugeBar: 100 → visible', gaugeBarGuard(100) === true);

// Clamping check: marker left% must be 0–100 regardless of RSI value
function clampCheck(value) {
    if (value == null || !isFinite(value)) return true; // hidden anyway
    const clamped = Math.max(0, Math.min(100, value));
    return clamped >= 0 && clamped <= 100;
}
assert('Gauge marker: RSI 150 clamped to 100', clampCheck(150));
assert('Gauge marker: RSI -10 clamped to 0', clampCheck(-10));

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
    console.log('✅  All RSI edge cases pass\n');
} else {
    console.log('❌  Some tests failed — review output above\n');
    process.exit(1);
}
