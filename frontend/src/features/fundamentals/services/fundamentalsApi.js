const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Safe fetch wrapper — parses JSON defensively and surfaces clean errors.
 * Handles non-JSON bodies (HTML 502 pages etc.) and HTTP error statuses.
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function safeFetch(url) {
    const response = await fetch(url);

    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error('Invalid response from server');
    }

    if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`);
    }

    return data;
}

/**
 * Fetches fundamental metrics for a given ticker from the backend API.
 * @param {string} ticker - Stock ticker symbol (e.g. 'RELIANCE.NS')
 * @returns {Promise<Object>} Parsed JSON response
 */
export const fetchFundamentals = async (ticker) => {
    return safeFetch(`${API_BASE_URL}/api/fundamentals/${ticker}`);
};
