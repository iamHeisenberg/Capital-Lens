/**
 * Calculate percentage distance of price from a DMA value.
 * @param {number} price - Current price
 * @param {number} dma - DMA value
 * @returns {string|null} Percentage distance formatted to 2 decimal places
 */
export const calcDistance = (price, dma) => {
    if (!dma) return null;
    return ((price - dma) / dma * 100).toFixed(2);
};

/**
 * Generate systematic interpretation based on trend and DMA data.
 * @param {Object} data - Stock data object
 * @returns {{ bias: string, structure: string, position: string }}
 */
export const getInterpretation = (data) => {
    if (!data) return { bias: '', structure: '', position: '' };
    const distFromDma50 = calcDistance(data.latestClose, data.dma50);

    if (data.trend === 'Uptrend') {
        return {
            bias: 'Bullish',
            structure: 'Price and 50 DMA above 200 DMA confirms structural uptrend',
            position: distFromDma50 > 5
                ? 'Extended — wait for pullback to 50 DMA zone'
                : 'Favorable — near support for trend continuation'
        };
    } else if (data.trend === 'Downtrend') {
        return {
            bias: 'Bearish',
            structure: 'Price and 50 DMA below 200 DMA confirms structural downtrend',
            position: distFromDma50 < -5
                ? 'Oversold — potential for bounce, but trend remains down'
                : 'Weak — avoid fresh longs until reversal confirmed'
        };
    }
    return {
        bias: 'Neutral',
        structure: 'Mixed signals — no clear directional bias',
        position: 'Wait for trend confirmation before initiating positions'
    };
};

/**
 * Get color for trend indicator.
 * @param {string} trend - Trend string ('Uptrend', 'Downtrend', or other)
 * @returns {string} Hex color code
 */
export const getTrendColor = (trend) => {
    if (trend === 'Uptrend') return '#00ff88';
    if (trend === 'Downtrend') return '#ff4444';
    return '#ff9500';
};
