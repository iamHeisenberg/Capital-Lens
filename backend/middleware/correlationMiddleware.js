'use strict';

const { randomUUID } = require('crypto');

/**
 * Correlation ID Middleware
 *
 * Reads `x-correlation-id` from the incoming request header.
 * If absent, generates a new UUID v4 using Node's built-in crypto module
 * (available since Node 14.17 — no additional npm package required).
 *
 * Attaches the correlation ID to:
 *   - req.correlationId  (used by all downstream logger calls)
 *   - x-correlation-id response header (so callers can trace logs)
 */
function correlationMiddleware(req, res, next) {
    const incoming = req.headers['x-correlation-id'];
    req.correlationId = incoming && incoming.trim() ? incoming.trim() : randomUUID();
    res.setHeader('x-correlation-id', req.correlationId);
    next();
}

module.exports = correlationMiddleware;
