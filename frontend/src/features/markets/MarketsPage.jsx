import { useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import PageLayout from '../../components/layout/PageLayout';
import useMarkets from './hooks/useMarkets';
import useMarketDetail from './hooks/useMarketDetail';
import SectorHeatmap from './components/SectorHeatmap';
import SectorTable from './components/SectorTable';
import SectorDetailPanel from './components/SectorDetailPanel';

// ── Period selector ────────────────────────────────────────────────────────────

const PERIODS = [
    { key: 'r1m', label: '1M' },
    { key: 'r3m', label: '3M' },
    { key: 'r6m', label: '6M' },
    { key: 'r1y', label: '1Y' },
    { key: 'r2y', label: '2Y' },
];

function PeriodSelector({ value, onChange }) {
    return (
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {PERIODS.map(({ key, label }) => {
                const active = key === value;
                return (
                    <Box
                        key={key}
                        component="button"
                        onClick={() => onChange(key)}
                        sx={{
                            px:           1.75,
                            py:           0.6,
                            borderRadius: '6px',
                            border:       `1px solid ${active ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.08)'}`,
                            background:   active ? 'rgba(6,182,212,0.12)' : 'transparent',
                            color:        active ? '#06b6d4' : '#8a8a9a',
                            fontSize:     '0.72rem',
                            fontWeight:   active ? 600 : 400,
                            cursor:       'pointer',
                            transition:   'all 0.15s ease',
                            fontFamily:   'inherit',
                            '&:hover': {
                                background:  active ? 'rgba(6,182,212,0.18)' : 'rgba(255,255,255,0.05)',
                                color:       active ? '#06b6d4' : '#c8c8d0',
                                borderColor: active ? 'rgba(6,182,212,0.7)' : 'rgba(255,255,255,0.14)',
                            },
                        }}
                    >
                        {label}
                    </Box>
                );
            })}
        </Box>
    );
}

// ── Loading skeleton ────────────────────────────────────────────────────────────

function LoadingSkeleton() {
    return (
        <PageLayout>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header */}
                <Box className="skeleton-pulse" sx={{ height: 40, width: '28%', mb: 1.5 }} />
                <Box className="skeleton-pulse" sx={{ height: 18, width: '50%', mb: 4 }} />
                {/* Period selector */}
                <Box sx={{ display: 'flex', gap: 1, mb: 4 }}>
                    {[1,2,3,4,5].map((i) => (
                        <Box key={i} className="skeleton-pulse" sx={{ height: 32, width: 48, borderRadius: '6px' }} />
                    ))}
                </Box>
                {/* Heatmap */}
                <Box className="skeleton-pulse" sx={{ height: 16, width: 100, mb: 1.5 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 3 }}>
                    {[1,2,3,4].map((i) => (
                        <Box key={i} className="skeleton-pulse" sx={{ height: 82, borderRadius: '10px' }} />
                    ))}
                </Box>
                <Box className="skeleton-pulse" sx={{ height: 16, width: 80, mb: 1.5 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, mb: 5 }}>
                    {[1,2,3,4,5,6,7,8,9,10,11].map((i) => (
                        <Box key={i} className="skeleton-pulse" sx={{ height: 82, borderRadius: '10px' }} />
                    ))}
                </Box>
                {/* Table */}
                <Box className="skeleton-pulse" sx={{ height: 300, borderRadius: '12px' }} />
            </Container>
        </PageLayout>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function MarketsPage() {
    const [selectedPeriod, setSelectedPeriod] = useState('r1y');
    const [selectedSymbol, setSelectedSymbol] = useState(null);

    const { benchmarks, sectors, loading, error } = useMarkets();
    const { data: detailData, loading: detailLoading, error: detailError } =
        useMarketDetail(selectedSymbol);

    // Derive selected sector's metadata (for group check in SectorDetailPanel)
    const selectedMeta = [...(benchmarks ?? []), ...(sectors ?? [])]
        .find((s) => s.symbol === selectedSymbol) ?? null;

    const handleSelect = (symbol) => {
        setSelectedSymbol(symbol);
        // Scroll panel into view after a brief render delay
        if (symbol) {
            setTimeout(() => {
                document.getElementById('markets-chart-panel')?.scrollIntoView({
                    behavior: 'smooth', block: 'nearest',
                });
            }, 80);
        }
    };

    if (loading) return <LoadingSkeleton />;

    if (error) {
        return (
            <PageLayout>
                <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '1rem', color: '#ef4444', mb: 1 }}>
                        Failed to load markets data
                    </Typography>
                    <Typography sx={{ fontSize: '0.82rem', color: '#5a5a6e' }}>
                        {error}
                    </Typography>
                </Container>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>

                {/* ── Page header ── */}
                <Box
                    className="animate-fade-in-up"
                    sx={{ mb: 4 }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 0.75 }}>
                        <Typography
                            component="h1"
                            sx={{
                                fontSize:      { xs: '1.6rem', md: '2rem' },
                                fontWeight:    700,
                                letterSpacing: '-0.03em',
                                color:         '#e8e8ed',
                                lineHeight:    1.2,
                            }}
                        >
                            Markets
                        </Typography>
                        <Box sx={{
                            px:           '8px',
                            py:           '3px',
                            borderRadius: '6px',
                            background:   'rgba(34,197,94,0.1)',
                            border:       '1px solid rgba(34,197,94,0.2)',
                        }}>
                            <Typography sx={{ fontSize: '0.62rem', color: '#22c55e', fontWeight: 700, letterSpacing: '0.1em' }}>
                                NSE LIVE
                            </Typography>
                        </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.85rem', color: '#5a5a6e' }}>
                        Sector performance, DMA trends and smart money flow across NSE indices.
                    </Typography>
                </Box>

                {/* ── Period selector + subtitle ── */}
                <Box
                    className="animate-fade-in-up delay-1"
                    sx={{
                        display:        'flex',
                        alignItems:     { xs: 'flex-start', sm: 'center' },
                        flexDirection:  { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        gap:            1.5,
                        mb:             3.5,
                    }}
                >
                    <Typography sx={{ fontSize: '0.72rem', color: '#5a5a6e', letterSpacing: '0.06em' }}>
                        Returns for selected period · click any tile or row to view chart
                    </Typography>
                    <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
                </Box>

                {/* ── Heatmap ── */}
                <Box className="animate-fade-in-up delay-2" sx={{ mb: 4 }}>
                    <SectorHeatmap
                        benchmarks={benchmarks}
                        sectors={sectors}
                        selectedPeriod={selectedPeriod}
                        selectedSymbol={selectedSymbol}
                        onSelect={handleSelect}
                    />
                </Box>

                {/* ── Divider ── */}
                <Box sx={{
                    height:     '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                    mb:         3.5,
                }} />

                {/* ── Table ── */}
                <Box className="animate-fade-in-up delay-3" sx={{ mb: 2 }}>
                    <Typography sx={{
                        fontSize:      '0.62rem',
                        fontWeight:    600,
                        letterSpacing: '0.12em',
                        color:         '#5a5a6e',
                        textTransform: 'uppercase',
                        mb:            1.25,
                    }}>
                        All Indices
                    </Typography>
                    <SectorTable
                        benchmarks={benchmarks}
                        sectors={sectors}
                        selectedPeriod={selectedPeriod}
                        selectedSymbol={selectedSymbol}
                        onSelect={handleSelect}
                    />
                </Box>

                {/* ── Inline detail panel (stocks + chart tabs) ── */}
                <Box id="markets-chart-panel">
                    <SectorDetailPanel
                        sectorSummary={selectedMeta}
                        detailData={detailData}
                        detailLoading={detailLoading}
                        detailError={detailError}
                        selectedPeriod={selectedPeriod}
                        onClose={() => setSelectedSymbol(null)}
                    />
                </Box>

            </Container>
        </PageLayout>
    );
}
