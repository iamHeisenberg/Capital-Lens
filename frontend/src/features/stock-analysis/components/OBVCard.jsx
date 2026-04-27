import { Box, Typography, Grid } from '@mui/material';

// ── Signal config ──────────────────────────────────────────────────────────────

const SIGNAL_CONFIG = {
    BullishDivergence: {
        label: '↑ BULLISH DIVERGENCE',
        color: '#22c55e',
        glow:  'rgba(34,197,94,0.15)',
        border:'#22c55e',
    },
    BearishDivergence: {
        label: '↓ BEARISH DIVERGENCE',
        color: '#ef4444',
        glow:  'rgba(239,68,68,0.15)',
        border:'#ef4444',
    },
    Confirmed: {
        label: '✓ TREND CONFIRMED',
        color: '#22c55e',
        glow:  'rgba(34,197,94,0.10)',
        border:'#22c55e',
    },
    Neutral: {
        label: '— NEUTRAL',
        color: '#f59e0b',
        glow:  'rgba(245,158,11,0.10)',
        border:'#f59e0b',
    },
    InsufficientData: {
        label: 'INSUFFICIENT DATA',
        color: '#5a5a6e',
        glow:  'transparent',
        border:'#5a5a6e',
    },
};

/**
 * Formats large OBV numbers to human-readable form.
 * e.g. 1_234_567_890 → "1.23B" · 9_500_000 → "9.5M" · 12_000 → "12.0K"
 */
function formatOBV(value) {
    if (value == null || !isFinite(value)) return '—';
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
    return `${sign}${abs.toFixed(0)}`;
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * OBVCard — displays the On-Balance Volume signal.
 *
 * Props:
 *   obv     — { signal, text, latestOBV } from data.indicators.obv
 *             Pass null/undefined to hide the card entirely.
 *   hasVolume — boolean from data.hasVolume
 *
 * Behaviour:
 *   - If hasVolume is false OR obv is null → render nothing (don't show a broken card)
 *   - If signal is 'InsufficientData' → show the card dimmed without a signal value
 */
function OBVCard({ obv, hasVolume }) {
    // Gate 1: No volume data at all — hide card completely
    if (!hasVolume) return null;

    // Gate 2: OBV computation failed / not yet available — hide card
    if (!obv) return null;

    const cfg = SIGNAL_CONFIG[obv.signal] ?? SIGNAL_CONFIG.Neutral;
    const isInsufficient = obv.signal === 'InsufficientData';

    return (
        <Grid item xs={12} sm={6} md={4}>
            <Box
                className="glass-card animate-fade-in-up delay-3"
                sx={{
                    p: { xs: 3, md: 3.5 },
                    height: '100%',
                    borderTop: `2px solid ${cfg.border}`,
                    opacity: isInsufficient ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                }}
            >
                {/* Header */}
                <Typography
                    sx={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: '#3a3a4e',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        mb: 2,
                    }}
                >
                    OBV — ON-BALANCE VOLUME
                </Typography>

                {/* Signal badge */}
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '20px',
                        background: cfg.glow,
                        mb: 2,
                    }}
                >
                    <Box
                        sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: cfg.color,
                            boxShadow: `0 0 6px ${cfg.color}`,
                            animation: isInsufficient ? 'none' : 'pulse 2s infinite',
                        }}
                    />
                    <Typography
                        sx={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: cfg.color,
                            letterSpacing: '0.06em',
                        }}
                    >
                        {cfg.label}
                    </Typography>
                </Box>

                {/* Latest OBV value */}
                {!isInsufficient && obv.latestOBV != null && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 1,
                            px: 1.5,
                            mb: 2,
                            borderRadius: '6px',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                        }}
                    >
                        <Typography sx={{ fontSize: '0.72rem', color: '#5a5a6e' }}>
                            Cumulative OBV
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: obv.latestOBV >= 0 ? '#22c55e' : '#ef4444',
                                fontFamily: 'monospace',
                            }}
                        >
                            {formatOBV(obv.latestOBV)}
                        </Typography>
                    </Box>
                )}

                {/* Plain-English explanation */}
                <Typography
                    sx={{
                        fontSize: '0.75rem',
                        color: '#8a8a9e',
                        lineHeight: 1.65,
                    }}
                >
                    {obv.text}
                </Typography>

                {/* Methodology footnote */}
                <Typography
                    sx={{
                        fontSize: '0.65rem',
                        color: '#3a3a4e',
                        mt: 2,
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        pt: 1.5,
                    }}
                >
                    Compares 20-day OBV trend vs price trend using linear regression
                </Typography>
            </Box>
        </Grid>
    );
}

export default OBVCard;
