import { Box, Typography, Grid } from '@mui/material';
import { getTrendColor } from '../utils/interpretation';

function TrendCard({ trend, priceAbove200, dma50Above200 }) {
    const trendColor = getTrendColor(trend);

    return (
        <Grid item xs={12} md={6}>
            <Box
                className="glass-card animate-fade-in-up delay-3"
                sx={{
                    p: { xs: 3, md: 4 },
                    height: '100%',
                    borderTop: `2px solid ${trendColor}`,
                }}
            >
                <Typography variant="h6" sx={{ mb: 3 }}>
                    STRUCTURAL TREND
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: trendColor,
                            boxShadow: `0 0 8px ${trendColor}`,
                            animation: 'pulse 2s infinite',
                        }}
                    />
                    <Typography
                        sx={{
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            color: trendColor,
                            letterSpacing: '0.06em',
                        }}
                    >
                        {trend.toUpperCase()}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1.5,
                        px: 2,
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                    }}>
                        <Typography variant="body2">
                            Price vs 200 DMA
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: priceAbove200 ? '#22c55e' : '#ef4444',
                            }}
                        >
                            {priceAbove200 ? 'ABOVE' : 'BELOW'}
                        </Typography>
                    </Box>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1.5,
                        px: 2,
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                    }}>
                        <Typography variant="body2">
                            50 DMA vs 200 DMA
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: dma50Above200 ? '#22c55e' : '#ef4444',
                            }}
                        >
                            {dma50Above200 ? 'ABOVE' : 'BELOW'}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Grid>
    );
}

export default TrendCard;
