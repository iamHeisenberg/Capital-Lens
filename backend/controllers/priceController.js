const { getStockData } = require('../services/priceService');

/**
 * Controller for price-related endpoints.
 */
const getPrice = async (req, res) => {
    const { ticker } = req.params;

    try {
        const data = await getStockData(ticker);
        res.json(data);
    } catch (err) {
        console.error('Error fetching price data:', err.message);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ error: err.message });
    }
};

module.exports = { getPrice };
