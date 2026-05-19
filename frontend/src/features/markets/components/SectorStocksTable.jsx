import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

// ── Constants ──────────────────────────────────────────────────────────────────

const PERIOD_KEYS   = ['r1m', 'r3m', 'r6m', 'r1y', 'r2y'];
const PERIOD_LABELS = { r1m: '1M', r3m: '3M', r6m: '6M', r1y: '1Y', r2y: '2Y' };

// ── Helpers ────────────────────────────────────────────────────────────────────

function ReturnCell({ value, reference }) {
    if (value == null) {
        return <Typography sx={{ fontSize: '0.75rem', color: '#5a5a6e' }}>—</Typography>;
    }
    const isUp    = value >= 0;
    const beatsRef = reference != null && value > reference;
    const lagsRef  = reference != null && value < reference;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.4 }}>
            <Typography sx={{
                fontSize:   '0.75rem',
                fontWeight: 600,
                color:      isUp ? '#22c55e' : '#ef4444',
            }}>
                {isUp ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
            </Typography>
            {/* vs-sector indicator */}
            {beatsRef && (
                <Typography sx={{ fontSize: '0.6rem', color: '#22c55e', lineHeight: 1 }} title="Outperforms sector">
                    ↑
                </Typography>
            )}
            {lagsRef && (
                <Typography sx={{ fontSize: '0.6rem', color: '#ef4444', lineHeight: 1 }} title="Lags sector">
                    ↓
                </Typography>
            )}
        </Box>
    );
}

function SortIcon({ active, direction }) {
    if (!active) return <Box component="span" sx={{ opacity: 0.2, ml: 0.5, fontSize: '0.55rem' }}>↕</Box>;
    return <Box component="span" sx={{ ml: 0.5, fontSize: '0.55rem', color: '#06b6d4' }}>{direction === 'desc' ? '↓' : '↑'}</Box>;
}

// ── Skeleton row ───────────────────────────────────────────────────────────────

function SkeletonRows() {
    return Array.from({ length: 8 }, (_, i) => (
        <Box key={i} component="tr">
            <Box component="td" sx={{ p: 1, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <Box className="skeleton-pulse" sx={{ height: 14, width: '70%', borderRadius: '4px' }} />
            </Box>
            {PERIOD_KEYS.map((k) => (
                <Box key={k} component="td" sx={{ p: 1, borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right' }}>
                    <Box className="skeleton-pulse" sx={{ height: 14, width: 48, borderRadius: '4px', ml: 'auto' }} />
                </Box>
            ))}
        </Box>
    ));
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * SectorStocksTable
 *
 * Sortable table of constituent stocks for a sector.
 * Shows sector return as a pinned reference row at the top.
 * Beat/lag indicators compare each stock return to the sector return.
 * Stock name is clickable → navigates to /technicals/:ticker
 *
 * @param {object[]}    stocks          From useSectorStocks
 * @param {object|null} sectorReturns   { r1m, r3m, r6m, r1y, r2y } of the parent sector
 * @param {string}      sectorName      Display name e.g. "Nifty IT"
 * @param {string}      selectedPeriod  Active period key — drives initial sort column
 * @param {boolean}     loading
 * @param {string|null} error
 */
export default function SectorStocksTable({
    stocks,
    sectorReturns,
    sectorName,
    selectedPeriod,
    loading,
    error,
}) {
    const navigate = useNavigate();

    const [sortKey, setSortKey] = useState(selectedPeriod);
    const [sortDir, setSortDir] = useState('desc');

    const handleSort = (key) => {
        if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        else { setSortKey(key); setSortDir('desc'); }
    };

    const sorted = useMemo(() => {
        return [...stocks].sort((a, b) => {
            const va = a.returns?.[sortKey] ?? -Infinity;
            const vb = b.returns?.[sortKey] ?? -Infinity;
            return sortDir === 'desc' ? vb - va : va - vb;
        });
    }, [stocks, sortKey, sortDir]);

    const handleStockClick = (symbol) => {
        // Strip .NS suffix to get the base ticker used by /technicals
        const ticker = symbol.replace(/\.NS$/i, '');
        navigate(`/technicals/${ticker}.NS`);
    };

    const colHeader = (label, key) => (
        <Box
            key={key}
            component="th"
            onClick={() => handleSort(key)}
            sx={{
                px:           { xs: 0.75, md: 1.25 },
                py:           1,
                textAlign:    'right',
                cursor:       'pointer',
                userSelect:   'none',
                whiteSpace:   'nowrap',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background:   key === selectedPeriod ? 'rgba(6,182,212,0.04)' : 'transparent',
            }}
        >
            <Typography component="span" sx={{
                fontSize:      '0.6rem',
                fontWeight:    600,
                color:         sortKey === key ? '#06b6d4' : '#5a5a6e',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
            }}>
                {label}
                <SortIcon active={sortKey === key} direction={sortDir} />
            </Typography>
        </Box>
    );

    // ── Error state ──────────────────────────────────────────────────────────────
    if (error) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#ef4444', mb: 0.5 }}>
                    Failed to load constituent stocks
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#5a5a6e' }}>{error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>

                {/* ── Header ── */}
                <Box component="thead">
                    <Box component="tr">
                        {/* Name column */}
                        <Box component="th" sx={{
                            px:           { xs: 0.75, md: 1.25 },
                            py:           1,
                            textAlign:    'left',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            whiteSpace:   'nowrap',
                        }}>
                            <Typography sx={{
                                fontSize: '0.6rem', fontWeight: 600, color: '#5a5a6e',
                                letterSpacing: '0.08em', textTransform: 'uppercase',
                            }}>
                                Stock
                            </Typography>
                        </Box>
                        {PERIOD_KEYS.map((k) => colHeader(PERIOD_LABELS[k], k))}
                    </Box>
                </Box>

                {/* ── Body ── */}
                <Box component="tbody">

                    {/* Sector reference row — pinned at top */}
                    {sectorReturns && (
                        <Box component="tr" sx={{
                            background:  'rgba(6,182,212,0.05)',
                            borderLeft:  '2px solid rgba(6,182,212,0.4)',
                        }}>
                            <Box component="td" sx={{ px: { xs: 0.75, md: 1.25 }, py: 0.75, borderBottom: '1px solid rgba(6,182,212,0.12)' }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#06b6d4' }}>
                                    {sectorName} (Index)
                                </Typography>
                            </Box>
                            {PERIOD_KEYS.map((k) => (
                                <Box key={k} component="td" sx={{
                                    px:           { xs: 0.75, md: 1.25 },
                                    py:           0.75,
                                    textAlign:    'right',
                                    borderBottom: '1px solid rgba(6,182,212,0.12)',
                                    background:   k === selectedPeriod ? 'rgba(6,182,212,0.04)' : 'transparent',
                                }}>
                                    <ReturnCell value={sectorReturns[k]} reference={null} />
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* Loading skeletons */}
                    {loading && <SkeletonRows />}

                    {/* Stock rows */}
                    {!loading && sorted.map((stock, idx) => {
                        const isLast = idx === sorted.length - 1;
                        return (
                            <Box
                                key={stock.symbol}
                                component="tr"
                                sx={{
                                    cursor:     stock.available ? 'pointer' : 'default',
                                    transition: 'background 0.12s',
                                    opacity:    stock.available ? 1 : 0.45,
                                    '&:hover':  stock.available
                                        ? { background: 'rgba(255,255,255,0.03)' }
                                        : {},
                                }}
                                onClick={() => stock.available && handleStockClick(stock.symbol)}
                                title={stock.available ? `Open ${stock.name} in Technicals` : 'Data unavailable'}
                            >
                                <Box component="td" sx={{
                                    px:           { xs: 0.75, md: 1.25 },
                                    py:           0.85,
                                    borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                                }}>
                                    <Typography sx={{
                                        fontSize:   '0.78rem',
                                        fontWeight: 400,
                                        color:      stock.available ? '#c8c8d0' : '#5a5a6e',
                                        transition: 'color 0.12s',
                                        '&:hover':  stock.available ? { color: '#e8e8ed' } : {},
                                    }}>
                                        {stock.name}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.62rem', color: '#5a5a6e', mt: '1px' }}>
                                        {stock.symbol.replace('.NS', '')}
                                    </Typography>
                                </Box>

                                {PERIOD_KEYS.map((k) => (
                                    <Box key={k} component="td" sx={{
                                        px:           { xs: 0.75, md: 1.25 },
                                        py:           0.85,
                                        textAlign:    'right',
                                        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                                        background:   k === selectedPeriod ? 'rgba(6,182,212,0.03)' : 'transparent',
                                    }}>
                                        <ReturnCell
                                            value={stock.returns?.[k]}
                                            reference={sectorReturns?.[k]}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        );
                    })}

                    {/* Empty state */}
                    {!loading && sorted.length === 0 && !error && (
                        <Box component="tr">
                            <Box component="td" colSpan={6} sx={{ p: 3, textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '0.8rem', color: '#5a5a6e' }}>
                                    No constituent data available
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
