const logger = require('./logger');

/**
 * Wraps an async function with exponential-backoff retry logic.
 *
 * Designed specifically for Yahoo Finance (unofficial API) which returns
 * transient 429 (rate-limit) and 503 (service unavailable) errors.
 *
 * @param {Function} fn          - Async function to call: () => Promise<T>
 * @param {object}   [opts]
 * @param {number}   [opts.retries=3]       - Max attempts (1 = no retry)
 * @param {number}   [opts.baseDelayMs=600] - Base delay; doubles each attempt
 * @param {number[]} [opts.retryOn]         - HTTP status codes to retry on
 * @param {string}   [opts.label='']        - Label for log messages (e.g. ticker)
 * @returns {Promise<T>}
 *
 * Backoff schedule (default):
 *   attempt 1 → immediate
 *   attempt 2 → 600ms
 *   attempt 3 → 1200ms
 *   attempt 4 → 2400ms  (if retries=4)
 */
async function withRetry(fn, {
    retries    = 3,
    baseDelayMs = 600,
    retryOn    = [429, 503, 504],
    label      = '',
} = {}) {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;

            // Extract HTTP status from various error shapes yahoo-finance2 may throw
            const status =
                err?.response?.status  ||
                err?.statusCode        ||
                err?.cause?.status     ||
                null;

            const isTimeout  = /timeout|ETIMEDOUT|ECONNRESET/i.test(err?.message || '');
            const isRetryable = retryOn.includes(status) || isTimeout;

            if (!isRetryable || attempt === retries) {
                // Non-retryable error or all attempts exhausted — rethrow
                throw err;
            }

            const delayMs = baseDelayMs * 2 ** (attempt - 1);
            logger.warn('Yahoo Finance transient error — retrying', {
                event:   'YAHOO_RETRY',
                label,
                attempt,
                retries,
                status,
                delayMs,
                error:   err?.message,
            });

            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    throw lastError; // unreachable but satisfies lint
}

module.exports = { withRetry };
