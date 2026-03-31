import { Box, Typography } from '@mui/material';
import PageLayout from '../../../components/layout/PageLayout';

const features = [
    { label: 'DMA Trend Detection', desc: '50-day and 200-day moving average signals' },
    { label: 'Structural Bias', desc: 'Uptrend, downtrend, or neutral classification' },
    { label: 'Price Positioning', desc: 'Distance from key moving averages' },
];

function AnalysisDefault() {
    return (
        <PageLayout>
            <Box
                className="animate-fade-in-up delay-1"
                sx={{
                    pt: { xs: 8, md: 14 },
                    pb: { xs: 6, md: 10 },
                    maxWidth: 560,
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
                    STOCK ANALYSIS
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
                    Trend-based analysis
                    <br />
                    for NSE equities.
                </Typography>

                <Typography
                    sx={{
                        fontSize: '0.95rem',
                        color: '#5a5a6e',
                        lineHeight: 1.8,
                        mb: 6,
                    }}
                >
                    Analyze the structural trend of any NSE stock using
                    moving-average confirmation. Identify momentum and
                    positioning with a disciplined, rule-based framework.
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
                                    backgroundColor: '#22c55e',
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
                        border: '1px solid rgba(34, 197, 94, 0.25)',
                        backgroundColor: 'rgba(34, 197, 94, 0.06)',
                    }}
                >
                    <Box
                        sx={{
                            width: 6, height: 6, borderRadius: '50%',
                            backgroundColor: '#22c55e',
                            animation: 'pulse 2s infinite',
                        }}
                    />
                    <Typography sx={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 500 }}>
                        Search for a stock above to begin
                    </Typography>
                </Box>
            </Box>
        </PageLayout>
    );
}

export default AnalysisDefault;
