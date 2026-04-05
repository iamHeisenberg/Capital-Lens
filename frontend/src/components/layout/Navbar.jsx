import { useState, useEffect, useCallback } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GlobalSearchBar from '../search/GlobalSearchBar';

const navLinks = [
    { label: 'Home',         path: '/',            exact: true },
    { label: 'Analysis',     path: '/analysis'                 },
    { label: 'Fundamentals', path: '/fundamentals'             },
    { label: 'Methodology',  path: '/methodology'              },
];

// ── Hamburger icon (3 bars → ✕ animated) ─────────────────────────────────────

function HamburgerIcon({ open }) {
    const barBase = {
        display: 'block',
        width: 22,
        height: 2,
        borderRadius: 2,
        background: '#e8e8ed',
        transition: 'all 0.25s ease',
        transformOrigin: 'center',
    };
    return (
        <Box sx={{ width: 22, height: 16, position: 'relative', cursor: 'pointer' }}>
            <Box component="span" sx={{
                ...barBase,
                position: 'absolute', top: 0,
                transform: open ? 'translateY(7px) rotate(45deg)' : 'none',
            }} />
            <Box component="span" sx={{
                ...barBase,
                position: 'absolute', top: 7,
                opacity: open ? 0 : 1,
                transform: open ? 'scaleX(0)' : 'none',
            }} />
            <Box component="span" sx={{
                ...barBase,
                position: 'absolute', top: 14,
                transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none',
            }} />
        </Box>
    );
}

// ── Main Navbar ───────────────────────────────────────────────────────────────

function Navbar() {
    const location  = useLocation();
    const navigate  = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Extract ticker from /analysis/TCS.NS or /fundamentals/TCS.NS
    const pathParts    = location.pathname.split('/');
    const currentTicker = pathParts.length === 3 && pathParts[2] ? pathParts[2] : null;

    const isActive = (link) =>
        link.exact
            ? location.pathname === link.path
            : location.pathname.startsWith(link.path);

    const getNavTarget = (link) => {
        if (currentTicker && (link.path === '/analysis' || link.path === '/fundamentals')) {
            return `${link.path}/${currentTicker}`;
        }
        return link.path;
    };

    // Edge case 1: close menu on route change (e.g. after search selection)
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    // Edge case 2: close menu on Escape key
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') setMobileOpen(false);
    }, []);

    useEffect(() => {
        if (mobileOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Edge case 3: prevent background scroll when menu is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [mobileOpen, handleKeyDown]);

    const closeMobileMenu = () => setMobileOpen(false);

    return (
        <>
            {/* ── Desktop + Mobile Topbar ─────────────────────────────────── */}
            <Box
                component="nav"
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1200,
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    backgroundColor: 'rgba(6, 6, 10, 0.88)',
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
                        <Typography sx={{
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            color: '#e8e8ed',
                            transition: 'opacity 0.2s',
                            '&:hover': { opacity: 0.7 },
                        }}>
                            Capital Lens
                        </Typography>
                    </Link>

                    {/* Search bar — desktop only */}
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexGrow: 1, justifyContent: 'center' }}>
                        <GlobalSearchBar />
                    </Box>

                    {/* Desktop nav links + NSE indicator */}
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
                                    <Typography sx={{
                                        fontSize: '0.8rem',
                                        fontWeight: active ? 500 : 400,
                                        color: active ? '#e8e8ed' : '#5a5a6e',
                                        letterSpacing: '0.04em',
                                        transition: 'color 0.2s',
                                        position: 'relative',
                                        display: { xs: 'none', md: 'block' },
                                        '&:hover': { color: '#8a8a9a' },
                                        '&::after': active ? {
                                            content: '""',
                                            position: 'absolute',
                                            bottom: -10, left: 0, right: 0,
                                            height: '1px',
                                            background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)',
                                        } : {},
                                    }}>
                                        {link.label}
                                    </Typography>
                                </Box>
                            );
                        })}

                        {/* NSE indicator */}
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            pl: { xs: 0, md: 3 },
                            borderLeft: { xs: 'none', md: '1px solid rgba(255, 255, 255, 0.06)' },
                        }}>
                            <Box sx={{
                                width: 6, height: 6,
                                borderRadius: '50%',
                                backgroundColor: '#22c55e',
                                animation: 'pulse 2s infinite',
                            }} />
                            <Typography sx={{
                                fontSize: '0.7rem',
                                color: '#5a5a6e',
                                letterSpacing: '0.06em',
                                fontWeight: 500,
                                display: { xs: 'none', sm: 'block' },
                            }}>
                                NSE
                            </Typography>
                        </Box>

                        {/* Hamburger button — mobile only */}
                        <Box
                            component="button"
                            onClick={() => setMobileOpen((o) => !o)}
                            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={mobileOpen}
                            sx={{
                                display: { xs: 'flex', md: 'none' },
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'none',
                                border: 'none',
                                p: 0.5,
                                cursor: 'pointer',
                                ml: 1,
                            }}
                        >
                            <HamburgerIcon open={mobileOpen} />
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* ── Mobile drawer backdrop ─────────────────────────────────── */}
            {mobileOpen && (
                <Box
                    onClick={closeMobileMenu}
                    sx={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1199,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        // Edge case 4: backdrop click closes immediately
                    }}
                />
            )}

            {/* ── Mobile drawer ─────────────────────────────────────────── */}
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: { xs: '100%', sm: 320 },
                    zIndex: 1300,
                    backgroundColor: 'rgba(10, 10, 18, 0.98)',
                    backdropFilter: 'blur(24px)',
                    borderLeft: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                    pt: 'calc(64px)',    // clear topbar height
                    px: 3,
                    pb: 4,
                    overflowY: 'auto',
                }}
                // Edge case 5: stop click propagation so drawer clicks don't hit backdrop
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mobile search — full width, top of drawer */}
                <Box sx={{ mb: 4, mt: 3 }}>
                    <Typography sx={{ fontSize: '0.65rem', color: '#5a5a6e', letterSpacing: '0.1em', mb: 1.5, textTransform: 'uppercase' }}>
                        Search Stocks
                    </Typography>
                    {/* Edge case 6: search in mobile drawer navigates AND closes menu
                        This is handled by the route-change useEffect above */}
                    <Box sx={{
                        '& .MuiAutocomplete-root': { width: '100% !important' },
                        '& .MuiInputBase-root': { width: '100% !important' },
                    }}>
                        <GlobalSearchBar />
                    </Box>
                </Box>

                {/* Divider */}
                <Box sx={{ height: '1px', background: 'rgba(255,255,255,0.06)', mb: 4 }} />

                {/* Mobile nav links */}
                <Typography sx={{ fontSize: '0.65rem', color: '#5a5a6e', letterSpacing: '0.1em', mb: 2, textTransform: 'uppercase' }}>
                    Navigation
                </Typography>

                <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {navLinks.map((link) => {
                        const active = isActive(link);
                        const target = getNavTarget(link);
                        return (
                            <Box
                                key={link.path}
                                onClick={() => { navigate(target); closeMobileMenu(); }}
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    borderRadius: '8px',
                                    background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                                    borderLeft: active ? '2px solid #06b6d4' : '2px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    '&:hover': { background: 'rgba(255,255,255,0.04)' },
                                }}
                            >
                                <Typography sx={{
                                    fontSize: '0.95rem',
                                    fontWeight: active ? 600 : 400,
                                    color: active ? '#e8e8ed' : '#8a8a9e',
                                    letterSpacing: '0.01em',
                                }}>
                                    {link.label}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>

                {/* NSE indicator at drawer bottom */}
                <Box sx={{ mt: 'auto', pt: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                        width: 6, height: 6,
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        animation: 'pulse 2s infinite',
                    }} />
                    <Typography sx={{ fontSize: '0.72rem', color: '#5a5a6e', letterSpacing: '0.06em' }}>
                        NSE Live Data
                    </Typography>
                </Box>
            </Box>
        </>
    );
}

export default Navbar;
