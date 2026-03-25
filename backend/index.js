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

// ── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Attach correlationId to every request, then log request lifecycle
app.use(correlationMiddleware);
app.use(requestLogger);

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/test', (req, res) => {
    res.json({ status: 'working' });
});

app.use('/api', priceRoutes);
app.use('/api', testFundamentalsRoutes);
app.use('/api', fundamentalsRoutes);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    logger.info('Server started', { endpoint: null, method: null, correlationId: 'startup' }, { port: PORT });
});
