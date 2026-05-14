/**
 * Symbol Validation Probe — Step 1 of Markets page implementation.
 *
 * Tests every candidate NSE sector/index symbol against Yahoo Finance.
 * Uses identical fetch parameters and retry/timeout wrappers as production.
 *
 * Outputs:
 *   - Per-symbol result table (status, days, volume, latest date, latest close)
 *   - Draft sectors.json for confirmed working symbols
 *
 * Run: node scripts/probeSymbols.js
 */
'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const yahooFinance  = require('../utils/yahooFinanceClient');
const { withRetry, withTimeout } = require('../utils/withRetry');
const Bottleneck    = require('bottleneck');

// ── Candidate symbols ──────────────────────────────────────────────────────────
// ── Alternative candidates for the 7 symbols that failed first probe ──────────
const CANDIDATES = [
    // Nifty Next 50 alternatives
    { symbol: '^NSEIJR',          name: 'Nifty Next 50 (^NSEIJR)',           group: 'benchmark' },
    { symbol: 'NIFTYNXT50.NS',    name: 'Nifty Next 50 (NIFTYNXT50.NS)',     group: 'benchmark' },

    // Nifty 500 alternatives
    { symbol: '^CNX500',          name: 'Nifty 500 (^CNX500)',               group: 'benchmark' },
    { symbol: 'NIFTY500.NS',      name: 'Nifty 500 (NIFTY500.NS)',           group: 'benchmark' },

    // Nifty Midcap 150 alternatives
    { symbol: 'NIFTYMIDCAP150.NS',name: 'Nifty Midcap 150 (.NS format)',     group: 'benchmark' },

    // Nifty Smallcap 250 alternatives
    { symbol: 'NIFTYSMLCAP250.NS',name: 'Nifty Smallcap 250 (.NS format)',   group: 'benchmark' },

    // Nifty Financial Services alternatives
    { symbol: '^CNXFIN',          name: 'Nifty Fin Services (^CNXFIN)',      group: 'sector' },
    { symbol: 'NIFTYFIN.NS',      name: 'Nifty Fin Services (NIFTYFIN.NS)', group: 'sector' },

    // Nifty Healthcare — search says not on Yahoo Finance, test anyway
    { symbol: '^CNXHEALTHCARE',   name: 'Nifty Healthcare (^CNXHEALTHCARE)', group: 'sector' },
    { symbol: 'NIFTYHEALTH.NS',   name: 'Nifty Healthcare (.NS format)',     group: 'sector' },

    // Nifty Consumption — search says not on Yahoo Finance, test anyway
    { symbol: '^CNXCONSUMPTION',  name: 'Nifty Consumption (^CNXCONSUMPTION)', group: 'sector' },
    { symbol: 'NIFTYCONS.NS',     name: 'Nifty Consumption (.NS format)',    group: 'sector' },
];

// ── Rate limiter: same as seeder (3 concurrent, 500ms apart) ──────────────────
const limiter = new Bottleneck({ maxConcurrent: 3, minTime: 500 });

// ── Date range: 2 years (same as production) ──────────────────────────────────
const endDate   = new Date();
const startDate = new Date();
startDate.setFullYear(startDate.getFullYear() - 2);

// ── Probe a single symbol ──────────────────────────────────────────────────────
async function probe(entry) {
    const { symbol, name, group } = entry;
    try {
        const result = await withRetry(
            () => withTimeout(
                () => yahooFinance.historical(symbol, {
                    period1:  startDate,
                    period2:  endDate,
                    interval: '1d',
                }),
                15000,
                symbol
            ),
            { label: symbol }
        );

        if (!result || result.length === 0) {
            return { symbol, name, group, ok: false, reason: 'empty result' };
        }

        // Valid rows: non-null close
        const valid = result.filter(
            (d) => d.close != null && isFinite(d.close)
        );

        if (valid.length === 0) {
            return { symbol, name, group, ok: false, reason: 'no valid close prices' };
        }

        // Volume check: how many rows have non-null, positive volume?
        const withVolume = valid.filter(
            (d) => d.volume != null && isFinite(d.volume) && d.volume > 0
        );
        const hasVolume = withVolume.length > valid.length * 0.5; // >50% rows have volume

        const latest    = valid[valid.length - 1];
        const latestDate= latest.date instanceof Date
            ? latest.date.toISOString().split('T')[0]
            : String(latest.date).split('T')[0];

        return {
            symbol,
            name,
            group,
            ok:          true,
            days:        valid.length,
            hasVolume,
            volumeDays:  withVolume.length,
            latestDate,
            latestClose: latest.close.toFixed(2),
        };
    } catch (err) {
        return { symbol, name, group, ok: false, reason: err.message?.slice(0, 60) };
    }
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n🔍  NSE Sector Symbol Validation Probe');
    console.log(`    Candidates : ${CANDIDATES.length}`);
    console.log(`    Date range : ${startDate.toISOString().split('T')[0]} → ${endDate.toISOString().split('T')[0]}`);
    console.log(`    Started    : ${new Date().toISOString()}\n`);

    const jobs    = CANDIDATES.map((c) => limiter.schedule(() => probe(c)));
    const results = await Promise.all(jobs);

    // ── Print results table ────────────────────────────────────────────────────
    const pass = results.filter((r) => r.ok);
    const fail = results.filter((r) => !r.ok);

    console.log('─'.repeat(90));
    console.log(
        'STATUS  GROUP       DAYS   VOL?   LATEST DATE   LATEST CLOSE   SYMBOL              NAME'
    );
    console.log('─'.repeat(90));

    // Benchmarks first, then sectors
    const sorted = [
        ...results.filter((r) => r.group === 'benchmark'),
        ...results.filter((r) => r.group === 'sector'),
    ];

    for (const r of sorted) {
        if (r.ok) {
            const vol  = r.hasVolume ? '✅ yes' : '❌ no ';
            const sym  = r.symbol.padEnd(20);
            const name = r.name.padEnd(30);
            console.log(
                `✅  pass  ${r.group.padEnd(10)} ${String(r.days).padStart(4)}   ${vol}  ${r.latestDate}    ${String(r.latestClose).padStart(10)}   ${sym} ${name}`
            );
        } else {
            const sym  = r.symbol.padEnd(20);
            const name = r.name.padEnd(30);
            console.log(
                `❌  FAIL  ${r.group.padEnd(10)}                                                      ${sym} ${name}   reason: ${r.reason}`
            );
        }
    }

    console.log('─'.repeat(90));
    console.log(`\n  Passed : ${pass.length}/${CANDIDATES.length}`);
    console.log(`  Failed : ${fail.length}/${CANDIDATES.length}`);

    if (fail.length > 0) {
        console.log('\n  Failed symbols:');
        fail.forEach((r) => console.log(`    ✗  ${r.symbol.padEnd(22)} ${r.name}  — ${r.reason}`));
    }

    // ── Generate sectors.json from passing symbols ─────────────────────────────
    const sectorJson = pass.map(({ symbol, name, group, hasVolume }) => ({
        symbol,
        name,
        group,
        hasVolume, // baked in — sectorService can skip volume computation for known-false
    }));

    console.log('\n─'.repeat(90));
    console.log('\n📄  Draft sectors.json (copy to frontend/src/data/sectors.json):\n');
    console.log(JSON.stringify(sectorJson, null, 2));
    console.log('\n✅  Probe complete.\n');
}

main().catch((err) => {
    console.error('Probe crashed:', err);
    process.exit(1);
});
