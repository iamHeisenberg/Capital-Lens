const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Fetches stock price data for a given ticker from the backend API.
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} Parsed JSON response
 */
export const fetchStockData = async (ticker) => {
    const response = await fetch(`${API_BASE_URL}/api/price/${ticker}`);
    const data = await response.json();

    if (data.error) {
        throw new Error(data.error);
    }

    return data;
};
