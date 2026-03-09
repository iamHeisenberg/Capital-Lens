const express = require('express');
const cors = require('cors');

const priceRoutes = require('./routes/priceRoutes');
const testFundamentalsRoutes = require('./routes/testFundamentalsRoutes');
const fundamentalsRoutes = require('./routes/fundamentalsRoutes');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ status: 'working' });
});

// Routes
app.use('/api', priceRoutes);
app.use('/api', testFundamentalsRoutes);
app.use('/api', fundamentalsRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
