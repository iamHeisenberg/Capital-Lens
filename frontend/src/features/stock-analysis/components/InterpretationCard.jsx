import { Box, Typography, Grid } from '@mui/material';

function InterpretationCard({ interpretation }) {
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
    );
}

export default InterpretationCard;
