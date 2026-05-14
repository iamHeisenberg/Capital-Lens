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
 *   node backend/scripts/seedCache.js                    — seeds all 482 stock tickers
 *   node backend/scripts/seedCache.js --limit 50         — seeds first 50 tickers
 *   node backend/scripts/seedCache.js --type price       — stock price only
 *   node backend/scripts/seedCache.js --type fundamentals — stock fundamentals only
 *   node backend/scripts/seedCache.js --type sectors     — 15 sector/index symbols (NEW)
 *
 * Duration:
 *   Stocks  : ~482 tickers × 2 calls × ~1s each ÷ 3 concurrent = ~5-6 minutes
 *   Sectors : ~15 symbols × 1 call × ~1s each  ÷ 3 concurrent = ~10 seconds
 *
 * Re-run schedule:
 *   - Fundamentals : every 7 days  (TTL = 7 days)
 *   - Price        : every 4 hours (TTL = 4h)
 *   - Sectors      : every 4 hours (TTL = 4h) — same as price
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Bottleneck = require('bottleneck');
const tickers = require('../../frontend/src/data/tickers.json');

// ── Parse CLI args ─────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const limitIdx  = args.indexOf('--limit');
const typeIdx   = args.indexOf('--type');
const LIMIT     = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : tickers.length;
// Valid types: 'price' | 'fundamentals' | 'all' | 'sectors'
const TYPE      = typeIdx  >= 0 ? args[typeIdx + 1] : 'all';
// --refresh: bypass Redis read, force fresh Yahoo Finance fetch + re-cache
const REFRESH   = args.includes('--refresh');

// ── Services (re-use production code so cache keys are identical) ──────────────
const { getStockData }    = require('../services/priceService');
const { fetchFinancials } = require('../services/fundamentals/fetchFinancials');
const { getSectorData }   = require('../services/sectorService');

// ── Sector catalog ─────────────────────────────────────────────────────────────
const SECTORS = require('../../frontend/src/data/sectors.json');

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
if (TYPE === 'sectors') {
    console.log(`   Symbols : ${SECTORS.length} sector/index symbols`);
} else {
    console.log(`   Tickers : ${total}`);
}
console.log(`   Type    : ${TYPE}`);
console.log(`   Refresh : ${REFRESH ? 'YES — bypassing Redis cache' : 'no (cache hits will skip re-fetch)'}`);
console.log(`   Redis   : ${process.env.UPSTASH_REDIS_REST_URL?.slice(0, 40)}...`);
console.log(`   Started : ${new Date().toISOString()}\n`);

async function seedTicker(symbol) {
    const errors = [];

    if (TYPE === 'all' || TYPE === 'price') {
        try {
            await getStockData(symbol, { ctx, forceRefresh: REFRESH });
        } catch (err) {
            errors.push(`price: ${err.message}`);
        }
    }

    if (TYPE === 'all' || TYPE === 'fundamentals') {
        try {
            await fetchFinancials(symbol, ctx, REFRESH);
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

// ── Sector seeding ─────────────────────────────────────────────────────────────

let sectorDone = 0;
let sectorOk   = 0;
let sectorFail = 0;
const sectorTotal = SECTORS.length;

/**
 * Seed a single sector/index symbol into Redis.
 * Uses getSectorData which writes to the `sector:<SYMBOL>` cache key (4h TTL).
 */
async function seedSector(entry) {
    try {
        await getSectorData(entry.symbol, { ctx, meta: entry, forceRefresh: REFRESH });
        sectorDone++;
        sectorOk++;
        const pct = ((sectorDone / sectorTotal) * 100).toFixed(1);
        process.stdout.write(
            `  ✅  [${sectorDone}/${sectorTotal}] ${entry.symbol.padEnd(22)} ${entry.name.padEnd(20)} ${pct}%\n`
        );
    } catch (err) {
        sectorDone++;
        sectorFail++;
        const pct = ((sectorDone / sectorTotal) * 100).toFixed(1);
        process.stdout.write(
            `  ❌  [${sectorDone}/${sectorTotal}] ${entry.symbol.padEnd(22)} ${entry.name.padEnd(20)} ${pct}% — ${err.message}\n`
        );
    }
}

/**
 * Seed all 15 sector/index symbols in parallel (3 concurrent, 500ms apart).
 */
async function seedSectors() {
    console.log(`\n📊  Seeding ${sectorTotal} sector/index symbols...\n`);
    const jobs = SECTORS.map((entry) =>
        limiter.schedule(() => seedSector(entry))
    );
    await Promise.all(jobs);
}

// ── Main ────────────────────────────────────────────────────────────────────────

async function main() {
    // ── Sector-only mode ───────────────────────────────────────────────────────
    if (TYPE === 'sectors') {
        await seedSectors();

        const elapsed = Math.round(Number(process.hrtime.bigint() / 1_000_000_000n));
        console.log(`\n─────────────────────────────────────────`);
        console.log(`✅  Sectors done in ${elapsed}s`);
        console.log(`   Succeeded : ${sectorOk}/${sectorTotal}`);
        console.log(`   Failed    : ${sectorFail}/${sectorTotal}`);
        console.log(`─────────────────────────────────────────\n`);
        process.exit(sectorFail > 0 ? 1 : 0);
        return;
    }

    // ── Stock seeding (price / fundamentals / all) ─────────────────────────────
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
