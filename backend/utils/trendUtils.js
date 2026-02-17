// Helper function to determine trend
const determineTrend = (latestClose, dma50, dma200) => {
    if (latestClose > dma200 && dma50 > dma200) {
        return 'Uptrend';
    } else if (latestClose < dma200 && dma50 < dma200) {
        return 'Downtrend';
    }
    return 'Neutral';
};

module.exports = { determineTrend };
