import { useState, useRef, useCallback } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { Autocomplete, TextField } from '@mui/material';
import useTickerSearch from '../../../hooks/useTickerSearch';

/**
 * Dual-mode input panel:
 * - Primary: PDF drag-and-drop / file picker
 * - Secondary: Stock ticker autocomplete (same data source as GlobalSearchBar)
 *
 * onCompanySubmit receives (companyName, ticker) — both passed to AI for accuracy.
 */
export default function ResearchInputPanel({ onCompanySubmit, onPdfSubmit, loading }) {
    const [dragOver, setDragOver]     = useState(false);
    const [pdfFile, setPdfFile]       = useState(null);
    const [activeMode, setActiveMode] = useState('pdf'); // 'pdf' | 'text'
    const fileInputRef = useRef(null);

    // Ticker autocomplete — same hook as GlobalSearchBar
    const { query, setQuery, results } = useTickerSearch();
    const [selectedStock, setSelectedStock] = useState(null); // { name, symbol }

    // ── PDF handlers ─────────────────────────────────────────────────────────
    const handleFile = useCallback((file) => {
        if (!file) return;
        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file.');
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            alert('File too large. Maximum size is 20 MB.');
            return;
        }
        setPdfFile(file);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files?.[0]);
    }, [handleFile]);

    const handlePdfAnalyse = () => {
        if (pdfFile) onPdfSubmit(pdfFile);
    };

    // ── Stock selection handler ───────────────────────────────────────────────
    const handleStockSelect = (_, option) => {
        if (!option) { setSelectedStock(null); return; }
        setSelectedStock(option);
        setQuery(option.name); // show name in input after selection
    };

    const handleCompanyAnalyse = () => {
        if (selectedStock) {
            onCompanySubmit(selectedStock.name, selectedStock.symbol);
        }
    };

    const tabStyle = (mode) => ({
        px: 2.5,
        py: 1,
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.78rem',
        fontWeight: activeMode === mode ? 600 : 400,
        color: activeMode === mode ? '#e8e8ed' : '#5a5a6e',
        background: activeMode === mode ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: '1px solid',
        borderColor: activeMode === mode ? 'rgba(255,255,255,0.12)' : 'transparent',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        '&:hover': { color: '#8a8a9a' },
    });

    const canAnalyse = !!selectedStock && !loading;
    const canAnalysePdf = !!pdfFile && !loading;

    return (
        <Box>
            {/* Mode tabs */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Box sx={tabStyle('pdf')} onClick={() => setActiveMode('pdf')}>
                    📄 Upload PDF
                </Box>
                <Box sx={tabStyle('text')} onClick={() => setActiveMode('text')}>
                    🔍 Search Stock
                </Box>
            </Box>

            {/* ── PDF mode ─────────────────────────────────────────────────── */}
            {activeMode === 'pdf' && (
                <Box>
                    <Box
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        sx={{
                            border: '2px dashed',
                            borderColor: dragOver ? '#06b6d4' : pdfFile ? '#22c55e' : 'rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            p: 4,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            background: dragOver
                                ? 'rgba(6, 182, 212, 0.05)'
                                : pdfFile ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.02)',
                            '&:hover': {
                                borderColor: 'rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.03)',
                            },
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFile(e.target.files?.[0])}
                        />
                        <Typography sx={{ fontSize: '2rem', mb: 1 }}>
                            {pdfFile ? '✅' : '📁'}
                        </Typography>
                        {pdfFile ? (
                            <>
                                <Typography sx={{ color: '#22c55e', fontWeight: 600, fontSize: '0.9rem' }}>
                                    {pdfFile.name}
                                </Typography>
                                <Typography sx={{ color: '#5a5a6e', fontSize: '0.75rem', mt: 0.5 }}>
                                    {(pdfFile.size / 1024 / 1024).toFixed(1)} MB · Click to change
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Typography sx={{ color: '#8a8a9a', fontSize: '0.9rem', fontWeight: 500 }}>
                                    Drag & drop your PDF here
                                </Typography>
                                <Typography sx={{ color: '#5a5a6e', fontSize: '0.75rem', mt: 0.5 }}>
                                    Annual report, earnings transcript, concall notes · Max 20 MB
                                </Typography>
                            </>
                        )}
                    </Box>

                    <Box
                        component="button"
                        onClick={handlePdfAnalyse}
                        disabled={!canAnalysePdf}
                        id="research-analyse-pdf-btn"
                        sx={{
                            mt: 2, width: '100%', py: 1.5,
                            borderRadius: '10px', border: 'none',
                            cursor: canAnalysePdf ? 'pointer' : 'not-allowed',
                            background: canAnalysePdf
                                ? 'linear-gradient(135deg, #06b6d4, #22c55e)'
                                : 'rgba(255,255,255,0.04)',
                            color: canAnalysePdf ? '#000' : '#5a5a6e',
                            fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.04em',
                            transition: 'all 0.2s ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                            '&:hover:not(:disabled)': { opacity: 0.9, transform: 'translateY(-1px)' },
                        }}
                    >
                        {loading
                            ? <><CircularProgress size={16} sx={{ color: '#5a5a6e' }} /> Analysing…</>
                            : '✦ Analyse PDF'
                        }
                    </Box>
                </Box>
            )}

            {/* ── Stock search mode ─────────────────────────────────────────── */}
            {activeMode === 'text' && (
                <Box>
                    {/* MUI Autocomplete backed by tickers.json — same as GlobalSearchBar */}
                    <Autocomplete
                        options={results}
                        getOptionLabel={(opt) => opt.name}
                        inputValue={query}
                        onInputChange={(_, value, reason) => {
                            if (reason !== 'reset') {
                                setQuery(value);
                                if (!value) setSelectedStock(null);
                            }
                        }}
                        onChange={handleStockSelect}
                        value={selectedStock}
                        filterOptions={(x) => x}
                        disabled={loading}
                        noOptionsText={query.trim() ? 'No stocks found — try a different name' : 'Type company name or ticker…'}
                        renderOption={(props, option) => (
                            <Box
                                component="li"
                                {...props}
                                key={option.symbol}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 2, px: 2, py: 1,
                                }}
                            >
                                <Typography sx={{ fontSize: '0.85rem', color: '#e8e8ed' }}>
                                    {option.name}
                                </Typography>
                                <Typography sx={{ fontSize: '0.7rem', color: '#5a5a6e', fontFamily: 'monospace' }}>
                                    {option.symbol}
                                </Typography>
                            </Box>
                        )}
                        slotProps={{
                            paper: {
                                sx: {
                                    backgroundColor: '#12121a',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '10px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                                    mt: 0.5,
                                    '& .MuiAutocomplete-noOptions': { color: '#5a5a6e', fontSize: '0.8rem' },
                                    '& .MuiAutocomplete-option': {
                                        '&:hover, &[aria-selected="true"]': {
                                            backgroundColor: 'rgba(255,255,255,0.04)',
                                        },
                                    },
                                },
                            },
                        }}
                        fullWidth
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                id="research-company-input"
                                placeholder="Search by company name or ticker…"
                                variant="outlined"
                                size="small"
                                slotProps={{
                                    input: {
                                        ...params.InputProps,
                                        sx: {
                                            color: '#e8e8ed',
                                            fontSize: '0.9rem',
                                            backgroundColor: 'rgba(255,255,255,0.04)',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)', borderRadius: '10px' },
                                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                            '&.Mui-focused fieldset': { borderColor: '#06b6d4', borderWidth: '1px' },
                                            '& input::placeholder': { color: '#5a5a6e', opacity: 1 },
                                        },
                                    },
                                }}
                            />
                        )}
                    />

                    {/* Show selected stock confirmation */}
                    {selectedStock && (
                        <Box
                            sx={{
                                mt: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1.5,
                                py: 0.75,
                                background: 'rgba(34,197,94,0.07)',
                                border: '1px solid rgba(34,197,94,0.2)',
                                borderRadius: '8px',
                            }}
                        >
                            <Typography sx={{ fontSize: '0.72rem', color: '#22c55e' }}>✓</Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: '#c8c8d0' }}>
                                {selectedStock.name}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#5a5a6e', ml: 'auto', fontFamily: 'monospace' }}>
                                {selectedStock.symbol}
                            </Typography>
                        </Box>
                    )}

                    <Typography sx={{ color: '#5a5a6e', fontSize: '0.72rem', mt: 1.5, mb: 2 }}>
                        Select from NSE-listed companies. The AI uses SEBI filings, earnings calls & public records.
                    </Typography>

                    <Box
                        component="button"
                        onClick={handleCompanyAnalyse}
                        disabled={!canAnalyse}
                        id="research-analyse-company-btn"
                        sx={{
                            width: '100%', py: 1.5,
                            borderRadius: '10px', border: 'none',
                            cursor: canAnalyse ? 'pointer' : 'not-allowed',
                            background: canAnalyse
                                ? 'linear-gradient(135deg, #06b6d4, #22c55e)'
                                : 'rgba(255,255,255,0.04)',
                            color: canAnalyse ? '#000' : '#5a5a6e',
                            fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.04em',
                            transition: 'all 0.2s ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                            '&:hover:not(:disabled)': { opacity: 0.9, transform: 'translateY(-1px)' },
                        }}
                    >
                        {loading
                            ? <><CircularProgress size={16} sx={{ color: '#5a5a6e' }} /> Analysing…</>
                            : '✦ Analyse Company'
                        }
                    </Box>
                </Box>
            )}
        </Box>
    );
}
