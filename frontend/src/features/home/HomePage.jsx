import { Box, Typography, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';

const features = [
    {
        title: 'Stock Analysis',
        description: 'Real-time DMA-based structural trend analysis for NSE equities. Track 50 & 200-day moving averages with systematic bias interpretation.',
        path: '/analysis',
        cta: 'Open Analysis',
        accent: '#22c55e',
    },
    {
        title: 'Methodology',
        description: 'A five-layer investment framework — from durable business quality to AI-augmented risk validation. Built for long-term compounders.',
        path: '/methodology',
        cta: 'Read Framework',
        accent: '#06b6d4',
    },
];

function FeatureCard({ feature, delay }) {
    return (
        <Link to={feature.path} style={{ textDecoration: 'none', flex: '1 1 360px' }}>
            <Box
                className={`glass-card animate-fade-in-up delay-${delay}`}
                sx={{
                    p: { xs: 4, md: 5 },
                    height: '100%',
                    cursor: 'pointer',
                    borderTop: `2px solid ${feature.accent}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 240,
                }}
            >
                <Box>
                    <Typography
                        sx={{
                            fontSize: '1.3rem',
                            fontWeight: 600,
                            color: '#e8e8ed',
                            mb: 2,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {feature.title}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '0.9rem',
                            color: '#5a5a6e',
                            lineHeight: 1.7,
                        }}
                    >
                        {feature.description}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 3,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: feature.accent,
                            letterSpacing: '0.04em',
                            transition: 'letter-spacing 0.3s ease',
                        }}
                    >
                        {feature.cta}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '0.9rem',
                            color: feature.accent,
                            transition: 'transform 0.3s ease',
                            '.glass-card:hover &': { transform: 'translateX(4px)' },
                        }}
                    >
                        →
                    </Typography>
                </Box>
            </Box>
        </Link>
    );
}

function HomePage() {
    return (
        <PageLayout>
            {/* Hero */}
            <Box
                className="animate-fade-in-up delay-1"
                sx={{
                    pt: { xs: 6, md: 12 },
                    pb: { xs: 8, md: 14 },
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
                    SYSTEMATIC EQUITY ANALYSIS
                </Typography>
                <Typography
                    variant="h1"
                    className="gradient-text"
                    sx={{ mb: 1 }}
                >
                    Structural Discipline.
                </Typography>
                <Typography
                    variant="h1"
                    sx={{ color: '#1e1e2e', fontWeight: 400, mb: 4 }}
                >
                    Indian Equities.
                </Typography>
                <Typography
                    sx={{
                        fontSize: '1.05rem',
                        color: '#5a5a6e',
                        lineHeight: 1.8,
                        maxWidth: 520,
                    }}
                >
                    A rule-based framework for trend-based investing in NSE stocks.
                    Built on moving average confirmation, multi-layer fundamental
                    analysis, and structural discipline.
                </Typography>
            </Box>

            {/* Divider */}
            <Box
                className="animate-fade-in delay-2"
                sx={{
                    height: '1px',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.06), transparent 70%)',
                    mb: 6,
                }}
            />

            {/* Feature Cards */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 4,
                    flexWrap: 'wrap',
                    mb: 12,
                }}
            >
                {features.map((feature, i) => (
                    <FeatureCard
                        key={feature.path}
                        feature={feature}
                        delay={i + 3}
                    />
                ))}
            </Box>

            {/* Bottom tagline */}
            <Box className="animate-fade-in delay-5" sx={{ pb: 8 }}>
                <Typography
                    sx={{
                        fontSize: '0.7rem',
                        color: '#2a2a3e',
                        letterSpacing: '0.12em',
                    }}
                >
                    COMPOUNDING REQUIRES DISCIPLINE, NOT EXCITEMENT.
                </Typography>
            </Box>
        </PageLayout>
    );
}

export default HomePage;
