'use strict';

const logger = require('../utils/logger');

/**
 * Request Lifecycle Logger Middleware
 *
 * Must be registered AFTER correlationMiddleware so that req.correlationId
 * is already available.
 *
 * Logs:
 *   - "Request started"   — on every incoming request
 *   - "Request completed" — when the response is fully sent (res finish event)
 */
function requestLogger(req, res, next) {
    const startTime = Date.now();

    const ctx = {
        correlationId: req.correlationId,
        endpoint: req.originalUrl,
        method: req.method,
    };

    logger.info('Request started', ctx);

    res.on('finish', () => {
        logger.info('Request completed', {
            ...ctx,
            latencyMs: Date.now() - startTime,
        }, {
            statusCode: res.statusCode,
        });
    });

    next();
}

module.exports = requestLogger;
