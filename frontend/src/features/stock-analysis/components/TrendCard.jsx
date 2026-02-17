import { Box, Typography, Grid } from '@mui/material';
import { getTrendColor } from '../utils/interpretation';

function TrendCard({ trend, priceAbove200, dma50Above200 }) {
    const trendColor = getTrendColor(trend);

    return (
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
                    border: `2px solid ${trendColor}`,
                    borderRadius: '2px',
                    mb: 3
                }}>
                    <Typography sx={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: trendColor,
                        letterSpacing: '0.05em'
                    }}>
                        {trend.toUpperCase()}
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
    );
}

export default TrendCard;
