const express = require('express');
const cors = require('cors');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ status: 'working' });
});

// Helper function to calculate moving average
const calculateDMA = (closes, period) => {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / period) * 100) / 100;
};

// Helper function to determine trend
const determineTrend = (latestClose, dma50, dma200) => {
  if (latestClose > dma200 && dma50 > dma200) {
    return 'Uptrend';
  } else if (latestClose < dma200 && dma50 < dma200) {
    return 'Downtrend';
  }
  return 'Neutral';
};

// Price route - fetch historical price data for NSE Indian stocks only
app.get('/api/price/:ticker', async (req, res) => {
  const { ticker } = req.params;

  // Ensure ticker is in NSE format (TICKER.NS)
  const nseTicker = ticker.toUpperCase().endsWith('.NS')
    ? ticker.toUpperCase()
    : ticker.toUpperCase() + '.NS';

  try {
    // Calculate date range (1 year ago to today)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    // Fetch historical data from Yahoo Finance
    const result = await yahooFinance.historical(nseTicker, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'No data found for ticker: ' + nseTicker });
    }

    // Fetch quote for currency info
    const quote = await yahooFinance.quote(nseTicker);
    const currency = quote.currency || 'INR';

    // Only support INR stocks
    if (currency !== 'INR') {
      return res.status(400).json({ error: 'Only INR stocks supported' });
    }

    // Get the last 200 daily closing prices (most recent last)
    const historicalCloses = result
      .slice(-200)
      .map((day) => day.close);

    // Get latest closing price
    const latestData = result[result.length - 1];
    const latestClose = latestData.close;

    // Calculate DMAs
    const dma50 = calculateDMA(historicalCloses, 50);
    const dma200 = calculateDMA(historicalCloses, 200);

    // Determine trend
    const trend = (dma50 !== null && dma200 !== null)
      ? determineTrend(latestClose, dma50, dma200)
      : 'Insufficient Data';

    res.json({
      ticker: nseTicker,
      latestClose,
      currency,
      lastUpdated: new Date().toISOString(),
      historicalCloses,
      dma50,
      dma200,
      trend
    });
  } catch (err) {
    console.error('Error fetching price data:', err.message);
    res.status(500).json({ error: 'Failed to fetch price data: ' + err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
