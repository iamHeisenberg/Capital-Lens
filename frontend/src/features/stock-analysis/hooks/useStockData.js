import { useState, useEffect } from 'react';
import { fetchStockData } from '../services/stockApi';

/**
 * Hook for fetching and managing stock data state.
 * @param {string} ticker - Stock ticker symbol
 * @returns {{ data: Object|null, loading: boolean, error: string|null }}
 */
const useStockData = (ticker) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStockData(ticker)
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

export default useStockData;
