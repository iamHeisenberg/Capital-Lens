const axios = require('axios');

// ── Recent company headlines via Google News RSS ─────────────────────────────
// Gives the AI brief information newer than the model's training data.
// NOTE: Google's feed terms allow personal, non-commercial use only. Swap this
// module for a licensed news API before commercial launch — callers only rely on
// getRecentNews() returning [{ title, source, date, url }].

const RSS_URL = 'https://news.google.com/rss/search';
const MAX_PER_QUERY = 8;

function decodeEntities(str) {
    return str
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

function tag(xml, name) {
    const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
    return m ? decodeEntities(m[1]).trim() : null;
}

function parseRss(xml) {
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    return items.slice(0, MAX_PER_QUERY).map((item) => {
        const source = tag(item, 'source');
        let title = tag(item, 'title') || '';
        // Google appends " - Publisher" to every title
        if (source && title.endsWith(` - ${source}`)) {
            title = title.slice(0, -(source.length + 3));
        }
        const pubDate = tag(item, 'pubDate');
        return {
            title,
            source,
            date: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : null,
            url: tag(item, 'link'),
        };
    });
}

async function searchNews(query) {
    const { data } = await axios.get(RSS_URL, {
        params: { q: `${query} when:1y`, hl: 'en-IN', gl: 'IN', ceid: 'IN:en' },
        timeout: 8000,
        responseType: 'text',
    });
    return parseRss(data);
}

/**
 * Headlines from the last 12 months, newest first: one query for results and
 * guidance, one for governance issues (feeds the promoter red-flag check).
 * Never throws — returns [] if the feed is unavailable.
 */
async function getRecentNews(companyName) {
    const name = `"${companyName}"`;
    const queries = [
        `${name} results OR guidance OR outlook OR order`,
        `${name} SEBI OR probe OR fraud OR pledge OR court OR penalty OR resigns`,
    ];

    const settled = await Promise.allSettled(queries.map(searchNews));
    settled
        .filter((r) => r.status === 'rejected')
        .forEach((r) => console.error('[NewsService] feed failed:', r.reason.message));

    const seen = new Set();
    return settled
        .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
        .filter((n) => n.title && !seen.has(n.title) && seen.add(n.title))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

module.exports = { getRecentNews };
