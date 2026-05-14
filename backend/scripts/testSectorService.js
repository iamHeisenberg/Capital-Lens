/**
 * Smoke test for sectorService.js
 * Run: node scripts/testSectorService.js
 */
'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { getSectorData, toSummary } = require('../services/sectorService');

const SECTORS_META = require('../../frontend/src/data/sectors.json');

async function run() {
    // Test 1 — fetch a ^ prefix symbol (Nifty 50)
    const niftyMeta = SECTORS_META.find((s) => s.symbol === '^NSEI');
    console.log('\n── Test 1: ^NSEI (Nifty 50) ─────────────────────────────────────────');
    const nifty = await getSectorData('^NSEI', { meta: niftyMeta });

    console.log('name        :', nifty.name);
    console.log('group       :', nifty.group);
    console.log('latestClose :', nifty.latestClose);
    console.log('dma50       :', nifty.dma50?.toFixed(2));
    console.log('dma200      :', nifty.dma200?.toFixed(2));
    console.log('trend       :', nifty.trend);
    console.log('hasVolume   :', nifty.hasVolume);
    console.log('totalDays   :', nifty.totalDays);
    console.log('returns     :', nifty.returns);
    console.log('series len  :', nifty.historicalCloses?.length, '(closes)',
                                 nifty.dma50Series?.length, '(dma50)',
                                 nifty.dma200Series?.length, '(dma200)');

    // Assertions
    let pass = 0; let fail = 0;
    const assert = (label, cond) => {
        if (cond) { console.log(`  ✅ ${label}`); pass++; }
        else       { console.log(`  ❌ ${label}`); fail++; }
    };

    assert('latestClose is a finite number',    typeof nifty.latestClose === 'number' && isFinite(nifty.latestClose));
    assert('dma50 is computed (> 50 days)',     nifty.dma50 != null && isFinite(nifty.dma50));
    assert('dma200 is computed (> 200 days)',   nifty.dma200 != null && isFinite(nifty.dma200));
    assert('trend is a valid string',           ['Uptrend','Downtrend','Sideways','Insufficient Data'].includes(nifty.trend));
    assert('historicalCloses length > 200',     nifty.historicalCloses?.length > 200);
    assert('dma50Series same length as closes', nifty.dma50Series?.length === nifty.historicalCloses?.length);
    assert('dma200Series same length as closes',nifty.dma200Series?.length === nifty.historicalCloses?.length);
    assert('returns.r1y is a number',           typeof nifty.returns?.r1y === 'number');
    assert('returns.r2y is a number',           typeof nifty.returns?.r2y === 'number');
    assert('lastUpdated is present',            typeof nifty.lastUpdated === 'string');

    // Test 2 — .NS format symbol (Nifty Midcap 150)
    console.log('\n── Test 2: NIFTYMIDCAP150.NS ────────────────────────────────────────');
    const midcapMeta = SECTORS_META.find((s) => s.symbol === 'NIFTYMIDCAP150.NS');
    const midcap = await getSectorData('NIFTYMIDCAP150.NS', { meta: midcapMeta });
    console.log('name        :', midcap.name);
    console.log('latestClose :', midcap.latestClose);
    console.log('totalDays   :', midcap.totalDays);
    console.log('returns     :', midcap.returns);
    assert('Midcap 150: latestClose valid',    typeof midcap.latestClose === 'number' && isFinite(midcap.latestClose));
    assert('Midcap 150: hasVolume = false',    midcap.hasVolume === false);
    assert('Midcap 150: historicalVolumes null',midcap.historicalVolumes === null);

    // Test 3 — toSummary strips arrays
    console.log('\n── Test 3: toSummary() strips heavy arrays ──────────────────────────');
    const summary = toSummary(nifty);
    assert('summary has no historicalCloses',   !('historicalCloses'  in summary));
    assert('summary has no dma50Series',        !('dma50Series'       in summary));
    assert('summary has no dma200Series',       !('dma200Series'      in summary));
    assert('summary has no historicalDates',    !('historicalDates'   in summary));
    assert('summary has no historicalVolumes',  !('historicalVolumes' in summary));
    assert('summary has returns',                'returns'             in summary);
    assert('summary has trend',                  'trend'               in summary);
    assert('summary has latestClose',            'latestClose'         in summary);

    // Test 4 — cache hit (second call should read from Redis)
    console.log('\n── Test 4: Cache hit on second call ─────────────────────────────────');
    const t0 = Date.now();
    await getSectorData('^NSEI', { meta: niftyMeta });
    const elapsed = Date.now() - t0;
    console.log(`  Second call took ${elapsed}ms`);
    assert('Cache hit < 200ms', elapsed < 200);

    console.log(`\n${'─'.repeat(55)}`);
    console.log(`Results: ${pass} passed, ${fail} failed`);
    if (fail === 0) console.log('✅  sectorService smoke test passed\n');
    else { console.log('❌  Some tests failed\n'); process.exit(1); }
}

run().catch((err) => { console.error(err); process.exit(1); });
