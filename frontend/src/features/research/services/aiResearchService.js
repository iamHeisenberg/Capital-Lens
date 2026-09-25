const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Analyse a company by name + ticker via the AI Research backend.
 * @param {string} companyName - Full company name e.g. "Persistent Systems Ltd"
 * @param {string} [ticker]    - NSE ticker e.g. "PERSISTENT.NS" (optional but improves accuracy)
 * @returns {Promise<Object>}  Structured 6-category research result
 */
export async function analyseCompany(companyName, ticker = null) {
    const res = await fetch(`${API_BASE}/api/research/company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, ticker }),
    });

    const json = await res.json();

    if (!res.ok) {
        throw new Error(json.error || 'Analysis failed. Please try again.');
    }

    return json.data;
}


/**
 * Analyse a company by uploading a PDF (annual report / earnings transcript).
 * @param {File} file
 * @returns {Promise<Object>} Structured 6-category research result
 */
export async function analysePdf(file) {
    const formData = new FormData();
    formData.append('pdf', file);

    const res = await fetch(`${API_BASE}/api/research/pdf`, {
        method: 'POST',
        body: formData,
        // Note: Do NOT set Content-Type header — browser sets it with boundary automatically
    });

    const json = await res.json();

    if (!res.ok) {
        throw new Error(json.error || 'PDF analysis failed. Please try again.');
    }

    return json.data;
}
