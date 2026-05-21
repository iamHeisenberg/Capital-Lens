import { lazy, Suspense, useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import SectorStocksTable from './SectorStocksTable';
import { useSectorStocks }  from '../hooks/useSectorStocks';

// Lazy-load the heavy Recharts bundle
const PriceChartCard = lazy(() =>
    import('../../stock-analysis/components/PriceChartCard')
);

// ── Chart skeleton ─────────────────────────────────────────────────────────────
function ChartSkeleton() {
    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Box className="skeleton-pulse" sx={{ height: 32, width: '40%', mb: 2 }} />
            <Box className="skeleton-pulse" sx={{ height: 320, width: '100%', borderRadius: '8px' }} />
        </Box>
    );
}

// ── Tab button ─────────────────────────────────────────────────────────────────
function Tab({ label, active, onClick, count }) {
    return (
        <Box
            component="button"
            onClick={onClick}
            sx={{
                px: 1.5, py: 0.75,
                borderRadius: '6px',
                border: `1px solid ${active ? 'rgba(6,182,212,0.4)' : 'transparent'}`,
                background: active ? 'rgba(6,182,212,0.1)' : 'transparent',
                color: active ? '#06b6d4' : '#5a5a6e',
                fontSize: '0.72rem',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                transition: 'all 0.15s',
                '&:hover': {
                    color: active ? '#06b6d4' : '#8a8a9a',
                    background: active ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.04)',
                },
            }}
        >
            {label}
            {count != null && (
                <Box sx={{
                    px: '5px', py: '1px',
                    borderRadius: '4px',
                    background: active ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.07)',
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    color: active ? '#06b6d4' : '#5a5a6e',
                    lineHeight: 1.5,
                }}>
                    {count}
                </Box>
            )}
        </Box>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
/**
 * SectorDetailPanel
 *
 * Unified panel with two tabs for sector indices: [Stocks | Chart]
 * For benchmarks (isBenchmark=true), only the Chart tab is shown — no tab bar.
 *
 * Props:
 *   symbol        — currently selected symbol, e.g. '^CNXIT'
 *   isBenchmark   — true for NIFTY 50 / 100 / 200 / MIDCAP 150
 *   data          — full sector data from useMarketDetail (chart data)
 *   loading       — chart data loading state
 *   error         — chart data error
 *   onClose       — called when ✕ is clicked
 *   activePeriod  — heatmap period key ('r1m' | 'r3m' | 'r6m' | 'r1y' | 'r2y')
 */
export default function SectorDetailPanel({
    symbol,
    isBenchmark = false,
    data,
    loading,
    error,
    onClose,
    activePeriod = 'r1y',
}) {
    // ── Tab state ──────────────────────────────────────────────────────────────
    // Benchmarks always show chart; sectors default to stocks tab
    const [activeTab, setActiveTab] = useState(isBenchmark ? 'chart' : 'stocks');

    // Reset to stocks tab whenever a new sector is selected
    useEffect(() => {
        setActiveTab(isBenchmark ? 'chart' : 'stocks');
    }, [symbol, isBenchmark]);

    // ── Stocks data ────────────────────────────────────────────────────────────
    const {
        data:    stocksData,
        loading: stocksLoading,
        error:   stocksError,
    } = useSectorStocks(symbol, isBenchmark);

    if (!symbol) return null;

    const stockCount = stocksData?.totalStocks ?? null;

    return (
        <Box
            className="animate-fade-in-up"
            sx={{
                mt: 2,
                background:   'rgba(255,255,255,0.02)',
                border:       '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px',
                overflow:     'hidden',
            }}
        >
            {/* ── Panel header ── */}
            <Box sx={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                px: { xs: 2, md: 3 },
                pt: 2,
                pb: 1.5,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                flexWrap: 'wrap',
                gap: 1.5,
            }}>
                {/* Left: name + meta */}
                <Box>
                    <Typography sx={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#e8e8ed',
                    }}>
                        {data?.name ?? symbol}
                    </Typography>
                    {data && (
                        <Typography sx={{ fontSize: '0.68rem', color: '#5a5a6e', mt: 0.25 }}>
                            {data.totalDays} trading days · last updated{' '}
                            {new Date(data.lastUpdated).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                            })}
                        </Typography>
                    )}
                </Box>

                {/* Right: tabs (sectors only) + close */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {!isBenchmark && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tab
                                label="📊 Stocks"
                                count={stockCount}
                                active={activeTab === 'stocks'}
                                onClick={() => setActiveTab('stocks')}
                            />
                            <Tab
                                label="📈 Chart"
                                active={activeTab === 'chart'}
                                onClick={() => setActiveTab('chart')}
                            />
                        </Box>
                    )}

                    <Box
                        component="button"
                        onClick={onClose}
                        aria-label="Close panel"
                        sx={{
                            background:   'rgba(255,255,255,0.05)',
                            border:       '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '6px',
                            color:        '#8a8a9a',
                            fontSize:     '0.8rem',
                            px:           1.5,
                            py:           0.5,
                            cursor:       'pointer',
                            transition:   'all 0.15s',
                            fontFamily:   'inherit',
                            flexShrink:   0,
                            '&:hover': {
                                background:  'rgba(255,255,255,0.08)',
                                color:       '#e8e8ed',
                                borderColor: 'rgba(255,255,255,0.14)',
                            },
                        }}
                    >
                        ✕ Close
                    </Box>
                </Box>
            </Box>

            {/* ── Tab body ── */}
            <Box sx={{ px: { xs: 1.5, md: 3 }, py: 2 }}>

                {/* ── Stocks tab ── */}
                {activeTab === 'stocks' && (
                    <SectorStocksTable
                        data={stocksData}
                        loading={stocksLoading}
                        error={stocksError}
                        activePeriod={activePeriod}
                    />
                )}

                {/* ── Chart tab ── */}
                {activeTab === 'chart' && (
                    <>
                        {loading && <ChartSkeleton />}

                        {!loading && error && (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '0.85rem', color: '#ef4444', mb: 1 }}>
                                    Failed to load chart data
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#5a5a6e' }}>
                                    {error}
                                </Typography>
                            </Box>
                        )}

                        {!loading && !error && data && (
                            <Suspense fallback={<ChartSkeleton />}>
                                <PriceChartCard
                                    ticker={data.symbol}
                                    historicalCloses={data.historicalCloses}
                                    historicalDates={data.historicalDates}
                                    historicalVolumes={data.historicalVolumes}
                                    dma50Series={data.dma50Series}
                                    dma200Series={data.dma200Series}
                                    latestClose={data.latestClose}
                                    dma50={data.dma50}
                                    dma200={data.dma200}
                                    trend={data.trend}
                                    hasVolume={data.hasVolume}
                                    rsiSeries={null}
                                />
                            </Suspense>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
}
