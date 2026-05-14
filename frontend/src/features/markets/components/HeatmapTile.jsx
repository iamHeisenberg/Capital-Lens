import { Box, Typography } from '@mui/material';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Map a return % to an RGBA background colour with proportional intensity. */
function returnToColor(pct) {
    if (pct == null) return 'rgba(255,255,255,0.04)';
    const abs = Math.abs(pct);
    // Scale: 0% = near-transparent, ≥15% = full saturation
    const intensity = Math.min(abs / 15, 1);

    if (pct >= 0) {
        // Green — #22c55e at full saturation
        const r = Math.round(34  + (34  - 34)  * intensity);
        const g = Math.round(197 * intensity + 60 * (1 - intensity));
        const b = Math.round(94  * intensity + 30 * (1 - intensity));
        const a = 0.12 + intensity * 0.30;
        return `rgba(${r},${g},${b},${a})`;
    } else {
        // Red — #ef4444 at full saturation
        const r = Math.round(239 * intensity + 80 * (1 - intensity));
        const g = Math.round(68  * intensity + 20 * (1 - intensity));
        const b = Math.round(68  * intensity + 20 * (1 - intensity));
        const a = 0.12 + intensity * 0.30;
        return `rgba(${r},${g},${b},${a})`;
    }
}

/** Map a return % to a border colour (same hue, slightly stronger). */
function returnToBorder(pct) {
    if (pct == null) return 'rgba(255,255,255,0.06)';
    if (pct >= 0) return `rgba(34,197,94,${Math.min(0.2 + Math.abs(pct) / 30, 0.5)})`;
    return `rgba(239,68,68,${Math.min(0.2 + Math.abs(pct) / 30, 0.5)})`;
}

const TREND_CONFIG = {
    Uptrend:            { label: '↑ Uptrend',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
    Downtrend:          { label: '↓ Downtrend',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
    Sideways:           { label: '→ Sideways',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    'Insufficient Data':{ label: '— N/A',        color: '#5a5a6e', bg: 'rgba(90,90,110,0.12)'  },
};

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * HeatmapTile
 *
 * @param {object}  sector       Summary object from /api/markets
 * @param {string}  period       Key into sector.returns: 'r1m' | 'r3m' | 'r6m' | 'r1y' | 'r2y'
 * @param {boolean} isSelected   Renders the active/selected state
 * @param {function} onClick     Called when tile is clicked
 */
export default function HeatmapTile({ sector, period, isSelected, onClick }) {
    const ret   = sector.returns?.[period];
    const trend = TREND_CONFIG[sector.trend] ?? TREND_CONFIG['Insufficient Data'];

    const bg     = isSelected ? 'rgba(6,182,212,0.12)' : returnToColor(ret);
    const border = isSelected ? 'rgba(6,182,212,0.5)'  : returnToBorder(ret);

    const retStr = ret != null
        ? `${ret >= 0 ? '▲' : '▼'} ${Math.abs(ret).toFixed(1)}%`
        : '—';

    return (
        <Box
            onClick={onClick}
            sx={{
                position:     'relative',
                background:   bg,
                border:       `1px solid ${border}`,
                borderRadius: '10px',
                p:            '10px 12px',
                cursor:       'pointer',
                transition:   'all 0.2s ease',
                userSelect:   'none',
                minHeight:    82,
                display:      'flex',
                flexDirection:'column',
                justifyContent:'space-between',
                // Active glow
                ...(isSelected && {
                    boxShadow: '0 0 0 2px rgba(6,182,212,0.25), 0 4px 20px rgba(6,182,212,0.1)',
                }),
                '&:hover': {
                    transform:  isSelected ? 'none' : 'translateY(-2px)',
                    background: isSelected
                        ? 'rgba(6,182,212,0.16)'
                        : returnToColor(ret)?.replace(/[\d.]+\)$/, (m) => {
                            const a = parseFloat(m);
                            return `${Math.min(a + 0.08, 0.55)})`;
                          }),
                    borderColor: isSelected ? 'rgba(6,182,212,0.7)' : undefined,
                },
            }}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${sector.name} — ${retStr} — ${trend.label}`}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
        >
            {/* Sector name */}
            <Typography sx={{
                fontSize:   '0.72rem',
                fontWeight: 500,
                color:      '#8a8a9a',
                lineHeight: 1.3,
                mb:         0.5,
                letterSpacing: '0.02em',
            }}>
                {sector.shortName}
            </Typography>

            {/* Return % — big number */}
            <Typography sx={{
                fontSize:   '1.1rem',
                fontWeight: 700,
                color:      ret == null
                    ? '#5a5a6e'
                    : ret >= 0 ? '#22c55e' : '#ef4444',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
            }}>
                {retStr}
            </Typography>

            {/* Trend badge */}
            <Box sx={{
                mt:           0.75,
                display:      'inline-flex',
                alignItems:   'center',
                px:           0.75,
                py:           '2px',
                borderRadius: '4px',
                background:   trend.bg,
                width:        'fit-content',
            }}>
                <Typography sx={{
                    fontSize:  '0.6rem',
                    fontWeight: 600,
                    color:      trend.color,
                    letterSpacing: '0.04em',
                }}>
                    {trend.label}
                </Typography>
            </Box>
        </Box>
    );
}
