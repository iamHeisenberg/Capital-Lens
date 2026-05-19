import { lazy, Suspense, useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import useSectorStocks from '../hooks/useSectorStocks';
import SectorStocksTable from './SectorStocksTable';

// Lazy-load the heavy Recharts bundle
const PriceChartCard = lazy(() =>
    import('../../stock-analysis/components/PriceChartCard')
);

// ── Loading skeleton ───────────────────────────────────────────────────────────

function ChartSkeleton() {
    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Box className="skeleton-pulse" sx={{ height: 32, width: '40%', mb: 2 }} />
            <Box className="skeleton-pulse" sx={{ height: 320, width: '100%', borderRadius: '8px' }} />
        </Box>
    );
}

// ── Tab button ─────────────────────────────────────────────────────────────────

function TabButton({ label, active, onClick }) {
    return (
        <Box
            component="button"
            onClick={onClick}
            sx={{
                px:           1.5,
                py:           0.6,
                borderRadius: '6px',
                border:       '1px solid transparent',
                background:   active ? 'rgba(6,182,212,0.12)' : 'transparent',
                color:        active ? '#06b6d4' : '#5a5a6e',
                fontSize:     '0.72rem',
                fontWeight:   active ? 600 : 400,
                cursor:       'pointer',
                fontFamily:   'inherit',
                transition:   'all 0.15s',
                borderColor:  active ? 'rgba(6,182,212,0.35)' : 'transparent',
                '&:hover': {
                    color:      active ? '#06b6d4' : '#c8c8d0',
                    background: active ? 'rgba(6,182,212,0.16)' : 'rgba(255,255,255,0.04)',
                },
            }}
        >
            {label}
        </Box>
    );
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * SectorDetailPanel
 *
 * Inline panel that opens when a sector/benchmark tile is selected.
 *
 * For SECTORS: shows two tabs — [Stocks (n)] | [Chart]
 *   - Stocks tab (default): constituent stock returns table
 *   - Chart tab: full price chart with DMA overlays
 *
 * For BENCHMARKS: shows Chart tab only (no Stocks tab).
 *
 * @param {object|null} sectorSummary   Summary object from useMarkets (has .group, .symbol, .name)
 * @param {object|null} detailData      Full chart data from useMarketDetail
 * @param {boolean}     detailLoading   True while detail data is fetching
 * @param {string|null} detailError     Error from detail fetch
 * @param {string}      selectedPeriod  Active period key — drives default sort in stocks table
 * @param {function}    onClose         Called when close button is clicked
 */
export default function SectorDetailPanel({
    sectorSummary,
    detailData,
    detailLoading,
    detailError,
    selectedPeriod,
    onClose,
}) {
    const isBenchmark = sectorSummary?.group === 'benchmark';

    // Benchmarks default to chart; sectors default to stocks
    const [activeTab, setActiveTab] = useState(isBenchmark ? 'chart' : 'stocks');

    // Reset tab when sector changes
    useEffect(() => {
        setActiveTab(isBenchmark ? 'chart' : 'stocks');
    }, [sectorSummary?.symbol, isBenchmark]);

    // Fetch constituent stocks (hook skips for benchmarks automatically)
    const {
        stocks,
        sectorReturns,
        totalStocks,
        loading: stocksLoading,
        error:   stocksError,
    } = useSectorStocks(sectorSummary?.symbol, sectorSummary?.group);

    if (!sectorSummary) return null;

    const stocksLabel = stocksLoading
        ? '📊 Stocks'
        : `📊 Stocks (${totalStocks})`;

    return (
        <Box
            sx={{
                mt:           2,
                background:   'rgba(255,255,255,0.02)',
                border:       '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px',
                overflow:     'hidden',
                animation:    'fadeInUp 0.25s ease-out forwards',
            }}
        >
            {/* ── Panel header ── */}
            <Box sx={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                px:             { xs: 2, md: 3 },
                pt:             2,
                pb:             1.5,
                borderBottom:   '1px solid rgba(255,255,255,0.05)',
                flexWrap:       'wrap',
                gap:            1,
            }}>
                {/* Left: name + subtitle */}
                <Box>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#e8e8ed' }}>
                        {sectorSummary.name}
                    </Typography>
                    {detailData && (
                        <Typography sx={{ fontSize: '0.7rem', color: '#5a5a6e', mt: 0.25 }}>
                            {detailData.totalDays} trading days · updated{' '}
                            {new Date(detailData.lastUpdated).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                            })}
                        </Typography>
                    )}
                </Box>

                {/* Right: tabs + close */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Stocks tab only for sectors */}
                    {!isBenchmark && (
                        <TabButton
                            label={stocksLabel}
                            active={activeTab === 'stocks'}
                            onClick={() => setActiveTab('stocks')}
                        />
                    )}
                    <TabButton
                        label="📈 Chart"
                        active={activeTab === 'chart'}
                        onClick={() => setActiveTab('chart')}
                    />

                    {/* Close */}
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
                            px:           1.25,
                            py:           0.5,
                            cursor:       'pointer',
                            transition:   'all 0.15s',
                            fontFamily:   'inherit',
                            ml:           0.5,
                            '&:hover': { background: 'rgba(255,255,255,0.08)', color: '#e8e8ed' },
                        }}
                    >
                        ✕
                    </Box>
                </Box>
            </Box>

            {/* ── Tab content ── */}
            <Box sx={{ px: { xs: 1, md: 2 }, pb: 2 }}>

                {/* Stocks tab */}
                {activeTab === 'stocks' && !isBenchmark && (
                    <Box sx={{ pt: 1 }}>
                        <SectorStocksTable
                            stocks={stocks}
                            sectorReturns={sectorReturns}
                            sectorName={sectorSummary.name}
                            selectedPeriod={selectedPeriod}
                            loading={stocksLoading}
                            error={stocksError}
                        />
                    </Box>
                )}

                {/* Chart tab */}
                {activeTab === 'chart' && (
                    <>
                        {detailLoading && <ChartSkeleton />}

                        {!detailLoading && detailError && (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '0.85rem', color: '#ef4444', mb: 1 }}>
                                    Failed to load chart data
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#5a5a6e' }}>
                                    {detailError}
                                </Typography>
                            </Box>
                        )}

                        {!detailLoading && !detailError && detailData && (
                            <Suspense fallback={<ChartSkeleton />}>
                                <PriceChartCard
                                    ticker={detailData.symbol}
                                    historicalCloses={detailData.historicalCloses}
                                    historicalDates={detailData.historicalDates}
                                    historicalVolumes={detailData.historicalVolumes}
                                    dma50Series={detailData.dma50Series}
                                    dma200Series={detailData.dma200Series}
                                    latestClose={detailData.latestClose}
                                    dma50={detailData.dma50}
                                    dma200={detailData.dma200}
                                    trend={detailData.trend}
                                    hasVolume={detailData.hasVolume}
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
