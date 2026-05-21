import { useState, useEffect, useRef } from 'react';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Fetches constituent stock data for a single sector index symbol.
 *
 * @param {string|null} symbol  Yahoo Finance sector symbol, e.g. '^CNXIT'.
 *                              Pass null / undefined to skip fetching.
 * @param {boolean} isBenchmark If true, skip the fetch entirely (benchmarks have
 *                              no constituent mapping).
 */
export function useSectorStocks(symbol, isBenchmark = false) {
    const [data,    setData]    = useState(null);   // { sectorReturns, stocks, ... }
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);

    // Track the last requested symbol so stale responses are ignored
    const latestSymbol = useRef(null);

    useEffect(() => {
        // Reset on every symbol change
        setData(null);
        setError(null);

        if (!symbol || isBenchmark) {
            setLoading(false);
            return;
        }

        latestSymbol.current = symbol;
        setLoading(true);

        const encoded = encodeURIComponent(symbol);

        fetch(`${BASE}/api/markets/${encoded}/stocks`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((json) => {
                // Discard if a newer request has already been dispatched
                if (latestSymbol.current !== symbol) return;
                setData(json);
                setError(null);
            })
            .catch((err) => {
                if (latestSymbol.current !== symbol) return;
                console.error(`useSectorStocks: fetch failed for ${symbol}`, err);
                setError(err.message || 'Failed to load stock data');
            })
            .finally(() => {
                if (latestSymbol.current === symbol) setLoading(false);
            });
    }, [symbol, isBenchmark]);

    return { data, loading, error };
}
