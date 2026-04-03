import { Box, Typography } from '@mui/material';

const PERIODS = [
    { label: '1M', points: 22,  minRequired: 22  },
    { label: '3M', points: 66,  minRequired: 66  },
    { label: '6M', points: 132, minRequired: 66  },
    { label: '1Y', points: 200, minRequired: 1   },
    { label: '2Y', points: 400, minRequired: 200 },
];

/**
 * PeriodSelector — tab strip for switching chart time windows.
 *
 * Props:
 *   selected    {string}   — active period label ('1M' | '3M' | '6M' | '1Y')
 *   onChange    {Function} — (label) => void
 *   totalPoints {number}   — total available data points (used to disable tabs)
 */
function PeriodSelector({ selected, onChange, totalPoints = 200 }) {
    return (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
            {PERIODS.map(({ label, minRequired }) => {
                const isActive   = selected === label;
                const isDisabled = totalPoints < minRequired;

                return (
                    <Box
                        key={label}
                        component="button"
                        onClick={() => !isDisabled && onChange(label)}
                        disabled={isDisabled}
                        sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '6px',
                            border: isActive
                                ? '1px solid rgba(255,255,255,0.2)'
                                : '1px solid transparent',
                            background: isActive
                                ? 'rgba(255,255,255,0.07)'
                                : 'transparent',
                            color: isDisabled
                                ? '#3a3a4e'
                                : isActive
                                    ? '#e8e8ed'
                                    : '#5a5a6e',
                            fontSize: '0.72rem',
                            fontWeight: isActive ? 600 : 400,
                            letterSpacing: '0.04em',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                            fontFamily: 'inherit',
                            '&:hover:not(:disabled)': {
                                color: '#e8e8ed',
                                background: 'rgba(255,255,255,0.04)',
                            },
                        }}
                    >
                        {label}
                    </Box>
                );
            })}
        </Box>
    );
}

export { PERIODS };
export default PeriodSelector;
