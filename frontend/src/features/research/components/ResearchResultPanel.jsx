import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import CategoryCard from './CategoryCard';

/**
 * Renders the 6 colour-coded category cards after AI analysis completes.
 */
export default function ResearchResultPanel({ result, onReset }) {
    if (!result) return null;

    const redFlagCount = result.categories?.filter((c) => c.hasRedFlag).length ?? 0;
    const score = result.sources?.compounderScore;
    const news = result.sources?.news ?? [];

    return (
        <Box className="animate-fade-in-up delay-1">
            {/* Result Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 3,
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                <Box>
                    <Typography
                        sx={{
                            fontSize: '0.7rem',
                            color: '#5a5a6e',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            mb: 0.5,
                        }}
                    >
                        AI Research Brief
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '1.4rem',
                            fontWeight: 700,
                            color: '#e8e8ed',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {result.companyName}
                    </Typography>
                    {result.ticker && (
                        <Typography sx={{ fontSize: '0.8rem', color: '#5a5a6e', mt: 0.25 }}>
                            {result.ticker}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    {/* Compounder Score badge — links to the full score breakdown */}
                    {score && result.ticker && (
                        <Box
                            component={Link}
                            to={`/fundamentals/${result.ticker}`}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                                background: 'rgba(6, 182, 212, 0.1)',
                                border: '1px solid rgba(6, 182, 212, 0.3)',
                                borderRadius: '8px',
                                px: 1.5,
                                py: 0.75,
                                textDecoration: 'none',
                                '&:hover': { borderColor: 'rgba(6, 182, 212, 0.6)' },
                            }}
                        >
                            <Typography sx={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 600 }}>
                                Compounder Score {score.total}/100 · {score.classification}
                            </Typography>
                        </Box>
                    )}

                    {/* Red flag summary badge */}
                    {redFlagCount > 0 && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                px: 1.5,
                                py: 0.75,
                            }}
                        >
                            <Typography sx={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                                ⚠ {redFlagCount} Red Flag{redFlagCount > 1 ? 's' : ''} Found
                            </Typography>
                        </Box>
                    )}

                    {/* Analyse another button */}
                    <Box
                        component="button"
                        onClick={onReset}
                        id="research-analyse-another-btn"
                        sx={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            px: 2,
                            py: 0.75,
                            color: '#8a8a9a',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': { color: '#e8e8ed', borderColor: 'rgba(255,255,255,0.2)' },
                        }}
                    >
                        ← Analyse Another
                    </Box>
                </Box>
            </Box>

            {/* Disclaimer */}
            <Box
                sx={{
                    background: 'rgba(245, 158, 11, 0.06)',
                    border: '1px solid rgba(245, 158, 11, 0.15)',
                    borderRadius: '8px',
                    px: 2,
                    py: 1,
                    mb: 3,
                }}
            >
                <Typography sx={{ fontSize: '0.72rem', color: '#a07830', lineHeight: 1.5 }}>
                    ⚠ For informational purposes only. Not investment advice. Always verify with primary sources before investing.
                </Typography>
            </Box>

            {/* 6 Category Cards — responsive grid */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                    },
                    gap: 2,
                    alignItems: 'start',
                }}
            >
                {result.categories?.map((cat, i) => (
                    <CategoryCard
                        key={cat.id}
                        title={cat.title}
                        icon={cat.icon}
                        color={cat.color}
                        bullets={cat.bullets}
                        hasRedFlag={cat.hasRedFlag}
                        delay={i}
                    />
                ))}
            </Box>

            {/* Sources — what the brief was grounded on (name-based analysis only) */}
            {(result.sources?.financials || news.length > 0) && (
                <Box
                    sx={{
                        mt: 3,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                        px: 2,
                        py: 1.5,
                    }}
                >
                    <Typography sx={{ fontSize: '0.7rem', color: '#5a5a6e', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1 }}>
                        Sources
                    </Typography>
                    {result.sources.financials && (
                        <Typography sx={{ fontSize: '0.75rem', color: '#8a8a9a', mb: 0.75 }}>
                            Financial metrics: {result.sources.financials} (latest reported)
                        </Typography>
                    )}
                    {news.map((n) => (
                        <Typography key={n.url} sx={{ fontSize: '0.75rem', color: '#8a8a9a', lineHeight: 1.7 }}>
                            <Box component="span" sx={{ color: '#5a5a6e', fontFamily: 'monospace', mr: 1 }}>
                                {n.date}
                            </Box>
                            <Box
                                component="a"
                                href={n.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: '#8a8a9a', textDecoration: 'none', '&:hover': { color: '#06b6d4' } }}
                            >
                                {n.title}
                            </Box>
                            {n.source && <Box component="span" sx={{ color: '#5a5a6e' }}> · {n.source}</Box>}
                        </Typography>
                    ))}
                </Box>
            )}

            {/* Footer */}
            <Typography
                sx={{
                    mt: 3,
                    fontSize: '0.7rem',
                    color: '#5a5a6e',
                    textAlign: 'right',
                }}
            >
                Powered by {result.model || 'Gemini'} · Analysed {result.analysedAt ? new Date(result.analysedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'just now'}
            </Typography>
        </Box>
    );
}
