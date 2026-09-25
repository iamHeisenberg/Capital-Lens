import { useState, useCallback } from 'react';
import { analyseCompany, analysePdf } from '../services/aiResearchService';

/**
 * Manages all state for the AI Research feature:
 * loading, error, result, and the two analysis triggers.
 */
export default function useResearch() {
    const [result, setResult]   = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    const runCompanyAnalysis = useCallback(async (companyName, ticker = null) => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await analyseCompany(companyName, ticker);
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);


    const runPdfAnalysis = useCallback(async (file) => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await analysePdf(file);
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    return { result, loading, error, reset, runCompanyAnalysis, runPdfAnalysis };
}
