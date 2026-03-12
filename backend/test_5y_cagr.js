const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test_5y_data() {
    const ticker = 'RELIANCE.NS';
    try {
        console.log(`Fetching deep historical financials for ${ticker}...`);
        
        // Attempt to fetch 10 years of data
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 10);

        const tsRaw = await yahooFinance.fundamentalsTimeSeries(ticker, {
            type: 'annual',
            module: 'all',
            period1: startDate,
            period2: endDate,
        }, { validateResult: false });

        const tsIncome = (tsRaw || [])
            .filter((e) => e.totalRevenue != null || e.netIncome != null)
            .sort((a, b) => {
                const da = a.date instanceof Date ? a.date.getTime() : a.date * 1000;
                const db = b.date instanceof Date ? b.date.getTime() : b.date * 1000;
                return da - db;
            });

        console.log(`\n=== Strategy 3: Deep fundamentalsTimeSeries ===`);
        console.log(`Found ${tsIncome.length} years of data.`);
        tsIncome.forEach((yr, idx) => {
            const dateStr = yr.date instanceof Date ? yr.date.toISOString().split('T')[0] : new Date(yr.date * 1000).toISOString().split('T')[0];
            console.log(`[${idx}] Date: ${dateStr} | Revenue: ${yr.totalRevenue} | NetIncome: ${yr.netIncome}`);
        });

    } catch (e) {
        console.error(e);
    }
}

test_5y_data();
