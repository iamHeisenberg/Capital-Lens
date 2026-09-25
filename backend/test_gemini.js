require('dotenv').config();
const axios = require('axios');

// v1beta with gemini-3.5-flash-lite (successor to retired gemini-2.0-flash-lite)
const GEMINI_MODEL   = 'gemini-3.5-flash-lite';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Key present:', !!apiKey, '| Model:', GEMINI_MODEL);

    const body = {
        contents: [
            {
                role: 'user',
                parts: [{ text: 'Reply with this exact JSON only: {"test": "ok", "status": "working"}' }],
            },
        ],
        generationConfig: { temperature: 0, maxOutputTokens: 50 },
    };

    try {
        const res = await axios.post(
            `${GEMINI_API_URL}?key=${apiKey}`,
            body,
            { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
        );
        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('SUCCESS! Response:', text);
    } catch (err) {
        console.error('HTTP status:', err.response?.status);
        console.error('Error:', err.response?.data?.error?.message || err.message);
    }
}

test();
