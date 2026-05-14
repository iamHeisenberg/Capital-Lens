import { lazy, Suspense } from 'react';
import { Box, Typography } from '@mui/material';

// Lazy-load the heavy Recharts bundle — same pattern as StockAnalysisPage
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

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * SectorChartPanel
 *
 * Inline chart panel that slides in when a sector is selected.
 * Passes sector detail data to PriceChartCard, adapting the API shape
 * (uses symbol → ticker, sets missing OBV/RSI to null gracefully).
 *
 * @param {object|null} data     Full sector data from useMarketDetail
 * @param {boolean}     loading  True while detail is being fetched
 * @param {string|null} error    Error message if fetch failed
 * @param {string|null} symbol   Currently-selected symbol (for visibility guard)
 * @param {function}    onClose  Called when the panel's close button is clicked
 */
export default function SectorChartPanel({ data, loading, error, symbol, onClose }) {
    // Panel is not shown at all when symbol is null
    if (!symbol) return null;

    return (
        <Box
            className="animate-fade-in-up"
            sx={{
                mt:           2,
                background:   'rgba(255,255,255,0.02)',
                border:       '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px',
                overflow:     'hidden',
                animation:    'fadeInUp 0.3s ease-out forwards',
            }}
        >
            {/* ── Panel header ── */}
            <Box sx={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                px:             { xs: 2, md: 3 },
                pt:             2.5,
                pb:             1.5,
                borderBottom:   '1px solid rgba(255,255,255,0.05)',
            }}>
                <Box>
                    <Typography sx={{
                        fontSize:   '0.95rem',
                        fontWeight: 600,
                        color:      '#e8e8ed',
                    }}>
                        {data?.name ?? symbol}
                    </Typography>
                    {data && (
                        <Typography sx={{ fontSize: '0.72rem', color: '#5a5a6e', mt: 0.25 }}>
                            {data.totalDays} trading days · last updated {
                                new Date(data.lastUpdated).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                })
                            }
                        </Typography>
                    )}
                </Box>

                {/* Close button */}
                <Box
                    component="button"
                    onClick={onClose}
                    aria-label="Close chart panel"
                    sx={{
                        background:   'rgba(255,255,255,0.05)',
                        border:       '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        color:        '#8a8a9a',
                        fontSize:     '0.85rem',
                        px:           1.5,
                        py:           0.5,
                        cursor:       'pointer',
                        transition:   'all 0.15s',
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

            {/* ── Chart body ── */}
            <Box sx={{ px: { xs: 1, md: 2 }, pb: 2 }}>
                {/* Loading state */}
                {loading && <ChartSkeleton />}

                {/* Error state */}
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

                {/* Chart — when data is ready */}
                {!loading && !error && data && (
                    <Suspense fallback={<ChartSkeleton />}>
                        <PriceChartCard
                            // Adapt sector data shape → PriceChartCard props
                            ticker={data.symbol}          // used for display + useEffect reset key
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
                            rsiSeries={null}   // RSI not computed for indices (phase 2)
                        />
                    </Suspense>
                )}
            </Box>
        </Box>
    );
}
