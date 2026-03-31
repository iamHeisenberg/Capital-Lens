import { useState, useEffect } from 'react';
import tickers from '../data/tickers.json';

/**
 * Debounced local ticker search hook.
 *
 * Filters the static tickers.json dataset by symbol or company name.
 * No API calls — all filtering is done client-side.
 *
 * @returns {{ query: string, setQuery: Function, results: Array }}
 */
export default function useTickerSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    useEffect(() => {
        const q = query.trim();

        if (!q) {
            setResults([]);
            return;
        }

        const timer = setTimeout(() => {
            const lower = q.toLowerCase();
            const filtered = tickers
                .filter(
                    (t) =>
                        t.symbol.toLowerCase().includes(lower) ||
                        t.name.toLowerCase().includes(lower)
                )
                .slice(0, 5);
            setResults(filtered);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return { query, setQuery, results };
}
