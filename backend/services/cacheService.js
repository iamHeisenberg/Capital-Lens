const NodeCache = require('node-cache');

// Initialize cache with a standard TTL of 1 hour (3600 seconds)
// checkperiod: how often to check for expired keys (600s = 10 mins)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

/**
 * Get data from cache.
 * @param {string} key - The cache key to retrieve.
 * @returns {any|undefined} - The cached data or undefined if not found/expired.
 */
const getCache = (key) => {
    return cache.get(key);
};

/**
 * Save data to cache.
 * @param {string} key - The cache key.
 * @param {any} data - The data to store.
 * @param {number} [ttl] - Optional custom TTL in seconds. Overrides stdTTL.
 * @returns {boolean} - True on success.
 */
const setCache = (key, data, ttl) => {
    if (ttl) {
        return cache.set(key, data, ttl);
    }
    return cache.set(key, data);
};

/**
 * Remove data from cache.
 * @param {string} key - The cache key to remove.
 * @returns {number} - Number of deleted keys.
 */
const clearCache = (key) => {
    return cache.del(key);
};

module.exports = {
    getCache,
    setCache,
    clearCache,
};
