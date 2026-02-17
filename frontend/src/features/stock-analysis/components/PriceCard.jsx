import { Box, Typography, Grid } from '@mui/material';

function PriceCard({ latestClose, dma50, dma200, distFromDma50, distFromDma200 }) {
    return (
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
                    ₹{latestClose?.toFixed(2)}
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
                            Price at ₹{dma50?.toFixed(2)}
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
                            Price at ₹{dma200?.toFixed(2)}
                        </Typography>
                    </Grid>
                </Grid>
            </Box>
        </Grid>
    );
}

export default PriceCard;
