import {
    Box,
    Typography,
    CircularProgress,
    Grid
} from '@mui/material';
import PageLayout from '../../components/layout/PageLayout';
import useStockData from './hooks/useStockData';
import { calcDistance, getInterpretation } from './utils/interpretation';
import PriceCard from './components/PriceCard';
import TrendCard from './components/TrendCard';
import InterpretationCard from './components/InterpretationCard';

function StockAnalysisPage() {
    const ticker = 'RELIANCE.NS';
    const { data, loading, error } = useStockData(ticker);

    if (loading) {
        return (
            <PageLayout>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh'
                }}>
                    <CircularProgress size={32} sx={{ color: '#666' }} />
                </Box>
            </PageLayout>
        );
    }

    if (error) {
        return (
            <PageLayout>
                <Typography color="error">{error}</Typography>
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
            {/* Hero Section */}
            <Box sx={{ mb: 6 }}>
                <Typography sx={{
                    fontSize: '3rem',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                    mb: 1
                }}>
                    Structural Discipline.
                    <br />
                    <span style={{ color: '#666', fontWeight: 400 }}>Indian Equities.</span>
                </Typography>
                <Typography sx={{
                    fontSize: '0.95rem',
                    color: '#666',
                    mt: 2,
                    maxWidth: '600px'
                }}>
                    A systematic framework for trend-based investing in NSE stocks.
                </Typography>
            </Box>

            {/* Ticker Header */}
            <Box sx={{ mb: 4, borderBottom: '1px solid #2a2a2a', pb: 2 }}>
                <Typography variant="h6" sx={{ color: '#666', mb: 0.5 }}>
                    CURRENT ANALYSIS
                </Typography>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff' }}>
                    {data.ticker}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#666', mt: 0.5 }}>
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
