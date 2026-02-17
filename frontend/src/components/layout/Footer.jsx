import { Box, Container, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { APP_VERSION } from '../../config/version';

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
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                    px: { xs: 2, md: 4 },
                }}
            >
                <Typography sx={{ fontSize: '0.8rem', color: '#5a5a6e', fontWeight: 500 }}>
                    CapitalLens v{APP_VERSION}
                </Typography>
                <Typography variant="caption" sx={{ color: '#3a3a4e' }}>
                    Data Source: Yahoo Finance (Daily Closing Prices)
                </Typography>
                <Typography variant="caption" sx={{ color: '#3a3a4e', textAlign: 'center', maxWidth: 520 }}>
                    This platform is a decision-support framework and does not constitute investment advice.
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, mt: 0.5 }}>
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
