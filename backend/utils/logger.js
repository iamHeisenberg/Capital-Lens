'use strict';

/**
 * Structured JSON Logger
 *
 * Every log line is a single JSON object written to stdout.
 * Vercel and most log aggregators parse JSON lines automatically.
 *
 * Usage:
 *   const logger = require('./logger');
 *   logger.info('Something happened', ctx, { extraKey: 'value' });
 *
 * Context shape (all optional):
 *   { correlationId, endpoint, method, ticker }
 */

const LOG_LEVEL_ORDER = { debug: 0, info: 1, warn: 2, error: 3 };

// Respect LOG_LEVEL env var; default to 'info' in production, 'debug' otherwise
const ENV_LEVEL = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')).toLowerCase();

function shouldLog(level) {
    return (LOG_LEVEL_ORDER[level] ?? 1) >= (LOG_LEVEL_ORDER[ENV_LEVEL] ?? 1);
}

/**
 * Core log function.
 *
 * @param {'debug'|'info'|'warn'|'error'} level
 * @param {string} message
 * @param {object} [ctx]   - request context: { correlationId, endpoint, method, ticker, latencyMs }
 * @param {object} [meta]  - arbitrary extra fields (logged as `meta` key)
 */
function log(level, message, ctx = {}, meta = undefined) {
    if (!shouldLog(level)) return;

    const entry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message,
        correlationId: ctx.correlationId || null,
        endpoint: ctx.endpoint || null,
        method: ctx.method || null,
    };

    if (ctx.ticker !== undefined) entry.ticker = ctx.ticker;
    if (ctx.latencyMs !== undefined) entry.latencyMs = ctx.latencyMs;

    // Only attach meta when there is something to show
    if (meta !== undefined && meta !== null && Object.keys(meta).length > 0) {
        // For errors: include stack only when debug or error level
        if (meta.stack && level !== 'error' && level !== 'debug') {
            const { stack, ...rest } = meta;  // eslint-disable-line no-unused-vars
            entry.meta = rest;
        } else {
            entry.meta = meta;
        }
    }

    // Write single JSON line to stdout — Vercel captures this automatically
    process.stdout.write(JSON.stringify(entry) + '\n');
}

const logger = {
    debug: (message, ctx, meta) => log('debug', message, ctx, meta),
    info:  (message, ctx, meta) => log('info',  message, ctx, meta),
    warn:  (message, ctx, meta) => log('warn',  message, ctx, meta),
    error: (message, ctx, meta) => log('error', message, ctx, meta),
};

module.exports = logger;
