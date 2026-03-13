import { Box, Typography } from '@mui/material';

function formatValue(key, rawValue) {
    if (rawValue == null) return '—';
    if (key === 'cfoToEbitda') return rawValue.toFixed(2);
    if (key === 'roe' || key === 'roce') return `${rawValue.toFixed(2)}%`;
    return String(rawValue);
}

const LABELS = {
    roe: 'ROE',
    roce: 'ROCE',
    cfoToEbitda: 'CFO / EBITDA',
};

function ScoreBreakdown({ metrics }) {
    if (!metrics) return null;

    const entries = Object.entries(metrics).filter(([, m]) => m);
    if (!entries.length) return null;

    return (
        <Box sx={{ mt: 1.5 }}>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1fr',
                    columnGap: 1.5,
                    rowGap: 0.75,
                    alignItems: 'center',
                }}
            >
                {entries.map(([key, { value, score, max }]) => (
                    <Box
                        key={key}
                        sx={{
                            display: 'contents',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                color: '#9ca3af',
                            }}
                        >
                            {LABELS[key] || key}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                color: '#e5e7eb',
                            }}
                        >
                            {formatValue(key, value)}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: '#e5e7eb',
                                textAlign: 'right',
                            }}
                        >
                            {score} / {max}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

export default ScoreBreakdown;

