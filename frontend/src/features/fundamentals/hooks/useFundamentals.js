import { useState, useEffect } from 'react';
import { fetchFundamentals } from '../services/fundamentalsApi';

/**
 * Hook for fetching and managing fundamentals data state.
 * @param {string} ticker - Stock ticker symbol
 * @returns {{ data: Object|null, loading: boolean, error: string|null }}
 */
const useFundamentals = (ticker) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Don't fetch if ticker is missing
        if (!ticker) {
            setData(null);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        fetchFundamentals(ticker)
            .then((result) => {
                setData(result);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [ticker]);

    return { data, loading, error };
};

export default useFundamentals;
