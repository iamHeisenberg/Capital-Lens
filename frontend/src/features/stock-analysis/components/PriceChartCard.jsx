import { useState, useMemo, useEffect } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import {
    ComposedChart, Area, Line, Bar, BarChart,
    XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, ReferenceArea,
    ResponsiveContainer,
} from 'recharts';
import PeriodSelector, { PERIODS } from './PeriodSelector';

// ── Constants ──────────────────────────────────────────────────────────────────

const DMA_COLORS  = { dma50: '#22c55e', dma200: '#f59e0b' };
const PRICE_COLOR = '#e8e8ed';

const TREND_COLORS = {
    Uptrend:           '#22c55e',
    Downtrend:         '#ef4444',
    Sideways:          '#f59e0b',
    'Insufficient Data': '#5a5a6e',
};

// ── Pure helpers ───────────────────────────────────────────────────────────────

function formatPrice(v) {
    if (!v && v !== 0) return '—';
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}k`;
    return `₹${v.toFixed(0)}`;
}

/** Compute period return %. Returns null if invalid. */
function computeReturn(prices) {
    if (!prices?.length) return null;
    const first = prices.find((p) => p != null && isFinite(p) && p > 0);
    const last  = [...prices].reverse().find((p) => p != null && isFinite(p));
    if (!first || !last) return null;
    const pct = ((last - first) / first) * 100;
    return isFinite(pct) ? pct : null;
}

/**
 * Client-side fallback: O(N) sliding-window rolling MA.
 * Used when the backend doesn't return pre-computed DMA series
 * (e.g. old cached response missing dma50Series / dma200Series).
 */
function computeRollingMA(prices, period) {
    const result = new Array(prices.length).fill(null);
    let sum = 0;
    for (let i = 0; i < prices.length; i++) {
        const val = prices[i];
        if (val == null || !isFinite(val)) { sum = 0; continue; }
        sum += val;
        if (i >= period) sum -= (prices[i - period] ?? 0);
        if (i >= period - 1) result[i] = sum / period;
    }
    return result;
}

/** Generate smart narrative from available signals. */
function generateInsight({ ticker, returnPct, latestClose, dma50, dma200, periodLabel }) {
    const name = (ticker || '').replace('.NS', '');
    if (!name) return null;

    // Not enough data for analysis
    if (latestClose == null || dma50 == null || dma200 == null) {
        return 'Insufficient data for trend analysis.';
    }
    if (returnPct == null || !isFinite(returnPct)) {
        return `${name}: insufficient price history for return analysis.`;
    }

    const absPct  = Math.abs(returnPct).toFixed(1);
    const isUp    = returnPct >= 0;
    const aboveDma50  = latestClose > dma50;
    const aboveDma200 = latestClose > dma200;

    let momentum;
    if (isUp  &&  aboveDma50 &&  aboveDma200) momentum = 'bullish — rising and above both MAs';
    else if (isUp  &&  aboveDma50 && !aboveDma200) momentum = 'mixed — recovering but still under the 200 DMA';
    else if (isUp  && !aboveDma50)                  momentum = 'cautious recovery — price rising but below the 50 DMA';
    else if (!isUp && !aboveDma50 && !aboveDma200)  momentum = 'bearish — falling below both MAs';
    else if (!isUp &&  aboveDma50)                  momentum = 'mixed — price declining but holding above the 50 DMA';
    else                                             momentum = isUp ? 'positive' : 'negative';

    return `${name} is ${isUp ? '▲ up' : '▼ down'} ${absPct}% over the ${periodLabel}. Momentum is ${momentum}.`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EmptyState({ message = 'No price data available' }) {
    return (
        <Grid item xs={12}>
            <Box className="glass-card" sx={{ p: { xs: 3, md: 5 }, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <Typography sx={{ color: '#5a5a6e', fontSize: '0.85rem' }}>{message}</Typography>
            </Box>
        </Grid>
    );
}

function ReturnBadge({ returnPct }) {
    if (returnPct == null || !isFinite(returnPct)) {
        return <Typography sx={{ fontSize: '0.82rem', color: '#5a5a6e' }}>—</Typography>;
    }
    const isUp = returnPct >= 0;
    return (
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: isUp ? '#22c55e' : '#ef4444' }}>
            {isUp ? '▲' : '▼'} {Math.abs(returnPct).toFixed(1)}%
        </Typography>
    );
}

function NarrativeInsight({ text }) {
    if (!text) return null;
    return (
        <Box sx={{ mb: 3, px: 3, py: 1.5, borderLeft: '2px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', borderRadius: '0 6px 6px 0' }}>
            <Typography sx={{ fontSize: '0.78rem', color: '#8a8a9e', lineHeight: 1.6 }}>{text}</Typography>
        </Box>
    );
}


function ChartTooltip({ active, payload, chartDates }) {
    if (!active || !payload?.length) return null;
    const idx     = payload[0]?.payload?.index;
    const dateStr = (chartDates && idx != null) ? chartDates[idx] : null;
    const formattedDate = dateStr
        ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : null;

    const labels = { price: 'Price', dma50: '50 DMA', dma200: '200 DMA' };
    const colors = { price: PRICE_COLOR, dma50: DMA_COLORS.dma50, dma200: DMA_COLORS.dma200 };

    return (
        <Box sx={{ background: 'rgba(10,10,18,0.96)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', p: '10px 14px', backdropFilter: 'blur(8px)', minWidth: 145 }}>
            {formattedDate && (
                <Typography sx={{ fontSize: '0.68rem', color: '#5a5a6e', mb: 0.75 }}>{formattedDate}</Typography>
            )}
            {payload
                .filter((e) => e.value != null && typeof e.value === 'number')
                .map((entry) => (
                    <Typography key={entry.dataKey} sx={{ fontSize: '0.73rem', color: colors[entry.dataKey] || PRICE_COLOR, lineHeight: 1.9 }}>
                        {labels[entry.dataKey] ?? entry.dataKey}:{' '}
                        ₹{entry.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                ))
            }
        </Box>
    );
}

function ConditionalLegend({ hasDMA50, hasDMA200 }) {
    const items = [
        { label: 'Price',   color: PRICE_COLOR,        dash: false, show: true       },
        { label: '50 DMA',  color: DMA_COLORS.dma50,   dash: true,  show: hasDMA50   },
        { label: '200 DMA', color: DMA_COLORS.dma200,  dash: true,  show: hasDMA200  },
    ].filter((i) => i.show);

    return (
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {items.map(({ label, color, dash }) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{
                        width: 22, height: 2,
                        backgroundColor: dash ? 'transparent' : color,
                        backgroundImage: dash
                            ? `repeating-linear-gradient(to right, ${color} 0, ${color} 4px, transparent 4px, transparent 7px)`
                            : 'none',
                        borderRadius: 1,
                    }} />
                    <Typography sx={{ fontSize: '0.7rem', color: '#5a5a6e' }}>{label}</Typography>
                </Box>
            ))}
        </Box>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

function PriceChartCard({
    historicalCloses,
    historicalDates,
    historicalVolumes,
    dma50Series,
    dma200Series,
    trend,
    ticker,
    latestClose,
    dma50,
    dma200,
    hasVolume,
    rsiSeries,
}) {
    const [selectedPeriod, setSelectedPeriod]   = useState('1Y');
    const [volumeCollapsed, setVolumeCollapsed] = useState(false);
    const [rsiCollapsed, setRsiCollapsed]       = useState(true); // collapsed by default

    // Reset period when ticker changes
    useEffect(() => { setSelectedPeriod('1Y'); }, [ticker]);

    // ── STEP 3: Map (not filter!) to preserve index alignment ─────────────────
    // Using .filter() would shorten the array and break DMA alignment.
    // Using .map() replaces invalid values with null but keeps array length.
    const totalPoints = (historicalCloses || []).length;

    const allPrices = useMemo(() =>
        (historicalCloses || []).map((p) =>
            typeof p === 'number' && isFinite(p) ? p : null
        ), [historicalCloses]);

    // ── DMA arrays: use server data if available, fall back to client-side ─────
    // Root cause of missing DMA lines: when backend returns old cached data
    // (before the 2-year update), dma50Series / dma200Series are undefined.
    // Fallback computes them from historicalCloses so lines ALWAYS render.
    const allDma50 = useMemo(() => {
        if (dma50Series?.length) {
            return dma50Series.map((v) => (typeof v === 'number' && isFinite(v) ? v : null));
        }
        // Fallback: compute client-side from historicalCloses
        const closes = (historicalCloses || []).map((p) => (typeof p === 'number' && isFinite(p) ? p : null));
        return computeRollingMA(closes, 50);
    }, [dma50Series, historicalCloses]);

    const allDma200 = useMemo(() => {
        if (dma200Series?.length) {
            return dma200Series.map((v) => (typeof v === 'number' && isFinite(v) ? v : null));
        }
        // Fallback: compute client-side from historicalCloses
        const closes = (historicalCloses || []).map((p) => (typeof p === 'number' && isFinite(p) ? p : null));
        return computeRollingMA(closes, 200);
    }, [dma200Series, historicalCloses]);

    const allDates = historicalDates || [];

    // Count valid prices for empty-state check
    const validPriceCount = useMemo(() => allPrices.filter(Boolean).length, [allPrices]);
    if (!totalPoints || !validPriceCount) return <EmptyState />;

    // ── Slice: period selector drives both price AND volume charts ────────────
    const periodCfg  = PERIODS.find((p) => p.label === selectedPeriod) ?? PERIODS[PERIODS.length - 1];
    const displayCount = Math.min(periodCfg.points, totalPoints);
    const offset       = totalPoints - displayCount;

    const slicedPrices  = allPrices.slice(offset);
    const slicedDates   = allDates.slice(offset);
    const slicedDma50   = allDma50.slice(offset);
    const slicedDma200  = allDma200.slice(offset);

    // ── Volume slicing ─────────────────────────────────────────────────────────
    const allVolumes = useMemo(() =>
        hasVolume && Array.isArray(historicalVolumes)
            ? historicalVolumes.map((v) =>
                (v != null && isFinite(v) && v > 0) ? v : null
            )
            : [],
    [hasVolume, historicalVolumes]);

    const slicedVolumes = allVolumes.length ? allVolumes.slice(offset) : [];

    // ── DMA visibility ─────────────────────────────────────────────────────────
    const hasDMA50  = slicedDma50.some((v)  => v !== null);
    const hasDMA200 = slicedDma200.some((v) => v !== null);

    // ── Chart data ─────────────────────────────────────────────────────────────
    const chartData = useMemo(() => slicedPrices.map((price, i) => ({
        index: i,
        price:  price            != null ? +price.toFixed(2)            : null,
        dma50:  slicedDma50[i]  != null ? +slicedDma50[i].toFixed(2)  : null,
        dma200: slicedDma200[i] != null ? +slicedDma200[i].toFixed(2) : null,
    })), [slicedPrices, slicedDma50, slicedDma200]);

    // ── Volume chart data ──────────────────────────────────────────────────────
    // Bar color: green on up-day, red on down-day, gray when no comparison
    const volumeChartData = useMemo(() => {
        if (!slicedVolumes.length) return [];
        return slicedVolumes.map((vol, i) => {
            const curr = slicedPrices[i];
            const prev = i > 0 ? slicedPrices[i - 1] : null;
            let direction = 'neutral';
            if (curr != null && prev != null) {
                if (curr > prev) direction = 'up';
                else if (curr < prev) direction = 'down';
            }
            return { index: i, volume: vol, direction };
        });
    }, [slicedVolumes, slicedPrices]);

    // Average volume reference line
    const avgVolume = useMemo(() => {
        const valid = slicedVolumes.filter((v) => v != null && isFinite(v));
        return valid.length ? valid.reduce((s, v) => s + v, 0) / valid.length : null;
    }, [slicedVolumes]);

    // Volume Y-axis formatter
    const formatVolume = (v) => {
        if (!v && v !== 0) return '';
        if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
        if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
        if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
        return v;
    };

    const showVolumePanel = hasVolume && volumeChartData.length > 0;

    // ── RSI slicing ───────────────────────────────────────────────────────────
    // Slice identically to price so x-axis stays aligned
    const allRSI = useMemo(() =>
        Array.isArray(rsiSeries)
            ? rsiSeries.map((v) => (v != null && isFinite(v) ? +v.toFixed(2) : null))
            : [],
    [rsiSeries]);

    const slicedRSI = allRSI.length ? allRSI.slice(offset) : [];

    const rsiChartData = useMemo(() =>
        slicedRSI.map((rsi, i) => ({ index: i, rsi })),
    [slicedRSI]);

    const hasRSI = slicedRSI.some((v) => v !== null);
    const showRSIPanel = hasRSI && rsiChartData.length > 0;

    // ── Y-axis domain (include DMA lines in range) ─────────────────────────────
    const allSeriesValues = [
        ...slicedPrices,
        hasDMA50  ? slicedDma50  : [],
        hasDMA200 ? slicedDma200 : [],
    ].flat().filter((v) => v != null && isFinite(v));
    const yMin = allSeriesValues.length ? Math.min(...allSeriesValues) * 0.97 : 0;
    const yMax = allSeriesValues.length ? Math.max(...allSeriesValues) * 1.03 : 1;

    // ── Period return ──────────────────────────────────────────────────────────
    const periodReturn = useMemo(() => computeReturn(slicedPrices), [slicedPrices]);

    // ── High / Low reference lines ─────────────────────────────────────────────
    const validSliced = slicedPrices.filter(Boolean);
    const visibleMax  = validSliced.length ? Math.max(...validSliced) : null;
    const visibleMin  = validSliced.length ? Math.min(...validSliced) : null;
    const showBothRef = visibleMax != null && visibleMin != null && visibleMax !== visibleMin;

    // ── Gradient color based on period return ──────────────────────────────────
    const gradientColor =
        periodReturn == null ? '#f59e0b' :
        periodReturn >= 0   ? '#22c55e' : '#ef4444';
    const gradientId = `pg_${(ticker || 'c').replace(/[^a-z0-9]/gi, '')}`;

    // ── X-axis: show month-start ticks ────────────────────────────────────────
    const xTicks = useMemo(() => {
        if (!slicedDates?.length) return [];
        const ticks = [];
        let lastMonth = -1;
        slicedDates.forEach((d, i) => {
            if (!d) return;
            const m = new Date(d).getMonth();
            if (m !== lastMonth) { ticks.push(i); lastMonth = m; }
        });
        return ticks;
    }, [slicedDates]);


    // ── Narrative insight (Step 8 / Step 9) ───────────────────────────────────
    const periodLabel = {
        '1M': 'last month', '3M': 'last 3 months',
        '6M': 'last 6 months', '1Y': 'last year', '2Y': 'last 2 years',
    }[selectedPeriod] ?? selectedPeriod;
    const insight = useMemo(
        () => generateInsight({ ticker, returnPct: periodReturn, latestClose, dma50, dma200, periodLabel }),
        [ticker, periodReturn, latestClose, dma50, dma200, periodLabel]
    );

    const trendColor = TREND_COLORS[trend] || '#5a5a6e';
    // Show warning only when we genuinely have fewer days than requested
    const isPartialData = totalPoints < periodCfg.points;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Grid item xs={12}>
            {/* Full-width breakout: negative margins escape Container's px=4 padding */}
            <Box
                className="glass-card animate-fade-in-up delay-2"
                sx={{
                    p: { xs: 3, md: 5 },
                    mx: { xs: -2, md: -4 },
                    borderRadius: 0,
                }}
            >

                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    <Box>
                        <Typography variant="h6" sx={{ mb: 0.5 }}>200-DAY PRICE HISTORY</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: trendColor, boxShadow: `0 0 6px ${trendColor}` }} />
                                <Typography sx={{ fontSize: '0.75rem', color: trendColor, fontWeight: 500 }}>
                                    {trend || 'Calculating…'}
                                </Typography>
                            </Box>
                            <ReturnBadge returnPct={periodReturn} />
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>
                        <PeriodSelector
                            selected={selectedPeriod}
                            onChange={setSelectedPeriod}
                            totalPoints={totalPoints}
                        />
                        <ConditionalLegend hasDMA50={hasDMA50} hasDMA200={hasDMA200} />
                    </Box>
                </Box>

                {/* Narrative insight */}
                <NarrativeInsight text={insight} />


                {/* Partial data warning */}
                {isPartialData && (
                    <Typography sx={{ fontSize: '0.72rem', color: '#f59e0b', mb: 2 }}>
                        ⚠ Limited data ({validPriceCount} days) — some indicators may be incomplete
                    </Typography>
                )}

                {/* Chart */}
                <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor={gradientColor} stopOpacity={0.18} />
                                <stop offset="95%" stopColor={gradientColor} stopOpacity={0}    />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

                        <XAxis
                            dataKey="index"
                            ticks={xTicks}
                            tickFormatter={(i) => {
                                const d = slicedDates?.[i];
                                return d ? new Date(d).toLocaleDateString('en-US', { month: 'short' }) : '';
                            }}
                            tick={{ fill: '#5a5a6e', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            hide={!slicedDates?.length}
                        />
                        <YAxis
                            domain={[yMin, yMax]}
                            tickFormatter={formatPrice}
                            tick={{ fill: '#5a5a6e', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={60}
                        />

                        <Tooltip
                            content={<ChartTooltip chartDates={slicedDates} />}
                            cursor={{ stroke: 'rgba(255,255,255,0.06)' }}
                        />

                        {/* High / Low reference lines */}
                        {visibleMax != null && (
                            <ReferenceLine y={visibleMax} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3"
                                label={{ value: `H ${formatPrice(visibleMax)}`, position: 'insideTopRight', fill: '#5a5a6e', fontSize: 9 }} />
                        )}
                        {showBothRef && (
                            <ReferenceLine y={visibleMin} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3"
                                label={{ value: `L ${formatPrice(visibleMin)}`, position: 'insideBottomRight', fill: '#5a5a6e', fontSize: 9 }} />
                        )}

                        {/* Price area with gradient */}
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke={PRICE_COLOR}
                            strokeWidth={1.5}
                            fill={`url(#${gradientId})`}
                            dot={false}
                            connectNulls
                            activeDot={{ r: 3, fill: PRICE_COLOR, strokeWidth: 0 }}
                        />

                        {/* DMA lines — only rendered when data actually exists (Steps 4 & 6) */}
                        {hasDMA50 && (
                            <Line type="monotone" dataKey="dma50"  stroke={DMA_COLORS.dma50}  dot={false} strokeWidth={1.5} strokeDasharray="5 3" connectNulls />
                        )}
                        {hasDMA200 && (
                            <Line type="monotone" dataKey="dma200" stroke={DMA_COLORS.dma200} dot={false} strokeWidth={1.5} strokeDasharray="5 3" connectNulls />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>

                <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#5a5a6e' }}>
                    {displayCount} trading days shown · {totalPoints} days of history · DMAs computed on full 2-year dataset · Source: Yahoo Finance
                </Typography>

                {/* ── Volume Panel ──────────────────────────────────────────── */}
                {showVolumePanel && (
                    <Box sx={{ mt: 3 }}>
                        {/* Volume panel header with collapse toggle */}
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: volumeCollapsed ? 0 : 1.5,
                                cursor: 'pointer',
                                userSelect: 'none',
                            }}
                            onClick={() => setVolumeCollapsed((c) => !c)}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                    sx={{
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        color: '#3a3a4e',
                                        letterSpacing: '0.12em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    VOLUME
                                </Typography>
                                {avgVolume != null && (
                                    <Typography sx={{ fontSize: '0.65rem', color: '#5a5a6e' }}>
                                        · avg {formatVolume(avgVolume)}/day
                                    </Typography>
                                )}
                            </Box>
                            <Typography sx={{ fontSize: '0.65rem', color: '#5a5a6e' }}>
                                {volumeCollapsed ? '▶ Show' : '▼ Hide'}
                            </Typography>
                        </Box>

                        {!volumeCollapsed && (
                            <ResponsiveContainer width="100%" height={80}>
                                <BarChart
                                    data={volumeChartData}
                                    margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                                    barCategoryGap="10%"
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="rgba(255,255,255,0.03)"
                                        vertical={false}
                                    />
                                    <XAxis dataKey="index" hide />
                                    <YAxis
                                        tickFormatter={formatVolume}
                                        tick={{ fill: '#5a5a6e', fontSize: 9 }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={38}
                                        tickCount={3}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                        content={({ active, payload }) => {
                                            if (!active || !payload?.length) return null;
                                            const d = payload[0]?.payload;
                                            const dateStr = slicedDates?.[d?.index];
                                            const formatted = dateStr
                                                ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                                : null;
                                            return (
                                                <Box sx={{ background: 'rgba(10,10,18,0.96)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', p: '6px 10px' }}>
                                                    {formatted && <Typography sx={{ fontSize: '0.65rem', color: '#5a5a6e', mb: 0.25 }}>{formatted}</Typography>}
                                                    <Typography sx={{ fontSize: '0.72rem', color: '#e8e8ed' }}>
                                                        {formatVolume(d?.volume ?? 0)} shares
                                                    </Typography>
                                                </Box>
                                            );
                                        }}
                                    />
                                    {avgVolume != null && (
                                        <ReferenceLine
                                            y={avgVolume}
                                            stroke="rgba(245,158,11,0.4)"
                                            strokeDasharray="4 3"
                                            label={{ value: 'avg', position: 'insideTopRight', fill: '#5a5a6e', fontSize: 8 }}
                                        />
                                    )}
                                    {/* Render two Bar series: up-days and down-days */}
                                    <Bar
                                        dataKey="volume"
                                        radius={[1, 1, 0, 0]}
                                        maxBarSize={8}
                                        fill="#22c55e"
                                        // Override fill per bar based on direction
                                        // Recharts doesn't support per-bar fill on a single Bar without a Cell trick
                                        // We use a custom shape instead:
                                        shape={(props) => {
                                            const { x, y, width, height, payload } = props;
                                            const color =
                                                payload.direction === 'up'   ? '#22c55e' :
                                                payload.direction === 'down' ? '#ef4444' :
                                                                               '#5a5a6e';
                                            return (
                                                <rect
                                                    x={x}
                                                    y={y}
                                                    width={Math.max(width, 1)}
                                                    height={Math.max(height, 1)}
                                                    fill={color}
                                                    opacity={0.7}
                                                    rx={1}
                                                />
                                            );
                                        }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </Box>
                )}
                {/* ── RSI Panel ────────────────────────────────────────────────── */}
                {showRSIPanel && (
                    <Box sx={{ mt: 3 }}>
                        <Box
                            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: rsiCollapsed ? 0 : 1.5, cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => setRsiCollapsed((c) => !c)}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#3a3a4e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>RSI (14)</Typography>
                                <Typography sx={{ fontSize: '0.62rem', color: '#22c55e' }}>30 oversold</Typography>
                                <Typography sx={{ fontSize: '0.62rem', color: '#5a5a6e' }}>·</Typography>
                                <Typography sx={{ fontSize: '0.62rem', color: '#ef4444' }}>70 overbought</Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.65rem', color: '#5a5a6e' }}>{rsiCollapsed ? '▶ Show' : '▼ Hide'}</Typography>
                        </Box>
                        {!rsiCollapsed && (
                            <ResponsiveContainer width="100%" height={110}>
                                <ComposedChart data={rsiChartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                                    <ReferenceArea y1={0}  y2={30}  fill="rgba(34,197,94,0.06)"  fillOpacity={1} />
                                    <ReferenceArea y1={30} y2={70}  fill="rgba(255,255,255,0.01)" fillOpacity={1} />
                                    <ReferenceArea y1={70} y2={100} fill="rgba(239,68,68,0.06)"  fillOpacity={1} />
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis dataKey="index" hide />
                                    <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={{ fill: '#5a5a6e', fontSize: 9 }} axisLine={false} tickLine={false} width={28} />
                                    <Tooltip
                                        cursor={{ stroke: 'rgba(255,255,255,0.06)' }}
                                        content={({ active, payload }) => {
                                            if (!active || !payload?.length) return null;
                                            const d = payload[0]?.payload;
                                            const dateStr = slicedDates?.[d?.index];
                                            const formatted = dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null;
                                            const rsiVal = d?.rsi;
                                            const rsiColor = rsiVal == null ? '#5a5a6e' : rsiVal < 30 ? '#22c55e' : rsiVal < 60 ? '#f59e0b' : rsiVal < 70 ? '#f97316' : '#ef4444';
                                            return (
                                                <Box sx={{ background: 'rgba(10,10,18,0.96)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', p: '6px 10px' }}>
                                                    {formatted && <Typography sx={{ fontSize: '0.65rem', color: '#5a5a6e', mb: 0.25 }}>{formatted}</Typography>}
                                                    <Typography sx={{ fontSize: '0.72rem', color: rsiColor, fontFamily: 'monospace' }}>RSI {rsiVal?.toFixed(1) ?? '—'}</Typography>
                                                </Box>
                                            );
                                        }}
                                    />
                                    <ReferenceLine y={70} stroke="rgba(239,68,68,0.4)"    strokeDasharray="4 3" />
                                    <ReferenceLine y={30} stroke="rgba(34,197,94,0.4)"    strokeDasharray="4 3" />
                                    <ReferenceLine y={50} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 6" />
                                    <Line type="monotone" dataKey="rsi" stroke="#a78bfa" strokeWidth={1.5} dot={false} connectNulls={false} activeDot={{ r: 3, fill: '#a78bfa', strokeWidth: 0 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </Box>
                )}
            </Box>
        </Grid>
    );
}

export default PriceChartCard;
