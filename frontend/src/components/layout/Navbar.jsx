import { Box, Container, Typography } from '@mui/material';

function Navbar() {
    return (
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
    );
}

export default Navbar;
