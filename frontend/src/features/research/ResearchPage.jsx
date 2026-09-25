import { Box, Container, Typography, CircularProgress } from '@mui/material';
import PageLayout from '../../components/layout/PageLayout';
import useResearch from './hooks/useResearch';
import ResearchInputPanel from './components/ResearchInputPanel';
import ResearchResultPanel from './components/ResearchResultPanel';

// ── Loading overlay shown while Gemini processes ──────────────────────────────
function AnalysingOverlay() {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 10,
                gap: 3,
            }}
        >
            {/* Animated ring */}
            <Box sx={{ position: 'relative', width: 72, height: 72 }}>
                <CircularProgress
                    size={72}
                    thickness={1.5}
                    sx={{
                        color: '#06b6d4',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.6rem',
                    }}
                >
                    ✦
                </Box>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ color: '#e8e8ed', fontWeight: 600, fontSize: '1rem' }}>
                    AI is analysing…
                </Typography>
                <Typography sx={{ color: '#5a5a6e', fontSize: '0.8rem', mt: 0.5 }}>
                    Reading filings, earnings calls & SEBI records
                </Typography>
            </Box>
        </Box>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ResearchPage() {
    const { result, loading, error, reset, runCompanyAnalysis, runPdfAnalysis } = useResearch();

    return (
        <PageLayout>
            {/* ── Hero Header ─────────────────────────────────────────────── */}
            {!result && (
                <Box
                    className="animate-fade-in-up delay-1"
                    sx={{ textAlign: 'center', pt: { xs: 4, md: 6 }, pb: 5 }}
                >
                    {/* Badge */}
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                            background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(34,197,94,0.12))',
                            border: '1px solid rgba(6,182,212,0.25)',
                            borderRadius: '20px',
                            px: 2,
                            py: 0.5,
                            mb: 3,
                        }}
                    >
                        <Typography sx={{ fontSize: '0.72rem', color: '#06b6d4', fontWeight: 700, letterSpacing: '0.1em' }}>
                            ✦ AI RESEARCH ENGINE
                        </Typography>
                    </Box>

                    <Typography
                        variant="h1"
                        sx={{
                            fontSize: { xs: '2rem', md: '2.8rem' },
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            lineHeight: 1.1,
                            mb: 2,
                            background: 'linear-gradient(135deg, #e8e8ed 0%, #6a6a7a 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Research any company
                        <br />in 30 seconds.
                    </Typography>

                    <Typography
                        sx={{
                            fontSize: { xs: '0.88rem', md: '1rem' },
                            color: '#5a5a6e',
                            maxWidth: 520,
                            mx: 'auto',
                            lineHeight: 1.6,
                        }}
                    >
                        Upload an annual report or type a company name. Get a structured 6-category investment brief — including a promoter integrity check.
                    </Typography>

                    {/* 6 category pills */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            justifyContent: 'center',
                            mt: 3,
                        }}
                    >
                        {[
                            { label: 'Business Overview',          color: '#06b6d4' },
                            { label: 'Growth Outlook',             color: '#22c55e' },
                            { label: 'Profitability & Margins',    color: '#f59e0b' },
                            { label: 'Capital Allocation',         color: '#a855f7' },
                            { label: '5–10 Year Sector View',      color: '#f97316' },
                            { label: 'Promoter Quality',           color: '#ef4444' },
                        ].map(({ label, color }) => (
                            <Box
                                key={label}
                                sx={{
                                    px: 1.5,
                                    py: 0.4,
                                    borderRadius: '20px',
                                    background: `${color}15`,
                                    border: `1px solid ${color}30`,
                                    fontSize: '0.7rem',
                                    color,
                                    fontWeight: 500,
                                    letterSpacing: '0.02em',
                                }}
                            >
                                {label}
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* ── Input + Output area ──────────────────────────────────────── */}
            <Container
                maxWidth={result ? 'lg' : 'sm'}
                disableGutters
                sx={{ transition: 'max-width 0.3s ease' }}
            >
                {/* Input panel — hidden once result is shown */}
                {!result && !loading && (
                    <Box
                        className="animate-fade-in-up delay-2"
                        sx={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '16px',
                            p: { xs: 2.5, md: 3.5 },
                            backdropFilter: 'blur(16px)',
                        }}
                    >
                        <ResearchInputPanel
                            onCompanySubmit={(name, ticker) => runCompanyAnalysis(name, ticker)}
                            onPdfSubmit={runPdfAnalysis}
                            loading={loading}
                        />
                    </Box>
                )}

                {/* Loading state */}
                {loading && <AnalysingOverlay />}

                {/* Error state */}
                {error && !loading && (
                    <Box
                        sx={{
                            background: 'rgba(239, 68, 68, 0.06)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            p: 3,
                            mt: 2,
                            textAlign: 'center',
                        }}
                    >
                        <Typography sx={{ color: '#ef4444', fontWeight: 500, mb: 1 }}>
                            ⚠ Analysis Failed
                        </Typography>
                        <Typography sx={{ color: '#8a8a9a', fontSize: '0.85rem', mb: 2 }}>
                            {error}
                        </Typography>
                        <Box
                            component="button"
                            onClick={reset}
                            sx={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                px: 2,
                                py: 0.75,
                                color: '#8a8a9a',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                '&:hover': { color: '#e8e8ed' },
                            }}
                        >
                            Try Again
                        </Box>
                    </Box>
                )}

                {/* Results */}
                {result && !loading && (
                    <ResearchResultPanel result={result} onReset={reset} />
                )}
            </Container>
        </PageLayout>
    );
}
