import { useState, useMemo } from 'react';
import { Box, Typography } from '@mui/material';

// ── Constants ──────────────────────────────────────────────────────────────────

const PERIOD_KEYS = ['r1m', 'r3m', 'r6m', 'r1y', 'r2y'];
const PERIOD_LABELS = { r1m: '1M', r3m: '3M', r6m: '6M', r1y: '1Y', r2y: '2Y' };

const TREND_CONFIG = {
    Uptrend:            { label: '↑ Uptrend',   color: '#22c55e' },
    Downtrend:          { label: '↓ Downtrend',  color: '#ef4444' },
    Sideways:           { label: '→ Sideways',   color: '#f59e0b' },
    'Insufficient Data':{ label: '—',            color: '#5a5a6e' },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function ReturnCell({ value }) {
    if (value == null) return <Typography sx={{ fontSize: '0.78rem', color: '#5a5a6e' }}>—</Typography>;
    const isUp = value >= 0;
    return (
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: isUp ? '#22c55e' : '#ef4444' }}>
            {isUp ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
        </Typography>
    );
}

function TrendBadge({ trend }) {
    const cfg = TREND_CONFIG[trend] ?? TREND_CONFIG['Insufficient Data'];
    return (
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: cfg.color }}>
            {cfg.label}
        </Typography>
    );
}

function SortIcon({ active, direction }) {
    if (!active) return <Box component="span" sx={{ opacity: 0.2, ml: 0.5, fontSize: '0.6rem' }}>↕</Box>;
    return (
        <Box component="span" sx={{ ml: 0.5, fontSize: '0.6rem', color: '#06b6d4' }}>
            {direction === 'desc' ? '↓' : '↑'}
        </Box>
    );
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * SectorTable
 *
 * Sortable table showing all sectors and benchmarks with return columns.
 * Default sort: by selectedPeriod return, descending.
 * Clicking a row selects it (opens inline chart panel).
 *
 * @param {object[]} benchmarks
 * @param {object[]} sectors
 * @param {string}   selectedPeriod    Current active period key
 * @param {string|null} selectedSymbol Currently-open chart symbol
 * @param {function} onSelect          Called with (symbol|null)
 */
export default function SectorTable({
    benchmarks,
    sectors,
    selectedPeriod,
    selectedSymbol,
    onSelect,
}) {
    const [sortKey, setSortKey]   = useState(selectedPeriod);
    const [sortDir, setSortDir]   = useState('desc');

    // When selectedPeriod changes externally, update default sort to match
    const effectiveSortKey = sortKey;

    const handleSort = (key) => {
        if (effectiveSortKey === key) {
            setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const allRows = useMemo(() => {
        const combined = [
            ...benchmarks.map((s) => ({ ...s, _group: 'benchmark' })),
            ...sectors.map((s)    => ({ ...s, _group: 'sector'    })),
        ];

        return [...combined].sort((a, b) => {
            let va, vb;
            if (PERIOD_KEYS.includes(effectiveSortKey)) {
                va = a.returns?.[effectiveSortKey] ?? -Infinity;
                vb = b.returns?.[effectiveSortKey] ?? -Infinity;
            } else if (effectiveSortKey === 'name') {
                va = a.name;
                vb = b.name;
                return sortDir === 'asc'
                    ? va.localeCompare(vb)
                    : vb.localeCompare(va);
            } else {
                return 0;
            }
            return sortDir === 'desc' ? vb - va : va - vb;
        });
    }, [benchmarks, sectors, effectiveSortKey, sortDir]);

    const handleRowClick = (symbol) => {
        onSelect(symbol === selectedSymbol ? null : symbol);
    };

    const colHeader = (label, key) => (
        <Box
            component="th"
            onClick={() => handleSort(key)}
            sx={{
                px:           { xs: 1, md: 1.5 },
                py:           1.25,
                textAlign:    PERIOD_KEYS.includes(key) ? 'right' : 'left',
                cursor:       'pointer',
                userSelect:   'none',
                whiteSpace:   'nowrap',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                '&:hover': { color: '#e8e8ed' },
            }}
        >
            <Typography component="span" sx={{
                fontSize:   '0.65rem',
                fontWeight: 600,
                color:      effectiveSortKey === key ? '#06b6d4' : '#5a5a6e',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                transition: 'color 0.15s',
            }}>
                {label}
                <SortIcon active={effectiveSortKey === key} direction={sortDir} />
            </Typography>
        </Box>
    );

    return (
        <Box sx={{
            background:   'rgba(255,255,255,0.02)',
            border:       '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            overflow:     'hidden',
        }}>
            <Box
                component="table"
                sx={{
                    width:           '100%',
                    borderCollapse:  'collapse',
                    tableLayout:     'fixed',
                }}
            >
                {/* ── Header ── */}
                <Box component="thead">
                    <Box component="tr">
                        {colHeader('Index / Sector', 'name')}
                        <Box component="th" sx={{
                            px:           { xs: 1, md: 1.5 },
                            py:           1.25,
                            textAlign:    'left',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <Typography component="span" sx={{
                                fontSize: '0.65rem', fontWeight: 600,
                                color: '#5a5a6e', letterSpacing: '0.08em', textTransform: 'uppercase',
                            }}>
                                Trend
                            </Typography>
                        </Box>
                        {PERIOD_KEYS.map((k) => colHeader(PERIOD_LABELS[k], k))}
                    </Box>
                </Box>

                {/* ── Body ── */}
                <Box component="tbody">
                    {allRows.map((row, idx) => {
                        const isActive = row.symbol === selectedSymbol;
                        const isLast   = idx === allRows.length - 1;

                        return (
                            <Box
                                key={row.symbol}
                                component="tr"
                                onClick={() => handleRowClick(row.symbol)}
                                sx={{
                                    cursor:     'pointer',
                                    transition: 'background 0.15s',
                                    background: isActive
                                        ? 'rgba(6,182,212,0.08)'
                                        : 'transparent',
                                    borderLeft: isActive
                                        ? '2px solid rgba(6,182,212,0.6)'
                                        : '2px solid transparent',
                                    '&:hover': {
                                        background: isActive
                                            ? 'rgba(6,182,212,0.12)'
                                            : 'rgba(255,255,255,0.03)',
                                    },
                                }}
                            >
                                {/* Name + group badge */}
                                <Box component="td" sx={{
                                    px:           { xs: 1, md: 1.5 },
                                    py:           1,
                                    borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography sx={{
                                            fontSize:   '0.82rem',
                                            fontWeight: isActive ? 600 : 400,
                                            color:      isActive ? '#e8e8ed' : '#c8c8d0',
                                            transition: 'color 0.15s',
                                            overflow:   'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {row.name}
                                        </Typography>
                                        {row._group === 'benchmark' && (
                                            <Box sx={{
                                                px:           '5px',
                                                py:           '1px',
                                                borderRadius: '3px',
                                                background:   'rgba(6,182,212,0.1)',
                                                flexShrink:   0,
                                            }}>
                                                <Typography sx={{ fontSize: '0.55rem', color: '#06b6d4', fontWeight: 700 }}>
                                                    INDEX
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>

                                {/* Trend */}
                                <Box component="td" sx={{
                                    px:           { xs: 1, md: 1.5 },
                                    py:           1,
                                    borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                                }}>
                                    <TrendBadge trend={row.trend} />
                                </Box>

                                {/* Return columns */}
                                {PERIOD_KEYS.map((k) => (
                                    <Box key={k} component="td" sx={{
                                        px:           { xs: 1, md: 1.5 },
                                        py:           1,
                                        textAlign:    'right',
                                        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                                        // Highlight the active period column
                                        background:   k === selectedPeriod
                                            ? 'rgba(6,182,212,0.04)'
                                            : 'transparent',
                                    }}>
                                        <ReturnCell value={row.returns?.[k]} />
                                    </Box>
                                ))}
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
}
