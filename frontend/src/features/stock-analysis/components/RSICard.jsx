import { Box, Typography, Grid } from '@mui/material';

// ── Signal config ──────────────────────────────────────────────────────────────
// Each zone maps to a color, label, and the RSI range it covers.

const SIGNAL_CONFIG = {
    Oversold: {
        label:  'OVERSOLD',
        color:  '#22c55e',
        glow:   'rgba(34,197,94,0.15)',
        border: '#22c55e',
        hint:   '< 30',
    },
    WeakMomentum: {
        label:  'WEAK MOMENTUM',
        color:  '#86efac',
        glow:   'rgba(134,239,172,0.12)',
        border: '#86efac',
        hint:   '30–40',
    },
    Neutral: {
        label:  'NEUTRAL',
        color:  '#f59e0b',
        glow:   'rgba(245,158,11,0.10)',
        border: '#f59e0b',
        hint:   '40–60',
    },
    Strong: {
        label:  'STRONG',
        color:  '#f97316',
        glow:   'rgba(249,115,22,0.12)',
        border: '#f97316',
        hint:   '60–70',
    },
    Overbought: {
        label:  'OVERBOUGHT',
        color:  '#ef4444',
        glow:   'rgba(239,68,68,0.15)',
        border: '#ef4444',
        hint:   '> 70',
    },
    InsufficientData: {
        label:  'INSUFFICIENT DATA',
        color:  '#5a5a6e',
        glow:   'transparent',
        border: '#5a5a6e',
        hint:   '< 14 days',
    },
};

// ── RSI Gauge Bar ──────────────────────────────────────────────────────────────
// A horizontal track [0→100] with colored zone bands and a marker dot.

function RSIGaugeBar({ value }) {
    if (value == null || !isFinite(value)) return null;
    const clamped = Math.max(0, Math.min(100, value));

    // Zone background segments (width in %)
    const zones = [
        { left: '0%',   width: '30%', color: 'rgba(34,197,94,0.18)'   }, // 0–30  oversold
        { left: '30%',  width: '30%', color: 'rgba(255,255,255,0.04)' }, // 30–60 neutral
        { left: '60%',  width: '10%', color: 'rgba(249,115,22,0.12)'  }, // 60–70 strong
        { left: '70%',  width: '30%', color: 'rgba(239,68,68,0.18)'   }, // 70–100 overbought
    ];

    // Marker color mirrors the signal color at the given value
    const markerColor =
        value < 30 ? '#22c55e' :
        value < 40 ? '#86efac' :
        value < 60 ? '#f59e0b' :
        value < 70 ? '#f97316' : '#ef4444';

    return (
        <Box sx={{ position: 'relative', height: 6, borderRadius: '3px', overflow: 'visible', my: 2.5 }}>
            {/* Full track */}
            <Box sx={{ position: 'absolute', inset: 0, borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }} />

            {/* Zone bands */}
            {zones.map((z, i) => (
                <Box
                    key={i}
                    sx={{
                        position: 'absolute',
                        top: 0, bottom: 0,
                        left: z.left,
                        width: z.width,
                        background: z.color,
                    }}
                />
            ))}

            {/* Subtle zone separators */}
            {['30%', '60%', '70%'].map((x) => (
                <Box
                    key={x}
                    sx={{
                        position: 'absolute',
                        top: 0, bottom: 0,
                        left: x,
                        width: '1px',
                        background: 'rgba(255,255,255,0.08)',
                    }}
                />
            ))}

            {/* Marker dot */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: `${clamped}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: markerColor,
                    border: '2px solid rgba(10,10,18,0.9)',
                    boxShadow: `0 0 6px ${markerColor}`,
                    zIndex: 2,
                    transition: 'left 0.4s ease',
                }}
            />
        </Box>
    );
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * RSICard — shows the latest RSI(14) value, zone signal, gauge bar, and text.
 *
 * Props:
 *   rsi  — { value: number|null, signal: string, text: string } from data.indicators.rsi
 *          Pass null/undefined → card is hidden (computation failed or unavailable)
 */
function RSICard({ rsi }) {
    // Hide card entirely if RSI wasn't computed
    if (!rsi) return null;

    const cfg = SIGNAL_CONFIG[rsi.signal] ?? SIGNAL_CONFIG.Neutral;
    const isInsufficient = rsi.signal === 'InsufficientData';

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
                    RSI (14) — RELATIVE STRENGTH INDEX
                </Typography>

                {/* Value row */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 0.5 }}>
                    <Typography
                        sx={{
                            fontSize: '2.2rem',
                            fontWeight: 700,
                            color: isInsufficient ? '#5a5a6e' : cfg.color,
                            lineHeight: 1,
                            fontFamily: 'monospace',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {rsi.value != null ? rsi.value.toFixed(1) : '—'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#5a5a6e' }}>/ 100</Typography>
                </Box>

                {/* Signal badge */}
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.5,
                        py: 0.4,
                        borderRadius: '20px',
                        background: cfg.glow,
                    }}
                >
                    <Box
                        sx={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            backgroundColor: cfg.color,
                            boxShadow: isInsufficient ? 'none' : `0 0 5px ${cfg.color}`,
                            animation: isInsufficient ? 'none' : 'pulse 2s infinite',
                        }}
                    />
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: cfg.color, letterSpacing: '0.06em' }}>
                        {cfg.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.62rem', color: cfg.color, opacity: 0.7 }}>
                        {cfg.hint}
                    </Typography>
                </Box>

                {/* Gauge bar */}
                {!isInsufficient && <RSIGaugeBar value={rsi.value} />}

                {/* Zone labels beneath the bar */}
                {!isInsufficient && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        {[
                            { label: '0',   color: '#22c55e' },
                            { label: '30',  color: '#5a5a6e' },
                            { label: '70',  color: '#5a5a6e' },
                            { label: '100', color: '#ef4444' },
                        ].map(({ label, color }) => (
                            <Typography key={label} sx={{ fontSize: '0.6rem', color }}>
                                {label}
                            </Typography>
                        ))}
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
                    {rsi.text}
                </Typography>

                {/* Footnote */}
                <Typography
                    sx={{
                        fontSize: '0.65rem',
                        color: '#3a3a4e',
                        mt: 2,
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        pt: 1.5,
                    }}
                >
                    Wilder's smoothed 14-period RSI · benchmark: 30 = oversold, 70 = overbought
                </Typography>
            </Box>
        </Grid>
    );
}

export default RSICard;
