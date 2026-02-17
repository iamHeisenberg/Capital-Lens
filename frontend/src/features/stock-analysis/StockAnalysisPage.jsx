import {
    Box,
    Typography,
    Grid
} from '@mui/material';
import PageLayout from '../../components/layout/PageLayout';
import useStockData from './hooks/useStockData';
import { calcDistance, getInterpretation } from './utils/interpretation';
import PriceCard from './components/PriceCard';
import TrendCard from './components/TrendCard';
import InterpretationCard from './components/InterpretationCard';

function LoadingSkeleton() {
    return (
        <PageLayout>
            <Box sx={{ py: 4 }}>
                <Box className="skeleton-pulse" sx={{ height: 48, width: '60%', mb: 2 }} />
                <Box className="skeleton-pulse" sx={{ height: 20, width: '40%', mb: 6 }} />
                <Box className="skeleton-pulse" sx={{ height: 24, width: '30%', mb: 1 }} />
                <Box className="skeleton-pulse" sx={{ height: 18, width: '25%', mb: 4 }} />
                <Box className="skeleton-pulse" sx={{ height: 240, width: '100%', mb: 4 }} />
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <Box className="skeleton-pulse" sx={{ height: 200 }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box className="skeleton-pulse" sx={{ height: 200 }} />
                    </Grid>
                </Grid>
            </Box>
        </PageLayout>
    );
}

function StockAnalysisPage() {
    const ticker = 'RELIANCE.NS';
    const { data, loading, error } = useStockData(ticker);

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return (
            <PageLayout>
                <Box
                    className="glass-card"
                    sx={{
                        p: 4,
                        mt: 4,
                        borderLeft: '3px solid #ef4444',
                    }}
                >
                    <Typography sx={{ color: '#ef4444', fontWeight: 500 }}>
                        {error}
                    </Typography>
                </Box>
            </PageLayout>
        );
    }

    const distFromDma50 = calcDistance(data.latestClose, data.dma50);
    const distFromDma200 = calcDistance(data.latestClose, data.dma200);
    const priceAbove200 = data.latestClose > data.dma200;
    const dma50Above200 = data.dma50 > data.dma200;
    const interpretation = getInterpretation(data);

    return (
        <PageLayout>
            {/* Ticker Header */}
            <Box
                className="animate-fade-in-up delay-1"
                sx={{
                    mb: 5,
                    pb: 3,
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
                        CURRENT ANALYSIS
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            color: '#e8e8ed',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {data.ticker}
                    </Typography>
                </Box>
                <Typography variant="body2">
                    Last Updated: {new Date(data.lastUpdated).toLocaleString()}
                </Typography>
            </Box>

            {/* Main Grid */}
            <Grid container spacing={4}>
                <PriceCard
                    latestClose={data.latestClose}
                    dma50={data.dma50}
                    dma200={data.dma200}
                    distFromDma50={distFromDma50}
                    distFromDma200={distFromDma200}
                />
                <TrendCard
                    trend={data.trend}
                    priceAbove200={priceAbove200}
                    dma50Above200={dma50Above200}
                />
                <InterpretationCard interpretation={interpretation} />
            </Grid>
        </PageLayout>
    );
}

export default StockAnalysisPage;
