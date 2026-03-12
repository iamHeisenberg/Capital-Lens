const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test_ev() {
    const ticker = 'RELIANCE.NS';
    try {
        console.log(`Fetching data for ${ticker}...`);
        
        const result = await yahooFinance.quoteSummary(ticker, {
            modules: ['defaultKeyStatistics', 'financialData', 'summaryDetail']
        });

        console.log("=== DEFAULT KEY STATISTICS ===");
        console.log("enterpriseToEbitda:", result.defaultKeyStatistics?.enterpriseToEbitda);
        console.log("enterpriseToRevenue:", result.defaultKeyStatistics?.enterpriseToRevenue);
        console.log("enterpriseValue:", result.defaultKeyStatistics?.enterpriseValue);

        console.log("\n=== FINANCIAL DATA ===");
        console.log("ebitda:", result.financialData?.ebitda);
        console.log("totalCash:", result.financialData?.totalCash);
        console.log("totalDebt:", result.financialData?.totalDebt);
        
        console.log("\n=== SUMMARY DETAIL ===");
        console.log("marketCap:", result.summaryDetail?.marketCap);
        
    } catch (e) {
        console.error(e);
    }
}

test_ev();
