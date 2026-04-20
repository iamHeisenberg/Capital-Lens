require('dotenv').config(); // loads .env locally; on Render env vars come from dashboard

// ── Global crash handlers — must be before anything else ─────────────────────
process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err.message);
    console.error(err.stack);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    console.error('[FATAL] Unhandled Promise Rejection:', reason);
    process.exit(1);
});

// ── Startup env check — log missing vars immediately so Render logs show cause ─
const REQUIRED_ENV = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) {
    console.warn('[WARN] Missing env vars — Redis cache disabled:', missingEnv.join(', '));
} else {
    console.log('[INFO] Env vars OK — Redis will be active');
}

const express = require('express');
const cors = require('cors');

const correlationMiddleware = require('./middleware/correlationMiddleware');
const requestLogger = require('./middleware/requestLogger');
const logger = require('./utils/logger');

const priceRoutes = require('./routes/priceRoutes');
const testFundamentalsRoutes = require('./routes/testFundamentalsRoutes');
const fundamentalsRoutes = require('./routes/fundamentalsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Core Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Attach correlationId to every request, then log request lifecycle
app.use(correlationMiddleware);
app.use(requestLogger);

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/test', (req, res) => {
    res.json({
        status: 'working',
        redis: missingEnv.length === 0 ? 'configured' : 'missing-env',
    });
});

app.use('/api', priceRoutes);
app.use('/api', testFundamentalsRoutes);
app.use('/api', fundamentalsRoutes);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    logger.info('Server started', { endpoint: null, method: null, correlationId: 'startup' }, { port: PORT });
});
