// Helper function to calculate moving average
const calculateDMA = (closes, period) => {
    if (closes.length < period) return null;
    const slice = closes.slice(-period);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / period) * 100) / 100;
};

module.exports = { calculateDMA };
