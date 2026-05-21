import { useState, useMemo } from 'react';
import { Box, Typography, Skeleton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// ── Constants ─────────────────────────────────────────────────────────────────
const PERIODS = [
    { key: 'r1m', label: '1M' },
    { key: 'r3m', label: '3M' },
    { key: 'r6m', label: '6M' },
    { key: 'r1y', label: '1Y' },
    { key: 'r2y', label: '2Y' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatReturn(val) {
    if (val == null) return '—';
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
}

function getReturnColor(val) {
    if (val == null) return '#5a5a6e';
    if (val > 30)  return '#22c55e';
    if (val > 15)  return '#4ade80';
    if (val > 5)   return '#86efac';
    if (val > 0)   return '#bbf7d0';
    if (val > -5)  return '#fca5a5';
    if (val > -15) return '#f87171';
    if (val > -30) return '#ef4444';
    return '#dc2626';
}

function getReturnBg(val) {
    if (val == null) return 'transparent';
    const opacity = Math.min(Math.abs(val) / 40, 1) * 0.18;
    return val >= 0
        ? `rgba(34,197,94,${opacity})`
        : `rgba(239,68,68,${opacity})`;
}

function BeatLagBadge({ stockReturn, sectorReturn }) {
    if (stockReturn == null || sectorReturn == null) return null;
    const beats = stockReturn > sectorReturn;
    return (
        <Tooltip
            title={beats
                ? `Outperformed sector by ${(stockReturn - sectorReturn).toFixed(1)}%`
                : `Lagged sector by ${(sectorReturn - stockReturn).toFixed(1)}%`}
            placement="top"
            arrow
        >
            <Box component="span" sx={{
                ml: 0.5,
                fontSize: '0.6rem',
                fontWeight: 700,
                color: beats ? '#22c55e' : '#f87171',
                cursor: 'default',
            }}>
                {beats ? '↑' : '↓'}
            </Box>
        </Tooltip>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
/**
 * Sortable constituent stocks table.
 *
 * Props:
 *   data          — response from /api/markets/:symbol/stocks
 *   loading       — bool
 *   error         — string | null
 *   activePeriod  — 'r1m' | 'r3m' | 'r6m' | 'r1y' | 'r2y'
 */
export default function SectorStocksTable({ data, loading, error, activePeriod }) {
    const navigate = useNavigate();

    // Sort column — defaults to the currently selected heatmap period
    const [sortKey, setSortKey] = useState(null);

    // When activePeriod changes (parent period selector), reset sort to follow it
    const effectiveSortKey = sortKey ?? activePeriod ?? 'r1y';
    const [sortAsc, setSortAsc] = useState(false);

    function handleSort(key) {
        if (effectiveSortKey === key) {
            setSortAsc((a) => !a);
        } else {
            setSortKey(key);
            setSortAsc(false); // new column → descending first
        }
    }

    const sortedStocks = useMemo(() => {
        if (!data?.stocks) return [];
        return [...data.stocks].sort((a, b) => {
            const av = a.returns?.[effectiveSortKey] ?? -Infinity;
            const bv = b.returns?.[effectiveSortKey] ?? -Infinity;
            return sortAsc ? av - bv : bv - av;
        });
    }, [data, effectiveSortKey, sortAsc]);

    // ── Loading skeleton ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <Box sx={{ pt: 1 }}>
                {[...Array(8)].map((_, i) => (
                    <Skeleton
                        key={i}
                        variant="rectangular"
                        sx={{
                            height: 40, mb: 0.5, borderRadius: '6px',
                            bgcolor: 'rgba(255,255,255,0.05)',
                            animationDelay: `${i * 60}ms`,
                        }}
                    />
                ))}
            </Box>
        );
    }

    // ── Error ──────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <Box sx={{
                py: 4, textAlign: 'center',
                color: '#f87171', fontSize: '0.8rem',
            }}>
                Unable to load stock data — {error}
            </Box>
        );
    }

    if (!data) return null;

    const sectorReturns = data.sectorReturns ?? {};

    // ── Column header ──────────────────────────────────────────────────────────
    const ColHeader = ({ periodKey, label }) => {
        const active = effectiveSortKey === periodKey;
        return (
            <Box
                component="th"
                onClick={() => handleSort(periodKey)}
                sx={{
                    py: 1, px: 1.5,
                    textAlign:  'right',
                    fontSize:   '0.62rem',
                    fontWeight: active ? 700 : 500,
                    color:      active ? '#06b6d4' : '#5a5a6e',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor:     'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                    '&:hover': { color: '#8a8a9a' },
                }}
            >
                {label} {active ? (sortAsc ? '↑' : '↓') : ''}
            </Box>
        );
    };

    // ── Return cell ────────────────────────────────────────────────────────────
    const ReturnCell = ({ val, sectorVal, isActive }) => (
        <Box
            component="td"
            sx={{
                py: 1, px: 1.5,
                textAlign:  'right',
                fontSize:   '0.78rem',
                fontWeight: isActive ? 600 : 400,
                color:      getReturnColor(val),
                background: isActive ? getReturnBg(val) : 'transparent',
                fontFamily: '"SF Mono", "Fira Code", monospace',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s',
            }}
        >
            {formatReturn(val)}
            {isActive && (
                <BeatLagBadge stockReturn={val} sectorReturn={sectorVal} />
            )}
        </Box>
    );

    return (
        <Box sx={{ overflowX: 'auto' }}>
            <Box
                component="table"
                sx={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    tableLayout: 'fixed',
                }}
            >
                {/* ── Header ── */}
                <Box component="thead">
                    <Box component="tr" sx={{
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <Box component="th" sx={{
                            py: 1, px: 1.5,
                            textAlign:  'left',
                            fontSize:   '0.62rem',
                            fontWeight: 500,
                            color:      '#5a5a6e',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            width: '38%',
                        }}>
                            Stock
                        </Box>
                        {PERIODS.map(({ key, label }) => (
                            <ColHeader key={key} periodKey={key} label={label} />
                        ))}
                    </Box>
                </Box>

                <Box component="tbody">
                    {/* ── Sector reference row ── */}
                    <Box component="tr" sx={{
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        background:   'rgba(6,182,212,0.04)',
                    }}>
                        <Box component="td" sx={{
                            py: 1, px: 1.5,
                            fontSize:   '0.72rem',
                            fontWeight: 600,
                            color:      '#06b6d4',
                            letterSpacing: '0.02em',
                        }}>
                            {data.sectorName}
                            <Typography component="span" sx={{
                                ml: 0.75, fontSize: '0.58rem', fontWeight: 500,
                                color: '#5a5a6e', textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                            }}>
                                Index
                            </Typography>
                        </Box>
                        {PERIODS.map(({ key }) => (
                            <Box
                                key={key}
                                component="td"
                                sx={{
                                    py: 1, px: 1.5,
                                    textAlign:  'right',
                                    fontSize:   '0.75rem',
                                    fontWeight: effectiveSortKey === key ? 700 : 500,
                                    color:      getReturnColor(sectorReturns[key]),
                                    fontFamily: '"SF Mono", "Fira Code", monospace',
                                    background: effectiveSortKey === key
                                        ? getReturnBg(sectorReturns[key])
                                        : 'transparent',
                                }}
                            >
                                {formatReturn(sectorReturns[key])}
                            </Box>
                        ))}
                    </Box>

                    {/* ── Stock rows ── */}
                    {sortedStocks.map((stock) => (
                        <Box
                            key={stock.symbol}
                            component="tr"
                            onClick={() => {
                                if (!stock.available) return;
                                const ticker = stock.symbol.replace('.NS', '');
                                navigate(`/technicals/${ticker}`);
                            }}
                            sx={{
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                cursor: stock.available ? 'pointer' : 'default',
                                opacity: stock.available ? 1 : 0.45,
                                transition: 'background 0.12s',
                                '&:hover': stock.available
                                    ? { background: 'rgba(255,255,255,0.03)' }
                                    : {},
                                '&:last-child': { borderBottom: 'none' },
                            }}
                        >
                            <Box component="td" sx={{
                                py: 1, px: 1.5,
                                fontSize:   '0.78rem',
                                fontWeight: 500,
                                color:      stock.available ? '#c8c8d0' : '#5a5a6e',
                                overflow:   'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {stock.name}
                                {stock.available && (
                                    <Typography component="span" sx={{
                                        display: 'block',
                                        fontSize: '0.58rem',
                                        color: '#5a5a6e',
                                        lineHeight: 1.2,
                                    }}>
                                        {stock.symbol.replace('.NS', '')}
                                    </Typography>
                                )}
                            </Box>
                            {PERIODS.map(({ key }) => (
                                <ReturnCell
                                    key={key}
                                    val={stock.returns?.[key] ?? null}
                                    sectorVal={sectorReturns[key] ?? null}
                                    isActive={effectiveSortKey === key}
                                />
                            ))}
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* ── Footer stats ── */}
            <Box sx={{
                mt: 1.5, pt: 1,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', gap: 2, flexWrap: 'wrap',
            }}>
                <Typography sx={{ fontSize: '0.62rem', color: '#5a5a6e' }}>
                    {data.availableStocks}/{data.totalStocks} stocks with data
                </Typography>
                <Typography sx={{ fontSize: '0.62rem', color: '#5a5a6e' }}>
                    Click any row to open full analysis
                </Typography>
                <Typography sx={{ fontSize: '0.62rem', color: '#5a5a6e' }}>
                    ↑↓ = beat / lag vs index
                </Typography>
            </Box>
        </Box>
    );
}
