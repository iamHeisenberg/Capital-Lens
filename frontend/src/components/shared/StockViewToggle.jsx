import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

/**
 * StockViewToggle — prominent pill-style tab strip shown at the top of both
 * Analysis and Fundamentals pages so users always know they can switch views.
 *
 * Props:
 *   ticker  {string}  — e.g. 'SBIN.NS'
 *   current {'analysis' | 'fundamentals'}
 */
function StockViewToggle({ ticker, current }) {
    if (!ticker) return null;

    const tabs = [
        { label: 'Analysis',     view: 'analysis',     to: `/analysis/${ticker}` },
        { label: 'Fundamentals', view: 'fundamentals', to: `/fundamentals/${ticker}` },
    ];

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                p: '3px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            {tabs.map(({ label, view, to }) => {
                const isActive = current === view;
                return (
                    <Link key={view} to={to} style={{ textDecoration: 'none' }}>
                        <Box
                            sx={{
                                px: 2.5,
                                py: 0.75,
                                borderRadius: '7px',
                                background: isActive
                                    ? 'rgba(255,255,255,0.10)'
                                    : 'transparent',
                                border: isActive
                                    ? '1px solid rgba(255,255,255,0.14)'
                                    : '1px solid transparent',
                                transition: 'all 0.15s ease',
                                cursor: isActive ? 'default' : 'pointer',
                                '&:hover': isActive ? {} : {
                                    background: 'rgba(255,255,255,0.05)',
                                },
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: '0.78rem',
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? '#e8e8ed' : '#5a5a6e',
                                    letterSpacing: '0.02em',
                                    transition: 'color 0.15s ease',
                                    userSelect: 'none',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {label}
                            </Typography>
                        </Box>
                    </Link>
                );
            })}
        </Box>
    );
}

export default StockViewToggle;
