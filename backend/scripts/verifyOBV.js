require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Redis } = require('@upstash/redis');

const r = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function run() {
    const raw = await r.get('v4:price:RELIANCE.NS');
    if (!raw) { console.log('Key v4:price:RELIANCE.NS NOT FOUND'); return; }
    const d = typeof raw === 'string' ? JSON.parse(raw) : raw;

    console.log('\n── OBV ──────────────────────────────────');
    console.log('hasVolume        :', d.hasVolume);
    console.log('obvSeries length :', d.obvSeries?.length ?? 'null');
    console.log('indicators.obv   :', JSON.stringify(d.indicators?.obv, null, 2));

    console.log('\n── RSI ──────────────────────────────────');
    console.log('rsiSeries length :', d.rsiSeries?.length ?? 'null');
    console.log('rsiSeries[0..13] :', d.rsiSeries?.slice(0, 14)); // should all be null
    console.log('rsiSeries[14]    :', d.rsiSeries?.[14]);          // first non-null
    console.log('rsiSeries last   :', d.rsiSeries?.[d.rsiSeries?.length - 1]);
    console.log('indicators.rsi   :', JSON.stringify(d.indicators?.rsi, null, 2));

    // Sanity check: all rsi values in [0, 100] (or null)
    if (Array.isArray(d.rsiSeries)) {
        const invalid = d.rsiSeries.filter((v) => v !== null && (v < 0 || v > 100));
        console.log('\nRSI out-of-range values:', invalid.length, invalid.length ? '❌' : '✅');
        const warmUp  = d.rsiSeries.slice(0, 14).every((v) => v === null);
        console.log('First 14 are null (warm-up):', warmUp ? '✅' : '❌');
    }
}

run().catch(console.error);
