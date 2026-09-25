const express = require('express');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const { analyseByCompanyName, analyseByPdfText } = require('../services/aiResearchService');

const router = express.Router();

// Multer — memory storage (no disk writes), PDF only, 20MB max
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            const err = new Error('Only PDF files are accepted');
            err.code = 'INVALID_FILE_TYPE';
            cb(err, false);
        }
    },
});

// Multer runs before the route handler, so its errors never reach the handler's
// try/catch. Invoke it manually and translate its errors into JSON responses.
function uploadPdf(req, res, next) {
    upload.single('pdf')(req, res, (err) => {
        if (!err) return next();

        if (err.code === 'INVALID_FILE_TYPE') {
            return res.status(400).json({ error: 'Only PDF files are accepted.' });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'PDF too large. Maximum size is 20 MB.' });
        }
        console.error('[ResearchRoute] PDF upload failed:', err.message);
        return res.status(400).json({ error: 'Upload failed. Send a single PDF using field name "pdf".' });
    });
}

// ── POST /api/research/company ─────────────────────────────────────────────────
// Body: { companyName: "Persistent Systems Ltd", ticker: "PERSISTENT.NS" }
router.post('/research/company', async (req, res) => {
    const { companyName, ticker } = req.body;

    if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
        return res.status(400).json({ error: 'companyName is required (min 2 characters)' });
    }

    try {
        const result = await analyseByCompanyName(companyName.trim(), ticker?.trim() || null);
        return res.json({ success: true, data: result });
    } catch (err) {
        console.error('[ResearchRoute] company analysis failed:', err.message);

        // Surface a clean error to the client
        if (err.message.includes('API_KEY')) {
            return res.status(500).json({ error: 'AI service not configured — check GEMINI_API_KEY' });
        }
        if (err.response?.status === 429) {
            return res.status(429).json({ error: 'The free AI quota for today is used up. Please try again tomorrow.' });
        }
        if (err.message.includes('JSON')) {
            return res.status(502).json({ error: 'AI returned an unexpected format. Please try again.' });
        }
        return res.status(500).json({ error: 'Analysis failed. Please try again in a moment.' });
    }
});

// ── POST /api/research/pdf ─────────────────────────────────────────────────────
// Multipart form: field name "pdf", single file
router.post('/research/pdf', uploadPdf, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No PDF file received. Upload a PDF using field name "pdf".' });
    }

    try {
        // Extract text from the uploaded PDF buffer
        const parser = new PDFParse({ data: req.file.buffer });
        let parsed;
        try {
            parsed = await parser.getText();
        } finally {
            await parser.destroy();
        }

        if (!parsed.text || parsed.text.trim().length < 100) {
            return res.status(422).json({
                error: 'PDF appears to be empty or image-only (scanned). Please upload a text-based PDF.',
            });
        }

        const result = await analyseByPdfText(parsed.text, req.file.originalname);
        return res.json({ success: true, data: result, pageCount: parsed.total });
    } catch (err) {
        console.error('[ResearchRoute] PDF analysis failed:', err.message);

        if (err.response?.status === 429) {
            return res.status(429).json({ error: 'The free AI quota for today is used up. Please try again tomorrow.' });
        }
        if (err.message.includes('JSON')) {
            return res.status(502).json({ error: 'AI returned an unexpected format. Please try again.' });
        }
        return res.status(500).json({ error: 'PDF analysis failed. Please try again.' });
    }
});

module.exports = router;
