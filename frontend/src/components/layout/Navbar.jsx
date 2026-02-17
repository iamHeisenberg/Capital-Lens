import { Box, Container, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Analysis', path: '/analysis' },
    { label: 'Methodology', path: '/methodology' },
];

function Navbar() {
    const location = useLocation();

    return (
        <Box
            component="nav"
            sx={{
                position: 'sticky',
                top: 0,
                zIndex: 1100,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                backgroundColor: 'rgba(6, 6, 10, 0.8)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
        >
            <Container
                maxWidth="lg"
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2.5,
                    px: { xs: 2, md: 4 },
                }}
            >
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <Typography
                        sx={{
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            color: '#e8e8ed',
                            transition: 'opacity 0.2s',
                            '&:hover': { opacity: 0.7 },
                        }}
                    >
                        Capital Lens
                    </Typography>
                </Link>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                style={{ textDecoration: 'none' }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: '0.8rem',
                                        fontWeight: isActive ? 500 : 400,
                                        color: isActive ? '#e8e8ed' : '#5a5a6e',
                                        letterSpacing: '0.04em',
                                        transition: 'color 0.2s',
                                        position: 'relative',
                                        '&:hover': { color: '#8a8a9a' },
                                        '&::after': isActive
                                            ? {
                                                content: '""',
                                                position: 'absolute',
                                                bottom: -10,
                                                left: 0,
                                                right: 0,
                                                height: '1px',
                                                background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)',
                                            }
                                            : {},
                                    }}
                                >
                                    {link.label}
                                </Typography>
                            </Link>
                        );
                    })}

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            pl: 3,
                            borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                    >
                        <Box
                            sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: '#22c55e',
                                animation: 'pulse 2s infinite',
                            }}
                        />
                        <Typography
                            sx={{
                                fontSize: '0.7rem',
                                color: '#5a5a6e',
                                letterSpacing: '0.06em',
                                fontWeight: 500,
                            }}
                        >
                            NSE
                        </Typography>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}

export default Navbar;
