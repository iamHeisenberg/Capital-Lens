import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * Fetches constituent stock returns for a single sector index.
 * GET /api/markets/:symbol/stocks
 *
 * - Returns null data (not loading) when symbol is null or group is 'benchmark'
 * - Resets and re-fetches whenever symbol changes
 *
 * @param {string|null} symbol   Sector symbol e.g. '^CNXIT'
 * @param {string|null} group    'sector' | 'benchmark' — skips fetch for benchmarks
 * @returns {{ stocks, sectorReturns, totalStocks, availableStocks, loading, error }}
 */
export default function useSectorStocks(symbol, group) {
    const [stocks,          setStocks]          = useState([]);
    const [sectorReturns,   setSectorReturns]   = useState(null);
    const [totalStocks,     setTotalStocks]     = useState(0);
    const [availableStocks, setAvailableStocks] = useState(0);
    const [loading,         setLoading]         = useState(false);
    const [error,           setError]           = useState(null);

    useEffect(() => {
        // Nothing selected, or it's a benchmark — no stocks tab
        if (!symbol || group === 'benchmark') {
            setStocks([]);
            setSectorReturns(null);
            setTotalStocks(0);
            setAvailableStocks(0);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);
        setStocks([]);

        const url = `${API_BASE}/api/markets/${encodeURIComponent(symbol)}/stocks`;

        fetch(url)
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
                return data;
            })
            .then((data) => {
                setStocks(data.stocks ?? []);
                setSectorReturns(data.sectorReturns ?? null);
                setTotalStocks(data.totalStocks ?? 0);
                setAvailableStocks(data.availableStocks ?? 0);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [symbol, group]);

    return { stocks, sectorReturns, totalStocks, availableStocks, loading, error };
}
