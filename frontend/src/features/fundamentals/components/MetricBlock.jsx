import { Box, Typography } from '@mui/material';
import { COLORS } from '../utils/getMetricColor';

/**
 * Reusable metric display block for fundamentals cards.
 *
 * Shows a label + value with conditional coloring.
 * Null values display as "—" in neutral gray.
 */
function MetricBlock({ label, value, suffix = '', color, format }) {
    const isNull = value == null;
    const displayColor = isNull ? COLORS.neutral : (color || COLORS.neutral);

    let displayValue = '—';
    if (!isNull) {
        if (format === 'ratio') {
            displayValue = value.toFixed(2);
        } else {
            displayValue = `${value}${suffix}`;
        }
    }

    return (
        <Box
            sx={{
                p: 2,
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                minWidth: 0,
            }}
        >
            <Typography
                sx={{
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    color: '#5a5a6e',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    mb: 0.5,
                }}
            >
                {label}
            </Typography>
            <Typography
                sx={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: displayColor,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                }}
            >
                {displayValue}
            </Typography>
        </Box>
    );
}

export default MetricBlock;
