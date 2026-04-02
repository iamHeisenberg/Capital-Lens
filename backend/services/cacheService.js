'use strict';

const { Redis } = require('@upstash/redis');
const logger = require('../utils/logger');
const { CACHE_VERSION } = require('../config/cacheConfig');

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TIMEOUT_MS = 3000;

/**
 * Wraps a Redis promise with a max-timeout so a slow/unreachable
 * Redis never hangs the API indefinitely.
 */
const withTimeout = (promise) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis timeout')), TIMEOUT_MS)
        ),
    ]);

/**
 * Get a value from Redis.
 * Returns null on cache miss OR on any Redis error (fail-open).
 * @param {string} key
 * @param {object} [ctx] - { correlationId, ticker }
 */
const getCache = async (key, ctx = {}) => {
    try {
        const raw = await withTimeout(redis.get(key));
        if (raw == null) {
            logger.info('Cache miss', { ...ctx, event: 'CACHE_MISS', key });
            return null;
        }
        logger.info('Cache hit', { ...ctx, event: 'CACHE_HIT', key });
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (err) {
        logger.error('Cache get failed — treating as miss', { ...ctx, key, error: err.message });
        return null;
    }
};

/**
 * Set a value in Redis with a TTL.
 * Errors are swallowed — a cache write failure must never break the API.
 * @param {string} key
 * @param {any} data
 * @param {number} ttl  - seconds
 * @param {object} [ctx]
 */
const setCache = async (key, data, ttl, ctx = {}) => {
    try {
        await withTimeout(redis.set(key, JSON.stringify(data), { ex: ttl }));
        logger.info('Cache set', { ...ctx, event: 'CACHE_SET', key, ttlSeconds: ttl });
    } catch (err) {
        logger.error('Cache set failed — continuing without cache', { ...ctx, key, error: err.message });
    }
};

/**
 * Invalidate a specific cache key.
 * @param {string} key
 * @param {object} [ctx]
 */
const clearCache = async (key, ctx = {}) => {
    try {
        await withTimeout(redis.del(key));
        logger.info('Cache invalidated', { ...ctx, event: 'CACHE_CLEAR', key });
    } catch (err) {
        logger.error('Cache clear failed', { ...ctx, key, error: err.message });
    }
};

/**
 * Canonical key builders — enforce version:namespace:ticker convention.
 * e.g. v1:price:TCS.NS  /  v1:fundamentals:TCS.NS
 *
 * Bump CACHE_VERSION in config/cacheConfig.js to invalidate all cached data.
 */
const cacheKeys = {
    price: (ticker) => `${CACHE_VERSION}:price:${ticker.toUpperCase()}`,
    fundamentals: (ticker) => `${CACHE_VERSION}:fundamentals:${ticker.toUpperCase()}`,
};

module.exports = { getCache, setCache, clearCache, cacheKeys };
