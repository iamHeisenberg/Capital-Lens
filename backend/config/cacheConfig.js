'use strict';

/**
 * Cache versioning config.
 *
 * Bump CACHE_VERSION when the shape of cached data changes
 * (e.g. new fields added, format altered). Old versioned keys
 * naturally expire — no manual migration needed.
 *
 * Current key format: v1:price:TCS.NS  /  v1:fundamentals:TCS.NS
 */
const CACHE_VERSION = 'v1';

module.exports = { CACHE_VERSION };
