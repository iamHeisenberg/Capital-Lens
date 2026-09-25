'use strict';

/**
 * Cache versioning config.
 *
 * Bump CACHE_VERSION when the shape of cached data changes
 * (e.g. new fields added, format altered). Old versioned keys
 * naturally expire — no manual migration needed.
 *
 * Current key format: v1:price:TCS.NS  /  v1:fundamentals:TCS.NS
 *
 * v3: added historicalVolumes, obvSeries, hasVolume, indicators.obv
 * v4: added rsiSeries, indicators.rsi
 */
const CACHE_VERSION = 'v4';

/**
 * AI Research briefs are versioned separately so price/fundamentals changes
 * don't wipe them (regenerating costs AI quota). Bump this when the brief's
 * shape or the prompt changes.
 *
 * Key format: research:v1:TCS.NS
 */
const RESEARCH_CACHE_VERSION = 'v1';

module.exports = { CACHE_VERSION, RESEARCH_CACHE_VERSION };
