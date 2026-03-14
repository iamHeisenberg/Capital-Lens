import { Box, Typography } from '@mui/material';
import { getScoreColor } from '../../../utils/scoreColor';

function CompounderScoreCard({ score }) {
    const total = score?.total ?? null;
    const classification = score?.classification ?? '—';
    const breakdown = score?.breakdown ?? null;

    const isNull = total == null;
    const displayTotal = isNull ? '—' : total;
    const color = isNull ? '#5a5a6e' : getScoreColor(total);

    return (
        <Box
            className="glass-card animate-fade-in-up delay-2"
            sx={{
                p: { xs: 2.5, md: 3 },
                mb: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
            }}
        >
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                    COMPOUNDER SCORE
                </Typography>
                <Typography variant="body2" sx={{ color: '#5a5a6e' }}>
                    Single score (0–100) based on Growth, Efficiency, Profitability, Valuation, and Balance Sheet.
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                <Typography
                    sx={{
                        fontSize: { xs: '2.25rem', md: '2.5rem' },
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        color,
                        lineHeight: 1,
                    }}
                >
                    {displayTotal}
                </Typography>
                <Typography sx={{ color: '#5a5a6e', fontWeight: 600 }}>
                    / 100
                </Typography>
                <Typography
                    sx={{
                        ml: { xs: 0, md: 2 },
                        fontWeight: 700,
                        color: isNull ? '#5a5a6e' : '#e8e8ed',
                    }}
                >
                    {classification}
                </Typography>
            </Box>

            {breakdown && (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' },
                        gap: 1,
                        width: { xs: '100%', md: 'auto' },
                    }}
                >
                    {[
                        ['Valuation', breakdown.valuation],
                        ['Growth', breakdown.growth],
                        ['Profitability', breakdown.profitability],
                        ['Efficiency', breakdown.capitalEfficiency],
                        ['Balance', breakdown.balanceSheet],
                    ].map(([label, value]) => (
                        <Box
                            key={label}
                            sx={{
                                p: 1.25,
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.04)',
                                minWidth: 0,
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: '0.6rem',
                                    fontWeight: 600,
                                    color: '#5a5a6e',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {label}
                            </Typography>
                            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#e8e8ed' }}>
                                {value ?? '—'}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}

export default CompounderScoreCard;

