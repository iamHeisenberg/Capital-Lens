import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    CircularProgress,
    Grid
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// QT Capital-inspired dark theme
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#0a0a0a',
            paper: '#141414',
        },
        text: {
            primary: '#ffffff',
            secondary: '#a0a0a0',
        },
        divider: '#2a2a2a',
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
        h1: {
            fontSize: '4rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
        },
        h6: {
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#666666',
        },
        body1: {
            fontSize: '0.95rem',
            lineHeight: 1.7,
        },
    },
});

function StockAnalysis() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const ticker = 'RELIANCE.NS';

    useEffect(() => {
        fetch(`http://localhost:5000/api/price/${ticker}`)
            .then((res) => res.json())
            .then((result) => {
                if (result.error) {
                    setError(result.error);
                } else {
                    setData(result);
                }
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const calcDistance = (price, dma) => {
        if (!dma) return null;
        return ((price - dma) / dma * 100).toFixed(2);
    };

    const getInterpretation = () => {
        if (!data) return { bias: '', structure: '', position: '' };
        const distFromDma50 = calcDistance(data.latestClose, data.dma50);

        if (data.trend === 'Uptrend') {
            return {
                bias: 'Bullish',
                structure: 'Price and 50 DMA above 200 DMA confirms structural uptrend',
                position: distFromDma50 > 5
                    ? 'Extended — wait for pullback to 50 DMA zone'
                    : 'Favorable — near support for trend continuation'
            };
        } else if (data.trend === 'Downtrend') {
            return {
                bias: 'Bearish',
                structure: 'Price and 50 DMA below 200 DMA confirms structural downtrend',
                position: distFromDma50 < -5
                    ? 'Oversold — potential for bounce, but trend remains down'
                    : 'Weak — avoid fresh longs until reversal confirmed'
            };
        }
        return {
            bias: 'Neutral',
            structure: 'Mixed signals — no clear directional bias',
            position: 'Wait for trend confirmation before initiating positions'
        };
    };

    if (loading) {
        return (
            <ThemeProvider theme={darkTheme}>
                <Box sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0a0a0a'
                }}>
                    <CircularProgress size={32} sx={{ color: '#666' }} />
                </Box>
            </ThemeProvider>
        );
    }

    if (error) {
        return (
            <ThemeProvider theme={darkTheme}>
                <Box sx={{ minHeight: '100vh', backgroundColor: '#0a0a0a', pt: 8 }}>
                    <Container maxWidth="lg">
                        <Typography color="error">{error}</Typography>
                    </Container>
                </Box>
            </ThemeProvider>
        );
    }

    const distFromDma50 = calcDistance(data.latestClose, data.dma50);
    const distFromDma200 = calcDistance(data.latestClose, data.dma200);
    const priceAbove200 = data.latestClose > data.dma200;
    const dma50Above200 = data.dma50 > data.dma200;
    const interpretation = getInterpretation();

    const getTrendColor = () => {
        if (data.trend === 'Uptrend') return '#00ff88';
        if (data.trend === 'Downtrend') return '#ff4444';
        return '#ff9500';
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <Box sx={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
                {/* Minimal Navigation */}
                <Box sx={{
                    borderBottom: '1px solid #2a2a2a',
                    py: 3,
                    px: 4
                }}>
                    <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            color: '#fff'
                        }}>
                            Capital Lens
                        </Typography>
                        <Typography sx={{
                            fontSize: '0.85rem',
                            color: '#666',
                            letterSpacing: '0.05em'
                        }}>
                            NSE | INR
                        </Typography>
                    </Container>
                </Box>

                {/* Main Content */}
                <Container maxWidth="lg" sx={{ py: 6 }}>
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
                        {/* Latest Close - Large Hero Number */}
                        <Grid item xs={12}>
                            <Box sx={{
                                border: '1px solid #2a2a2a',
                                borderRadius: '4px',
                                p: 4,
                                backgroundColor: '#141414'
                            }}>
                                <Typography variant="h6" sx={{ mb: 3 }}>
                                    LATEST CLOSE
                                </Typography>
                                <Typography sx={{
                                    fontSize: '2.5rem',
                                    fontWeight: 700,
                                    letterSpacing: '-0.02em',
                                    lineHeight: 1,
                                    mb: 3
                                }}>
                                    ₹{data.latestClose?.toFixed(2)}
                                </Typography>

                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="h6" sx={{ mb: 1 }}>
                                            DMA50 DISTANCE
                                        </Typography>
                                        <Typography sx={{
                                            fontSize: '1.5rem',
                                            fontWeight: 600,
                                            color: distFromDma50 >= 0 ? '#00ff88' : '#ff4444'
                                        }}>
                                            {distFromDma50 >= 0 ? '+' : ''}{distFromDma50}%
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.85rem', color: '#666', mt: 0.5 }}>
                                            Price at ₹{data.dma50?.toFixed(2)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="h6" sx={{ mb: 1 }}>
                                            DMA200 DISTANCE
                                        </Typography>
                                        <Typography sx={{
                                            fontSize: '1.5rem',
                                            fontWeight: 600,
                                            color: distFromDma200 >= 0 ? '#00ff88' : '#ff4444'
                                        }}>
                                            {distFromDma200 >= 0 ? '+' : ''}{distFromDma200}%
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.85rem', color: '#666', mt: 0.5 }}>
                                            Price at ₹{data.dma200?.toFixed(2)}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>

                        {/* Structural Trend */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{
                                border: '1px solid #2a2a2a',
                                borderRadius: '4px',
                                p: 4,
                                backgroundColor: '#141414',
                                height: '100%'
                            }}>
                                <Typography variant="h6" sx={{ mb: 3 }}>
                                    STRUCTURAL TREND
                                </Typography>
                                <Box sx={{
                                    display: 'inline-block',
                                    px: 2.5,
                                    py: 1,
                                    border: `2px solid ${getTrendColor()}`,
                                    borderRadius: '2px',
                                    mb: 3
                                }}>
                                    <Typography sx={{
                                        fontSize: '1.1rem',
                                        fontWeight: 700,
                                        color: getTrendColor(),
                                        letterSpacing: '0.05em'
                                    }}>
                                        {data.trend.toUpperCase()}
                                    </Typography>
                                </Box>

                                <Box sx={{ mt: 3 }}>
                                    <Typography sx={{ fontSize: '0.9rem', mb: 1.5, color: '#a0a0a0' }}>
                                        • Price is <span style={{
                                            color: priceAbove200 ? '#00ff88' : '#ff4444',
                                            fontWeight: 600
                                        }}>
                                            {priceAbove200 ? 'above' : 'below'}
                                        </span> 200 DMA
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.9rem', color: '#a0a0a0' }}>
                                        • 50 DMA is <span style={{
                                            color: dma50Above200 ? '#00ff88' : '#ff4444',
                                            fontWeight: 600
                                        }}>
                                            {dma50Above200 ? 'above' : 'below'}
                                        </span> 200 DMA
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        {/* Interpretation */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{
                                border: '1px solid #2a2a2a',
                                borderRadius: '4px',
                                p: 4,
                                backgroundColor: '#141414',
                                height: '100%'
                            }}>
                                <Typography variant="h6" sx={{ mb: 3 }}>
                                    SYSTEMATIC INTERPRETATION
                                </Typography>

                                <Box sx={{ mb: 2.5 }}>
                                    <Typography sx={{ fontSize: '0.7rem', color: '#666', mb: 0.5, letterSpacing: '0.1em' }}>
                                        BIAS
                                    </Typography>
                                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                        {interpretation.bias}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2.5 }}>
                                    <Typography sx={{ fontSize: '0.7rem', color: '#666', mb: 0.5, letterSpacing: '0.1em' }}>
                                        STRUCTURE
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.85rem', color: '#a0a0a0', lineHeight: 1.6 }}>
                                        {interpretation.structure}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography sx={{ fontSize: '0.7rem', color: '#666', mb: 0.5, letterSpacing: '0.1em' }}>
                                        SHORT-TERM POSITION
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.85rem', color: '#a0a0a0', lineHeight: 1.6 }}>
                                        {interpretation.position}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Footer */}
                    <Box sx={{
                        mt: 8,
                        pt: 4,
                        borderTop: '1px solid #2a2a2a',
                        textAlign: 'center'
                    }}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                            © 2026 CapitalLens. Systematic analysis for NSE equity markets.
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </ThemeProvider>
    );
}

export default StockAnalysis;
