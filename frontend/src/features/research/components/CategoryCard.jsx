import { Box, Typography } from '@mui/material';

/**
 * A single colour-coded research category card.
 *
 * Props:
 *   title      {string}   — Category name
 *   icon       {string}   — Emoji icon
 *   color      {string}   — Hex accent colour
 *   bullets    {string[]} — 2–3 bullet points
 *   hasRedFlag {boolean}  — If true, renders a red warning badge (Category 6)
 *   delay      {number}   — Animation stagger index (0–5)
 */
export default function CategoryCard({ title, icon, color, bullets = [], hasRedFlag = false, delay = 0 }) {
    return (
        <Box
            className={`animate-fade-in-up delay-${delay + 1}`}
            sx={{
                position: 'relative',
                background: hasRedFlag
                    ? 'rgba(239, 68, 68, 0.06)'
                    : 'rgba(255, 255, 255, 0.03)',
                border: '1px solid',
                borderColor: hasRedFlag
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'rgba(255, 255, 255, 0.06)',
                borderLeft: `3px solid ${color}`,
                borderRadius: '12px',
                p: 2.5,
                height: '100%',
                backdropFilter: 'blur(16px)',
                transition: 'all 0.3s ease',
                boxShadow: hasRedFlag
                    ? `0 0 20px rgba(239, 68, 68, 0.12)`
                    : 'none',
                '&:hover': {
                    background: hasRedFlag
                        ? 'rgba(239, 68, 68, 0.09)'
                        : 'rgba(255, 255, 255, 0.05)',
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${color}22`,
                },
            }}
        >
            {/* Red flag badge */}
            {hasRedFlag && (
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '4px',
                        px: 1,
                        py: 0.25,
                        mb: 1.5,
                    }}
                >
                    <Typography sx={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 700, letterSpacing: '0.08em' }}>
                        ⚠ RED FLAG DETECTED
                    </Typography>
                </Box>
            )}

            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box
                    sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        background: `${color}20`,
                        border: `1px solid ${color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </Box>
                <Typography
                    sx={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        lineHeight: 1.2,
                    }}
                >
                    {title}
                </Typography>
            </Box>

            {/* Bullet points */}
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {bullets.map((bullet, i) => (
                    <Box
                        component="li"
                        key={i}
                        sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
                    >
                        {/* Dot */}
                        <Box
                            sx={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: color,
                                flexShrink: 0,
                                mt: '6px',
                                opacity: 0.8,
                            }}
                        />
                        <Typography
                            sx={{
                                fontSize: '0.8rem',
                                color: '#c8c8d0',
                                lineHeight: 1.55,
                                fontWeight: 400,
                            }}
                        >
                            {bullet}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
