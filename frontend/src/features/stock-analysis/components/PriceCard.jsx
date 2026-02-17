import { Box, Typography, Grid } from '@mui/material';

function PriceCard({ latestClose, dma50, dma200, distFromDma50, distFromDma200, lastUpdated }) {
    const formattedDate = lastUpdated
        ? new Date(lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';

    return (
        <Grid item xs={12}>
            <Box
                className="glass-card animate-fade-in-up delay-2"
                sx={{ p: { xs: 3, md: 5 } }}
            >
                <Typography variant="h6" sx={{ mb: 1 }}>
                    LATEST CLOSE
                </Typography>
                <Typography
                    sx={{
                        fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                        mb: 4,
                        color: '#e8e8ed',
                    }}
                >
                    ₹{latestClose?.toFixed(2)}
                </Typography>

                <Grid container spacing={4}>
                    <Grid item xs={12} sm={6}>
                        <Box sx={{
                            p: 3,
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.04)',
                        }}>
                            <Typography variant="h6" sx={{ mb: 1.5 }}>
                                50 DMA DISTANCE
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                <Typography sx={{
                                    fontSize: '1.75rem',
                                    fontWeight: 700,
                                    color: distFromDma50 >= 0 ? '#22c55e' : '#ef4444',
                                    letterSpacing: '-0.02em',
                                }}>
                                    {distFromDma50 >= 0 ? '+' : ''}{distFromDma50}%
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                DMA50 at ₹{dma50?.toFixed(2)}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Box sx={{
                            p: 3,
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.04)',
                        }}>
                            <Typography variant="h6" sx={{ mb: 1.5 }}>
                                200 DMA DISTANCE
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                <Typography sx={{
                                    fontSize: '1.75rem',
                                    fontWeight: 700,
                                    color: distFromDma200 >= 0 ? '#22c55e' : '#ef4444',
                                    letterSpacing: '-0.02em',
                                }}>
                                    {distFromDma200 >= 0 ? '+' : ''}{distFromDma200}%
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                DMA200 at ₹{dma200?.toFixed(2)}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                {/* Data Transparency */}
                <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#5a5a6e' }}>
                    Data as of: {formattedDate} · Source: Yahoo Finance (Daily Close Data) · Updates: End-of-day
                </Typography>
            </Box>
        </Grid>
    );
}

export default PriceCard;

