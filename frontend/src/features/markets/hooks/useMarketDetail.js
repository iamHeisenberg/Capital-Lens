import { useState, useEffect } from 'react';
import { fetchMarketDetail } from '../services/marketsApi';

/**
 * Fetches full sector data (with historicalCloses, dma series etc.)
 * for a single symbol from GET /api/markets/:symbol.
 *
 * Resets and re-fetches whenever `symbol` changes.
 * Returns null data + loading=false when symbol is null/undefined (no chart open).
 *
 * @param {string|null} symbol  Yahoo Finance symbol, e.g. '^NSEI', 'NIFTYMIDCAP150.NS'
 * @returns {{ data, loading, error }}
 */
export default function useMarketDetail(symbol) {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);

    useEffect(() => {
        if (!symbol) {
            setData(null);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);
        setData(null);

        fetchMarketDetail(symbol)
            .then((result) => {
                setData(result);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [symbol]);

    return { data, loading, error };
}
