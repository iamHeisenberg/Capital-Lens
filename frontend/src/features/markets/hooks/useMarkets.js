import { useState, useEffect } from 'react';
import { fetchMarkets } from '../services/marketsApi';

/**
 * Fetches the lightweight sector/index summary list from GET /api/markets.
 * Returns benchmarks[] and sectors[] (summaries — no historical arrays).
 *
 * @returns {{ benchmarks, sectors, loading, error }}
 */
export default function useMarkets() {
    const [benchmarks, setBenchmarks] = useState([]);
    const [sectors,    setSectors]    = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        fetchMarkets()
            .then((data) => {
                setBenchmarks(data.benchmarks ?? []);
                setSectors(data.sectors ?? []);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []); // fetch once on mount — data is ~4h cached

    return { benchmarks, sectors, loading, error };
}
