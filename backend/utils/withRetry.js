const logger = require('./logger');

/**
 * Wraps an async function with smart exponential-backoff retry logic.
 *
 * Designed for Yahoo Finance (unofficial API) which returns:
 *   - 429 "Failed to get crumb" — crumb rate-limit (needs 5-15s cooldown)
 *   - 503 / 504                — service temporarily unavailable
 *   - ETIMEDOUT / ECONNRESET   — network-level timeouts
 *
 * Retry delay strategy:
 *   - Base delay is derived from observed latency or a fixed base.
 *   - For 429/crumb errors, delays are intentionally long (≥ crumb cooldown).
 *   - For timeout errors, shorter delays are acceptable.
 *
 * Default backoff (baseDelayMs = 5000, multiplier = 2):
 *   attempt 1 → immediate
 *   attempt 2 → 5000ms  (5s  — allows crumb cooldown)
 *   attempt 3 → 10000ms (10s)
 *
 * @param {Function} fn           - Async function to wrap: () => Promise<T>
 * @param {object}   [opts]
 * @param {number}   [opts.retries=3]        - Max attempts (includes first try)
 * @param {number}   [opts.baseDelayMs=5000] - Delay before 2nd attempt
 * @param {number}   [opts.multiplier=2]     - Delay multiplier per attempt
 * @param {number[]} [opts.retryOn]          - HTTP status codes to retry on
 * @param {string}   [opts.label='']         - Label for log messages (ticker)
 * @returns {Promise<T>}
 */
async function withRetry(fn, {
    retries     = 3,
    baseDelayMs = 5000,    // 5s base — enough for Yahoo crumb rate-limit to reset
    multiplier  = 2,       // 5s → 10s → 20s
    retryOn     = [429, 503, 504],
    label       = '',
} = {}) {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;

            // Extract HTTP status from various error shapes yahoo-finance2 may throw
            const status =
                err?.response?.status ||
                err?.statusCode       ||
                err?.code             ||   // yahoo-finance2 HTTPError sets .code
                err?.cause?.status    ||
                null;

            const msg = (err?.message || '').toLowerCase();

            const isTimeout  = /timeout|etimedout|econnreset/i.test(msg);

            // yahoo-finance2 crumb errors embed the HTTP status in the message:
            //   "Failed to get crumb, status 429, statusText: Too Many Requests"
            // They do NOT set err.statusCode — must match on message text.
            const isCrumb429 = msg.includes('crumb') && msg.includes('429');

            // Generic "status 429" in message (edge case)
            const isMsg429 = /status\s*429/i.test(msg);

            const isRetryable = retryOn.includes(status) || isTimeout || isCrumb429 || isMsg429;

            if (!isRetryable || attempt === retries) {
                throw err;
            }

            // For crumb/429 errors, use a longer floor delay (Yahoo crumb cooldown ~10s)
            const isCrumbError = isCrumb429 || isMsg429 || status === 429;
            const effectiveBase = isCrumbError
                ? Math.max(baseDelayMs, 8000)   // minimum 8s for crumb 429
                : baseDelayMs;

            const delayMs = effectiveBase * multiplier ** (attempt - 1);

            logger.warn('Yahoo Finance transient error — retrying', {
                event:     'YAHOO_RETRY',
                label,
                attempt,
                retries,
                status,
                delayMs,
                isCrumb:   isCrumb429,
                error:     err?.message,
            });

            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    throw lastError;
}

/**
 * Wraps a Yahoo Finance call with a hard per-request timeout.
 *
 * yahoo-finance2 has no built-in timeout — a hung request blocks forever.
 * This wrapper races the call against a timeout, throwing a clear error
 * so withRetry can decide to retry or surface the error.
 *
 * @param {Function} fn         - Async function: () => Promise<T>
 * @param {number}   timeoutMs  - Max ms to wait (default 15000 = 15s)
 * @param {string}   [label]    - For error messages
 * @returns {Promise<T>}
 */
async function withTimeout(fn, timeoutMs = 15000, label = '') {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(`Yahoo Finance request timed out after ${timeoutMs}ms${label ? ` [${label}]` : ''}`));
        }, timeoutMs);
    });

    try {
        const result = await Promise.race([fn(), timeoutPromise]);
        clearTimeout(timer);
        return result;
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

module.exports = { withRetry, withTimeout };
