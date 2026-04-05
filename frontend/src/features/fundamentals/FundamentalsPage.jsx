import { Box, Typography } from '@mui/material';
import { useParams, Link } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import useFundamentals from './hooks/useFundamentals';
import CompounderScoreCard from './components/CompounderScoreCard';
import ValuationCard from './components/ValuationCard';
import GrowthCard from './components/GrowthCard';
import ProfitabilityCard from './components/ProfitabilityCard';
import EfficiencyCard from './components/EfficiencyCard';
import BalanceSheetCard from './components/BalanceSheetCard';
import FundamentalsDefault from './components/FundamentalsDefault';
import StockViewToggle from '../../components/shared/StockViewToggle';

function LoadingSkeleton() {
    return (
        <PageLayout>
            <Box sx={{ py: 4 }}>
                <Box className="skeleton-pulse" sx={{ height: 48, width: '60%', mb: 2 }} />
                <Box className="skeleton-pulse" sx={{ height: 20, width: '40%', mb: 4 }} />
                <Box className="skeleton-pulse" sx={{ height: 120, width: '100%', mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {[...Array(5)].map((_, i) => (
                        <Box key={i} className="skeleton-pulse" sx={{ flex: 1, height: 300 }} />
                    ))}
                </Box>
            </Box>
        </PageLayout>
    );
}

function FundamentalsPage() {
    const { ticker: rawTicker } = useParams();
    const ticker = rawTicker?.toUpperCase();
    const { data, loading, error } = useFundamentals(ticker);

    // No ticker in URL — show default landing page
    if (!ticker) {
        return <FundamentalsDefault />;
    }

    if (loading || !data) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return (
            <PageLayout>
                <Box
                    className="glass-card"
                    sx={{ p: 4, mt: 4, borderLeft: '3px solid #ef4444' }}
                >
                    <Typography sx={{ color: '#5a5a6e', fontSize: '0.8rem', mb: 1 }}>
                        {ticker}
                    </Typography>
                    <Typography sx={{ color: '#ef4444', fontWeight: 500 }}>
                        {error}
                    </Typography>
                </Box>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            {/* Ticker Header */}
            <Box
                className="animate-fade-in-up delay-1"
                sx={{
                    mb: 3,
                    pb: 2,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                        FUNDAMENTALS
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            color: '#e8e8ed',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {data.fundamentals?.ticker || ticker}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <StockViewToggle ticker={ticker} current="fundamentals" />
                    <Typography variant="body2">
                        Source: Yahoo Finance (Consolidated)
                    </Typography>
                </Box>
            </Box>

            <CompounderScoreCard score={data.score} />

            {/* 5 Cards — Single horizontal row */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
                    gap: 2,
                    alignItems: 'start',
                }}
            >
                <ValuationCard
                    valuation={data.fundamentals?.valuation}
                    metricScores={data.score?.metricBreakdown?.valuation}
                />
                <GrowthCard
                    growth={data.fundamentals?.growth}
                    metricScores={data.score?.metricBreakdown?.growth}
                />
                <ProfitabilityCard
                    profitability={data.fundamentals?.profitability}
                    metricScores={data.score?.metricBreakdown?.profitability}
                />
                <EfficiencyCard
                    capitalEfficiency={data.fundamentals?.capitalEfficiency}
                    metricScores={data.score?.metricBreakdown?.capitalEfficiency}
                />
                <BalanceSheetCard
                    balanceSheet={data.fundamentals?.balanceSheet}
                    metricScores={data.score?.metricBreakdown?.balanceSheet}
                />
            </Box>

            {/* Data Source Footer */}
            <Typography
                variant="caption"
                sx={{ display: 'block', mt: 3, color: '#5a5a6e' }}
            >
                Data: Yahoo Finance · fundamentalsTimeSeries API (Consolidated Annual) · Color thresholds calibrated for Indian market
            </Typography>
        </PageLayout>
    );
}

export default FundamentalsPage;
