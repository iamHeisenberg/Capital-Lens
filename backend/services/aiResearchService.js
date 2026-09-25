const axios = require('axios');
const { fetchFinancials } = require('./fundamentals/fetchFinancials');
const { computeMetrics } = require('./fundamentals/computeMetrics');
const { calculateCompounderScore } = require('./scoring/compounderScore');
const { getRecentNews } = require('./newsService');
const { getCache, setCache, cacheKeys } = require('./cacheService');

// ── Gemini models (free tier) ─────────────────────────────────────────────────
// Tried in order, strongest first. A model is skipped when it is out of quota,
// overloaded or retired. 3.7 Flash is often overloaded, 3.6 Flash is the reliable
// middle tier, and Lite has the largest free quota. Earlier tiers get a shorter
// timeout because an overloaded model can take 20s+ just to return a 503.
const GEMINI_MODELS = [
    { id: 'gemini-3.7-flash',      label: 'Gemini 3.7 Flash',      timeoutMs: 30000 },
    { id: 'gemini-3.6-flash',      label: 'Gemini 3.6 Flash',      timeoutMs: 30000 },
    { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite', timeoutMs: 60000 },
];
const geminiUrl = (model) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Research briefs change slowly — reuse one per company for a day to save quota
const RESEARCH_CACHE_TTL = 24 * 60 * 60;

// ── System prompt that defines the 6 structured categories ───────────────────
const SYSTEM_INSTRUCTION = `You are an expert equity research analyst specialising in Indian stock markets (NSE/BSE).
Your task is to analyse the given company and return a structured investment research brief with exactly 6 categories.

RULES:
- Each category must have exactly 2-3 bullet points.
- Each bullet must be SHORT (1-2 sentences max). No long paragraphs.
- Be factual, specific, and data-driven wherever possible.
- For Category 6 (Promoter Quality), actively check for known SEBI orders, court cases, high share pledging, or governance failures.
- Set hasRedFlag: true for Category 6 if ANY of these issues exist: SEBI enforcement action, criminal cases against promoters, promoter pledging > 50%, major related-party transaction controversies, accounting fraud allegations.
- Return ONLY valid JSON. No markdown, no code fences, no extra text.

Return this exact JSON structure:
{
  "companyName": "Full Company Name",
  "ticker": "TICKER.NS",
  "categories": [
    {
      "id": 1,
      "title": "Business Overview",
      "icon": "building",
      "color": "#06b6d4",
      "bullets": ["bullet 1", "bullet 2", "bullet 3"],
      "hasRedFlag": false
    },
    {
      "id": 2,
      "title": "Growth Outlook",
      "icon": "chart",
      "color": "#22c55e",
      "bullets": ["bullet 1", "bullet 2", "bullet 3"],
      "hasRedFlag": false
    },
    {
      "id": 3,
      "title": "Profitability & Margins",
      "icon": "money",
      "color": "#f59e0b",
      "bullets": ["bullet 1", "bullet 2", "bullet 3"],
      "hasRedFlag": false
    },
    {
      "id": 4,
      "title": "Capital Allocation & Capex",
      "icon": "construction",
      "color": "#a855f7",
      "bullets": ["bullet 1", "bullet 2", "bullet 3"],
      "hasRedFlag": false
    },
    {
      "id": 5,
      "title": "5-10 Year Sector View",
      "icon": "telescope",
      "color": "#f97316",
      "bullets": ["bullet 1", "bullet 2", "bullet 3"],
      "hasRedFlag": false
    },
    {
      "id": 6,
      "title": "Promoter Quality & Governance",
      "icon": "shield",
      "color": "#ef4444",
      "bullets": ["bullet 1", "bullet 2", "bullet 3"],
      "hasRedFlag": false
    }
  ]
}`;

// ── Category-specific guidance appended to user prompt ───────────────────────
const CATEGORY_GUIDANCE = `
Category 1 - Business Overview:
  - What the company does in one line
  - Its main revenue segments and their approximate revenue split
  - Which segment(s) are the primary growth drivers going forward

Category 2 - Growth Outlook:
  - Management revenue and profit growth guidance for next 2-3 years
  - Current order book size and expected order book trajectory
  - Key growth catalysts management has highlighted

Category 3 - Profitability & Margins:
  - Current OPM and NPM levels and trajectory (expanding / compressing / stable)
  - Key factors driving margin change (employee costs, pricing power, operating leverage)
  - Near-term margin guidance from management

Category 4 - Capital Allocation & Capex:
  - Any significant Capex underway or planned, and the investment amount
  - Expected revenue or capacity impact from this Capex
  - Debt levels and cash position; any dividend or buyback policy

Category 5 - 5-10 Year Sector View:
  - Is this sector structurally growing or in secular decline?
  - Key long-term tailwinds (e.g., digitisation, policy support, demographic trends)
  - Major risks or headwinds to the long-term thesis

Category 6 - Promoter Quality & Governance (CRITICAL - trust filter):
  - Any known SEBI enforcement orders, court cases, ED/CBI investigations against promoters
  - Promoter shareholding trend and pledging percentage (flag if > 50%)
  - Any governance concerns: related-party transactions, auditor resignations, accounting controversies
`;

// ── Icon map: string keys to emoji (avoids JSON encoding issues) ──────────────
const ICON_MAP = {
    building:     '🏢',
    chart:        '📈',
    money:        '💰',
    construction: '🏗️',
    telescope:    '🔭',
    shield:       '🛡️',
};

function resolveIcons(categories) {
    return categories.map((cat) => ({
        ...cat,
        icon: ICON_MAP[cat.icon] || cat.icon,
    }));
}

// ── Call the Gemini REST API ──────────────────────────────────────────────────
async function callGemini(model, userPrompt, apiKey, timeoutMs) {
    const body = {
        systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
            {
                role: 'user',
                parts: [{ text: userPrompt }],
            },
        ],
        generationConfig: {
            temperature: 0.2,
            // Flash models think before answering and thinking counts toward this
            // limit — leave room so the JSON is never cut off
            maxOutputTokens: 8192,
        },
    };

    const response = await axios.post(
        `${geminiUrl(model)}?key=${apiKey}`,
        body,
        { headers: { 'Content-Type': 'application/json' }, timeout: timeoutMs }
    );

    const candidate = response.data?.candidates?.[0];
    const usage = response.data?.usageMetadata || {};
    console.log(`[Gemini API] ${model} finish=${candidate?.finishReason} in=${usage.promptTokenCount} ` +
        `out=${usage.candidatesTokenCount} thinking=${usage.thoughtsTokenCount || 0}`);

    // Thinking models can split output across parts; thought parts are not the answer
    const text = (candidate?.content?.parts || [])
        .filter((p) => !p.thought)
        .map((p) => p.text || '')
        .join('');
    if (!text) throw new Error('Gemini returned an empty response');
    return text;
}

// Errors worth retrying on the next model: out of quota (429), model retired
// (404), Gemini overloaded or failing (5xx), or no response at all (timeout)
function shouldFallBack(err) {
    const status = err.response?.status;
    if (status) return status === 429 || status === 404 || status >= 500;
    return err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET';
}

// ── Generate a brief, falling back through GEMINI_MODELS ─────────────────────
async function generateBrief(userPrompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    let lastErr;
    for (const { id, label, timeoutMs } of GEMINI_MODELS) {
        try {
            const text = await callGemini(id, userPrompt, apiKey, timeoutMs);
            const result = parseGeminiResponse(text);
            result.model = label;
            return result;
        } catch (err) {
            lastErr = err;
            const detail = err.response
                ? `HTTP ${err.response.status} ${err.response.data?.error?.message || ''}`
                : err.message;
            console.error(`[Gemini API] ${id} failed: ${detail.slice(0, 200)}`);
            // Malformed JSON from one model is also worth a retry on the next
            const retryable = shouldFallBack(err) || err instanceof SyntaxError
                || err.message.startsWith('Invalid response structure');
            if (!retryable) throw err;
        }
    }
    throw lastErr;
}

// ── Parse and validate the JSON response ─────────────────────────────────────
function parseGeminiResponse(text) {
    const cleaned = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed.categories || parsed.categories.length !== 6) {
        throw new Error('Invalid response structure: expected 6 categories');
    }

    // Resolve icon keys to emojis. Red flags are reserved for Promoter Quality
    // (id 6) — the model sometimes sets them on other categories.
    parsed.categories = resolveIcons(parsed.categories).map((cat) => ({
        ...cat,
        hasRedFlag: cat.id === 6 ? cat.hasRedFlag === true : false,
    }));

    // The model has no clock and invents this date — always stamp it server-side
    parsed.analysedAt = new Date().toISOString();

    return parsed;
}

// ── Live data for name-based analysis ────────────────────────────────────────
// Without these the model answers from stale training data in vague terms.
// Both fail soft: the brief still runs if either source is down.

// Same pipeline as /api/fundamentals, so the brief and the Compounder Score agree
async function getFinancialSnapshot(ticker) {
    try {
        const rawData = await fetchFinancials(ticker, { endpoint: 'research' });
        const metrics = computeMetrics(rawData);
        const score = calculateCompounderScore(metrics);
        return { metrics, score: { total: score.totalScore, classification: score.classification } };
    } catch (err) {
        console.error('[AIResearch] fundamentals unavailable for', ticker, err.message);
        return null;
    }
}

const fmt = (v, suffix = '%') => (v === null || v === undefined ? 'n/a' : `${v}${suffix}`);

function formatSnapshot({ metrics: m, score }) {
    return `
--- VERIFIED FINANCIALS (Yahoo Finance, latest reported) ---
Sales growth: YoY ${fmt(m.growth?.sales?.yoy)}, 3y CAGR ${fmt(m.growth?.sales?.cagr3y)}
Profit growth: YoY ${fmt(m.growth?.profit?.yoy)}, 3y CAGR ${fmt(m.growth?.profit?.cagr3y)}
Margins: EBITDA ${fmt(m.profitability?.ebitdaMargin)}, OPM ${fmt(m.profitability?.opm)}, NPM ${fmt(m.profitability?.npm)}
Returns: ROE ${fmt(m.capitalEfficiency?.roe)}, ROCE ${fmt(m.capitalEfficiency?.roce)}, CFO/EBITDA ${fmt(m.capitalEfficiency?.cfoToEbitda, 'x')}
Balance sheet: Debt/Equity ${fmt(m.balanceSheet?.debtToEquity, 'x')}
Valuation: P/E ${fmt(m.valuation?.pe, 'x')}, PEG ${fmt(m.valuation?.peg, 'x')}, EV/EBITDA ${fmt(m.valuation?.evToEbitda, 'x')}
Capital Lens Compounder Score: ${score.total}/100 (${score.classification})
--- END FINANCIALS ---`;
}

function formatNews(news) {
    const lines = news.map((n) => `[${n.date || 'undated'}] ${n.title} (${n.source || 'unknown'})`);
    return `
--- RECENT NEWS HEADLINES (last 12 months, newest first) ---
${lines.join('\n')}
--- END NEWS ---`;
}

// ── Analyse by company name + ticker ─────────────────────────────────────────
// ticker is optional but enables the verified-financials block
async function analyseByCompanyName(companyName, ticker = null) {
    const cacheKey = cacheKeys.research(ticker || companyName);
    const cached = await getCache(cacheKey, { ticker });
    if (cached) return cached;

    const companyRef = ticker
        ? `${companyName} (NSE/BSE ticker: ${ticker})`
        : companyName;

    const [snapshot, news] = await Promise.all([
        ticker ? getFinancialSnapshot(ticker) : null,
        getRecentNews(companyName),
    ]);

    const today = new Date().toISOString().slice(0, 10);

    const userPrompt = `
Today's date is ${today}.
Analyse this Indian listed company for an equity investor:
Company: ${companyRef}
${snapshot ? formatSnapshot(snapshot) : ''}
${news.length ? formatNews(news) : ''}

HOW TO USE THE DATA ABOVE:
- The verified financials and news are more current than your training data. Where they conflict with what you remember, trust them.
- Quote specific figures (%, ₹ crore, $M, x) in every category where possible. Use the verified financials for growth, margins, returns and debt.
- Use the headlines for the latest results, guidance, order wins and especially Category 6: any SEBI action, probe, indictment, fraud allegation, pledge or auditor issue in the headlines must be mentioned, with its month and year.
- Supplement with your own knowledge of annual reports, earnings calls and SEBI filings, but never present remembered figures as current if the data above says otherwise.
If you know the ticker symbol, use it to set the "ticker" field in the JSON as "SYMBOL.NS".

${CATEGORY_GUIDANCE}

Return the JSON structure exactly as specified. Use string keys for icons (building, chart, money, construction, telescope, shield).`;

    const result = await generateBrief(userPrompt);

    // Shown under the brief so users can check where the claims came from
    result.sources = {
        financials: snapshot ? 'Yahoo Finance' : null,
        compounderScore: snapshot?.score || null,
        news: news.slice(0, 8),
    };

    await setCache(cacheKey, result, RESEARCH_CACHE_TTL, { ticker });
    return result;
}

// ── Analyse from PDF text ─────────────────────────────────────────────────────
async function analyseByPdfText(pdfText, originalFileName) {
    const truncated = pdfText.length > 100000
        ? pdfText.substring(0, 100000) + '\n\n[Document truncated for analysis]'
        : pdfText;

    const userPrompt = `
The following is text extracted from a company document: "${originalFileName}"

Analyse this document to build a 6-category investment research brief for an equity investor.
Use information from the document below, supplemented by your general knowledge about this company.

${CATEGORY_GUIDANCE}

--- DOCUMENT START ---
${truncated}
--- DOCUMENT END ---

Return the JSON structure exactly as specified. Use string keys for icons (building, chart, money, construction, telescope, shield).`;

    return generateBrief(userPrompt);
}

module.exports = { analyseByCompanyName, analyseByPdfText };
