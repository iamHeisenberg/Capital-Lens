import { createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#06060a',
            paper: 'rgba(255, 255, 255, 0.03)',
        },
        text: {
            primary: '#e8e8ed',
            secondary: '#8a8a9a',
        },
        divider: 'rgba(255, 255, 255, 0.06)',
        success: {
            main: '#22c55e',
        },
        error: {
            main: '#ef4444',
        },
        warning: {
            main: '#f59e0b',
        },
        info: {
            main: '#06b6d4',
        },
    },
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        h1: {
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
        },
        h2: {
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
        },
        h4: {
            fontSize: '1.35rem',
            fontWeight: 600,
            letterSpacing: '-0.015em',
            lineHeight: 1.3,
        },
        h5: {
            fontSize: '1.1rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            lineHeight: 1.4,
        },
        h6: {
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#5a5a6e',
        },
        body1: {
            fontSize: '0.95rem',
            lineHeight: 1.75,
            color: '#8a8a9a',
        },
        body2: {
            fontSize: '0.85rem',
            lineHeight: 1.6,
            color: '#6a6a7a',
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#06060a',
                },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: 'rgba(255, 255, 255, 0.06)',
                },
            },
        },
    },
});

export default darkTheme;
