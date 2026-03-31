import { Box, Container, Typography } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GlobalSearchBar from '../search/GlobalSearchBar';

const navLinks = [
    { label: 'Home', path: '/', exact: true },
    { label: 'Analysis', path: '/analysis' },
    { label: 'Fundamentals', path: '/fundamentals' },
    { label: 'Methodology', path: '/methodology' },
];

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();

    // Extract ticker from URL segments like /analysis/TCS.NS or /fundamentals/TCS.NS
    const pathParts = location.pathname.split('/');
    const currentTicker = pathParts.length === 3 && pathParts[2] ? pathParts[2] : null;

    const isActive = (link) =>
        link.exact
            ? location.pathname === link.path
            : location.pathname.startsWith(link.path);

    // Generate the correct target path for context-aware nav links
    const getNavTarget = (link) => {
        if (currentTicker && (link.path === '/analysis' || link.path === '/fundamentals')) {
            return `${link.path}/${currentTicker}`;
        }
        return link.path;
    };

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
                    py: 1.75,
                    px: { xs: 2, md: 4 },
                    gap: 2,
                }}
            >
                {/* Logo */}
                <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
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

                {/* Search Bar — center, hidden on mobile */}
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexGrow: 1, justifyContent: 'center' }}>
                    <GlobalSearchBar />
                </Box>

                {/* Nav links + NSE indicator */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 4 }, flexShrink: 0 }}>
                    {navLinks.map((link) => {
                        const active = isActive(link);
                        const target = getNavTarget(link);
                        return (
                            <Box
                                key={link.path}
                                component="span"
                                onClick={() => navigate(target)}
                                sx={{ cursor: 'pointer' }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: '0.8rem',
                                        fontWeight: active ? 500 : 400,
                                        color: active ? '#e8e8ed' : '#5a5a6e',
                                        letterSpacing: '0.04em',
                                        transition: 'color 0.2s',
                                        position: 'relative',
                                        display: { xs: 'none', md: 'block' },
                                        '&:hover': { color: '#8a8a9a' },
                                        '&::after': active
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
                            </Box>
                        );
                    })}

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            pl: { xs: 0, md: 3 },
                            borderLeft: { xs: 'none', md: '1px solid rgba(255, 255, 255, 0.06)' },
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
