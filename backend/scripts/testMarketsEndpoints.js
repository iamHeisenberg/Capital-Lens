/**
 * Live endpoint test for /api/markets and /api/markets/:symbol
 * Run: node scripts/testMarketsEndpoints.js
 */
'use strict';
const http = require('http');

function get(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:5000${path}`, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
                catch (e) { resolve({ status: res.statusCode, data: body }); }
            });
        }).on('error', reject);
    });
}

async function run() {
    let pass = 0; let fail = 0;
    const assert = (label, cond, detail = '') => {
        if (cond) { console.log(`  ✅ ${label}`); pass++; }
        else       { console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`); fail++; }
    };

    // ── Test 1: GET /api/markets ───────────────────────────────────────────────
    console.log('\n── GET /api/markets ────────────────────────────────────────────');
    const list = await get('/api/markets');

    assert('HTTP 200', list.status === 200, `got ${list.status}`);
    assert('has benchmarks array', Array.isArray(list.data.benchmarks));
    assert('has sectors array',    Array.isArray(list.data.sectors));
    assert('benchmarks count >= 3', list.data.benchmarks?.length >= 3, `got ${list.data.benchmarks?.length}`);
    assert('sectors count >= 10',   list.data.sectors?.length >= 10,   `got ${list.data.sectors?.length}`);

    // Spot-check Nifty 50 summary shape
    const n50 = list.data.benchmarks?.find((b) => b.symbol === '^NSEI');
    assert('Nifty 50 present in benchmarks', !!n50);
    assert('Nifty 50 has latestClose',        typeof n50?.latestClose === 'number');
    assert('Nifty 50 has trend',              typeof n50?.trend === 'string');
    assert('Nifty 50 has returns.r1y',        typeof n50?.returns?.r1y === 'number');
    assert('Nifty 50 has returns.r3m',        typeof n50?.returns?.r3m === 'number');
    assert('Nifty 50 has NO historicalCloses (summary only)', !('historicalCloses' in (n50 ?? {})));
    assert('Nifty 50 has NO dma50Series (summary only)',      !('dma50Series'      in (n50 ?? {})));

    // Spot-check a sector
    const it = list.data.sectors?.find((s) => s.symbol === '^CNXIT');
    assert('Nifty IT present in sectors', !!it);
    assert('Nifty IT group = sector',     it?.group === 'sector');

    console.log('\n  Sample — Nifty 50 summary:');
    console.log('   ', JSON.stringify(n50, null, 2).replace(/\n/g, '\n   '));

    // ── Test 2: GET /api/markets/:symbol (valid) ───────────────────────────────
    console.log('\n── GET /api/markets/%5ENSEBANK (Nifty Bank, URL-encoded ^) ──────');
    const bank = await get('/api/markets/%5ENSEBANK');

    assert('HTTP 200', bank.status === 200, `got ${bank.status}`);
    assert('has symbol',            bank.data.symbol === '^NSEBANK');
    assert('has historicalCloses',  Array.isArray(bank.data.historicalCloses));
    assert('historicalCloses > 200',bank.data.historicalCloses?.length > 200);
    assert('has dma50Series',       Array.isArray(bank.data.dma50Series));
    assert('has dma200Series',      Array.isArray(bank.data.dma200Series));
    assert('has historicalDates',   Array.isArray(bank.data.historicalDates));
    assert('has trend',             typeof bank.data.trend === 'string');
    assert('has returns object',    typeof bank.data.returns === 'object');

    console.log(`\n  Nifty Bank: close=${bank.data.latestClose?.toFixed(2)}, trend=${bank.data.trend}, 1Y=${bank.data.returns?.r1y}%`);

    // ── Test 3: GET /api/markets/:symbol with .NS format ──────────────────────
    console.log('\n── GET /api/markets/NIFTYMIDCAP150.NS ──────────────────────────');
    const midcap = await get('/api/markets/NIFTYMIDCAP150.NS');

    assert('HTTP 200',         midcap.status === 200, `got ${midcap.status}`);
    assert('name = Nifty Midcap 150', midcap.data.name === 'Nifty Midcap 150');
    assert('group = benchmark',       midcap.data.group === 'benchmark');
    assert('hasVolume = false',       midcap.data.hasVolume === false);
    assert('historicalVolumes null',  midcap.data.historicalVolumes === null);

    // ── Test 4: GET /api/markets/:symbol (invalid symbol) ─────────────────────
    console.log('\n── GET /api/markets/INVALID123 (should 404) ────────────────────');
    const bad = await get('/api/markets/INVALID123');

    assert('HTTP 404 for unknown symbol', bad.status === 404, `got ${bad.status}`);
    assert('error message present',       typeof bad.data.error === 'string');
    console.log('  Error:', bad.data.error);

    // ── Test 5: Cache hit — second call to /api/markets should be fast ─────────
    console.log('\n── Cache hit speed — /api/markets (second call) ─────────────────');
    const t0 = Date.now();
    await get('/api/markets');
    const elapsed = Date.now() - t0;
    console.log(`  Elapsed: ${elapsed}ms`);
    assert('Second /api/markets call < 500ms (cache hit)', elapsed < 500, `${elapsed}ms`);

    // ── Summary ────────────────────────────────────────────────────────────────
    console.log(`\n${'─'.repeat(55)}`);
    console.log(`Results: ${pass} passed, ${fail} failed`);
    if (fail === 0) console.log('✅  marketsRoutes endpoint tests passed\n');
    else { console.log('❌  Some tests failed\n'); process.exit(1); }
}

run().catch((err) => { console.error('Test error:', err.message); process.exit(1); });
