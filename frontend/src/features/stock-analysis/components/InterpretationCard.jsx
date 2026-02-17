import { Box, Typography, Grid } from '@mui/material';

function InterpretationCard({ interpretation }) {
    const getBiasColor = (bias) => {
        if (bias === 'Bullish') return '#22c55e';
        if (bias === 'Bearish') return '#ef4444';
        return '#f59e0b';
    };

    return (
        <Grid item xs={12} md={6}>
            <Box
                className="glass-card animate-fade-in-up delay-4"
                sx={{
                    p: { xs: 3, md: 4 },
                    height: '100%',
                }}
            >
                <Typography variant="h6" sx={{ mb: 3 }}>
                    SYSTEMATIC INTERPRETATION
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                        <Typography
                            sx={{
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                color: '#3a3a4e',
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                mb: 0.5,
                            }}
                        >
                            BIAS
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '1.15rem',
                                fontWeight: 700,
                                color: getBiasColor(interpretation.bias),
                            }}
                        >
                            {interpretation.bias}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            borderTop: '1px solid rgba(255,255,255,0.04)',
                            pt: 2.5,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                color: '#3a3a4e',
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                mb: 0.5,
                            }}
                        >
                            STRUCTURE
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                            {interpretation.structure}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            borderTop: '1px solid rgba(255,255,255,0.04)',
                            pt: 2.5,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                color: '#3a3a4e',
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                mb: 0.5,
                            }}
                        >
                            SHORT-TERM POSITION
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                            {interpretation.position}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Grid>
    );
}

export default InterpretationCard;
