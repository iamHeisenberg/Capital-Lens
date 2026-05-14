const API_BASE = import.meta.env.VITE_API_BASE_URL;

/** Safe fetch — parses JSON, surfaces clean errors */
async function safeFetch(url) {
    const res = await fetch(url);
    let data;
    try { data = await res.json(); }
    catch { throw new Error('Invalid response from server'); }
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    return data;
}

/**
 * GET /api/markets
 * Returns { benchmarks: [...summaries], sectors: [...summaries] }
 */
export const fetchMarkets = () =>
    safeFetch(`${API_BASE}/api/markets`);

/**
 * GET /api/markets/:symbol
 * Returns full sector data with historicalCloses, dma series etc.
 * Symbol is URL-encoded (^NSEI → %5ENSEI) automatically.
 */
export const fetchMarketDetail = (symbol) =>
    safeFetch(`${API_BASE}/api/markets/${encodeURIComponent(symbol)}`);
