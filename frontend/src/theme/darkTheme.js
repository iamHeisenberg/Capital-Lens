import { createTheme } from '@mui/material/styles';

// QT Capital-inspired dark theme
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#0a0a0a',
            paper: '#141414',
        },
        text: {
            primary: '#ffffff',
            secondary: '#a0a0a0',
        },
        divider: '#2a2a2a',
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
        h1: {
            fontSize: '4rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
        },
        h6: {
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#666666',
        },
        body1: {
            fontSize: '0.95rem',
            lineHeight: 1.7,
        },
    },
});

export default darkTheme;
