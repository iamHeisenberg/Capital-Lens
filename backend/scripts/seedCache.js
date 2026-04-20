/**
 * Cache Seeder — runs from LOCAL machine (where Yahoo Finance is not IP-blocked).
 *
 * Problem: Render's datacenter IP is rate-limited by Yahoo Finance, so every
 * cold-start request for un-cached data returns 429. Local fetches work fine.
 *
 * Solution: Run this script locally to populate Redis (shared Upstash instance)
 * with price + fundamentals for all tickers. Production then serves from Redis
 * without ever contacting Yahoo Finance.
 *
 * Usage:
 *   node backend/scripts/seedCache.js              — seeds all 482 tickers
 *   node backend/scripts/seedCache.js --limit 50   — seeds first 50 tickers
 *   node backend/scripts/seedCache.js --type price  — price only
 *   node backend/scripts/seedCache.js --type fundamentals — fundamentals only
 *
 * Duration: ~482 tickers × 2 calls × ~1s each ÷ 3 concurrent = ~5-6 minutes
 *
 * Re-run schedule:
 *   - Fundamentals: every 7 days (TTL = 7 days)
 *   - Price: every 4 hours (TTL = 4h) — optional, price changes intraday
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Bottleneck = require('bottleneck');
const tickers = require('../../frontend/src/data/tickers.json');

// ── Parse CLI args ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const typeIdx  = args.indexOf('--type');
const LIMIT    = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : tickers.length;
const TYPE     = typeIdx  >= 0 ? args[typeIdx + 1] : 'all'; // 'price' | 'fundamentals' | 'all'

// ── Services (re-use production code so keys are identical) ────────────────────
const { getStockData }    = require('../services/priceService');
const { fetchFinancials } = require('../services/fundamentals/fetchFinancials');

// ── Concurrency limiter: 3 concurrent, 1.5s between jobs ──────────────────────
// Yahoo Finance allows ~3–5 concurrent requests from a non-server IP.
const limiter = new Bottleneck({
    maxConcurrent: 3,
    minTime: 500, // ms between job starts
});

const tickerList = tickers.slice(0, LIMIT).map((t) => t.symbol);
const total      = tickerList.length;
let   done       = 0;
let   ok         = 0;
let   failed     = 0;

const ctx = { correlationId: 'seeder', endpoint: 'seeder', method: 'SEED' };

console.log(`\n🌱  Cache Seeder`);
console.log(`   Tickers : ${total}`);
console.log(`   Type    : ${TYPE}`);
console.log(`   Redis   : ${process.env.UPSTASH_REDIS_REST_URL?.slice(0, 40)}...`);
console.log(`   Started : ${new Date().toISOString()}\n`);

async function seedTicker(symbol) {
    const errors = [];

    if (TYPE === 'all' || TYPE === 'price') {
        try {
            await getStockData(symbol, { ctx });
        } catch (err) {
            errors.push(`price: ${err.message}`);
        }
    }

    if (TYPE === 'all' || TYPE === 'fundamentals') {
        try {
            await fetchFinancials(symbol, ctx);
        } catch (err) {
            errors.push(`fundamentals: ${err.message}`);
        }
    }

    done++;
    const pct = ((done / total) * 100).toFixed(1);

    if (errors.length === 0) {
        ok++;
        process.stdout.write(`  ✅  [${done}/${total}] ${symbol.padEnd(18)} ${pct}%\n`);
    } else {
        failed++;
        process.stdout.write(`  ❌  [${done}/${total}] ${symbol.padEnd(18)} ${pct}% — ${errors.join(' | ')}\n`);
    }
}

async function main() {
    const jobs = tickerList.map((symbol) =>
        limiter.schedule(() => seedTicker(symbol))
    );

    await Promise.all(jobs);

    const elapsed = Math.round(Number(process.hrtime.bigint() / 1_000_000_000n));
    console.log(`\n─────────────────────────────────────────`);
    console.log(`✅  Done in ${elapsed}s`);
    console.log(`   Succeeded : ${ok}/${total}`);
    console.log(`   Failed    : ${failed}/${total}`);
    console.log(`─────────────────────────────────────────\n`);

    process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error('Seeder crashed:', err);
    process.exit(1);
});
