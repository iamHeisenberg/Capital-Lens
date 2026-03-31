import { Box, Typography } from '@mui/material';
import PageLayout from '../../../components/layout/PageLayout';

const features = [
    { label: 'Growth Metrics', desc: 'Revenue & profit CAGR over 3 years', accent: '#f59e0b' },
    { label: 'Profitability', desc: 'EBITDA, operating, and net profit margins', accent: '#f59e0b' },
    { label: 'Capital Efficiency', desc: 'ROE, ROCE, and CFO/EBITDA quality', accent: '#f59e0b' },
    { label: 'Valuation', desc: 'PE, PEG, EV/EBITDA, and Market Cap/Sales', accent: '#f59e0b' },
    { label: 'Balance Sheet', desc: 'Debt-to-equity and financial health', accent: '#f59e0b' },
];

function FundamentalsDefault() {
    return (
        <PageLayout>
            <Box
                className="animate-fade-in-up delay-1"
                sx={{
                    pt: { xs: 8, md: 14 },
                    pb: { xs: 6, md: 10 },
                    maxWidth: 580,
                }}
            >
                <Typography
                    sx={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: '#5a5a6e',
                        letterSpacing: '0.14em',
                        mb: 3,
                    }}
                >
                    FUNDAMENTALS ANALYSIS
                </Typography>

                <Typography
                    variant="h2"
                    sx={{
                        fontWeight: 700,
                        color: '#e8e8ed',
                        letterSpacing: '-0.02em',
                        mb: 2,
                        fontSize: { xs: '2rem', md: '2.5rem' },
                    }}
                >
                    Business quality,
                    <br />
                    quantified.
                </Typography>

                <Typography
                    sx={{
                        fontSize: '0.95rem',
                        color: '#5a5a6e',
                        lineHeight: 1.8,
                        mb: 6,
                    }}
                >
                    Evaluate any NSE stock across five financial dimensions calibrated
                    for the Indian market. Identify durable compounders using a
                    structured, repeatable scoring framework.
                </Typography>

                {/* Feature list */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 6 }}>
                    {features.map((f) => (
                        <Box
                            key={f.label}
                            className="glass-card"
                            sx={{ px: 2.5, py: 1.75, display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                            <Box
                                sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: f.accent,
                                    flexShrink: 0,
                                }}
                            />
                            <Box>
                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#e8e8ed' }}>
                                    {f.label}
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#5a5a6e' }}>
                                    {f.desc}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>

                {/* CTA */}
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 3,
                        py: 1.5,
                        borderRadius: '10px',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        backgroundColor: 'rgba(245, 158, 11, 0.06)',
                    }}
                >
                    <Box
                        sx={{
                            width: 6, height: 6, borderRadius: '50%',
                            backgroundColor: '#f59e0b',
                            animation: 'pulse 2s infinite',
                        }}
                    />
                    <Typography sx={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 500 }}>
                        Search for a stock above to begin
                    </Typography>
                </Box>
            </Box>
        </PageLayout>
    );
}

export default FundamentalsDefault;
