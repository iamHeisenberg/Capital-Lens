const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Fetches fundamental metrics for a given ticker from the backend API.
 * @param {string} ticker - Stock ticker symbol (e.g. 'RELIANCE.NS')
 * @returns {Promise<Object>} Parsed JSON response
 */
export const fetchFundamentals = async (ticker) => {
    const response = await fetch(`${API_BASE_URL}/api/fundamentals/${ticker}`);
    const data = await response.json();

    if (data.error) {
        throw new Error(data.error);
    }

    return data;
};
