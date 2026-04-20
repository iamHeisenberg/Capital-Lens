'use strict';

/**
 * Singleton YahooFinance client.
 *
 * CRITICAL: yahoo-finance2 stores crumb and cookies inside the YahooFinance
 * instance's own cookie jar. If you create multiple instances (e.g., one in
 * priceService.js, one in fetchFinancials.js, one in index.js for pre-warming),
 * each instance has to independently fetch the crumb from Yahoo Finance.
 *
 * On cloud servers (Render free tier), Yahoo Finance rate-limits the crumb
 * endpoint (/v1/test/getcrumb) with 429 when multiple simultaneous requests
 * hit it. Using a single shared instance ensures:
 *   1. The crumb is fetched exactly ONCE per cold start.
 *   2. All subsequent requests (price, fundamentals) reuse the cached crumb.
 *   3. The startup pre-warm in index.js actually benefits the live services.
 */
const YahooFinance = require('yahoo-finance2').default;

const yahooFinance = new YahooFinance();

module.exports = yahooFinance;
