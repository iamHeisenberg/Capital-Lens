import { Box, Typography } from '@mui/material';

function Footer() {
    return (
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
    );
}

export default Footer;
