import { Box, Container, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                py: 4,
                mt: 'auto',
            }}
        >
            <Container
                maxWidth="lg"
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                    px: { xs: 2, md: 4 },
                }}
            >
                <Typography sx={{ fontSize: '0.75rem', color: '#3a3a4e' }}>
                    &copy; 2026 CapitalLens. Systematic analysis for NSE equity markets.
                </Typography>
                <Box sx={{ display: 'flex', gap: 3 }}>
                    <Link to="/methodology" style={{ textDecoration: 'none' }}>
                        <Typography
                            sx={{
                                fontSize: '0.7rem',
                                color: '#3a3a4e',
                                letterSpacing: '0.04em',
                                transition: 'color 0.2s',
                                '&:hover': { color: '#5a5a6e' },
                            }}
                        >
                            Methodology
                        </Typography>
                    </Link>
                </Box>
            </Container>
        </Box>
    );
}

export default Footer;
