import { Box, Typography, Grid } from '@mui/material';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Compute rolling SMA — returns null for indices with insufficient history */
function computeRollingMA(closes, period) {
    return closes.map((_, i) => {
        if (i < period - 1) return null;
        const slice = closes.slice(i - period + 1, i + 1);
        return slice.reduce((sum, v) => sum + v, 0) / period;
    });
}

/** Smart Y-axis tick — handles ₹1 to ₹150,000+ */
function formatPrice(v) {
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
    return `₹${v.toFixed(0)}`;
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ message }) {
    return (
        <Grid item xs={12}>
            <Box
                className="glass-card"
                sx={{
                    p: { xs: 3, md: 5 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 200,
                }}
            >
                <Typography sx={{ color: '#5a5a6e', fontSize: '0.85rem' }}>
                    {message}
                </Typography>
            </Box>
        </Grid>
    );
}

// ── Tooltip ────────────────────────────────────────────────────────────────────

const LABELS = { price: 'Price', dma50: '50 DMA', dma200: '200 DMA' };
const COLORS = { price: '#e8e8ed', dma50: '#22c55e', dma200: '#f59e0b' };

function ChartTooltip({ active, payload }) {
    // Step 6 — guard against null/empty payload
    if (!active || !payload || !payload.length) return null;

    return (
        <Box
            sx={{
                background: 'rgba(10,10,18,0.96)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                p: '10px 14px',
                backdropFilter: 'blur(8px)',
            }}
        >
            {payload
                .filter((e) => e.value != null && typeof e.value === 'number')
                .map((entry) => (
                    <Typography
                        key={entry.dataKey}
                        sx={{ fontSize: '0.73rem', color: COLORS[entry.dataKey] || '#e8e8ed', lineHeight: 1.8 }}
                    >
                        {LABELS[entry.dataKey] ?? entry.dataKey}:{' '}
                        ₹{entry.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                ))}
        </Box>
    );
}

// ── Legend ─────────────────────────────────────────────────────────────────────

const LEGEND = [
    { label: 'Price',   color: '#e8e8ed', dash: false },
    { label: '50 DMA',  color: '#22c55e', dash: true  },
    { label: '200 DMA', color: '#f59e0b', dash: true  },
];

function ChartLegend() {
    return (
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {LEGEND.map(({ label, color, dash }) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box
                        sx={{
                            width: 22,
                            height: 2,
                            backgroundColor: dash ? 'transparent' : color,
                            backgroundImage: dash
                                ? `repeating-linear-gradient(to right, ${color} 0, ${color} 4px, transparent 4px, transparent 7px)`
                                : 'none',
                            borderRadius: 1,
                        }}
                    />
                    <Typography sx={{ fontSize: '0.7rem', color: '#5a5a6e' }}>{label}</Typography>
                </Box>
            ))}
        </Box>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * PriceChartCard — production-resilient 200-day price chart.
 *
 * Props:
 *   historicalCloses {number[]} — up to 200 daily closing prices, oldest first
 *   trend            {string}   — 'Uptrend' | 'Downtrend' | other
 */
function PriceChartCard({ historicalCloses, trend }) {
    // ── Step 1: Sanitize input ─────────────────────────────────────────────────
    const safePrices = (historicalCloses || []).filter(
        (p) => typeof p === 'number' && isFinite(p)
    );

    if (process.env.NODE_ENV !== 'production') {
        const originalLen = historicalCloses?.length ?? 0;
        if (originalLen !== safePrices.length) {
            console.warn('[PriceChartCard] Data sanitized', {
                originalLength: originalLen,
                validLength: safePrices.length,
                filtered: originalLen - safePrices.length,
            });
        }
    }

    // ── Empty state ────────────────────────────────────────────────────────────
    if (!safePrices.length) {
        return <EmptyState message="No price data available" />;
    }

    // ── Step 3: Compute DMAs safely ────────────────────────────────────────────
    const dma50Series  = computeRollingMA(safePrices, 50);
    const dma200Series = computeRollingMA(safePrices, 200);

    const hasDMA50  = dma50Series.some((v) => typeof v === 'number');
    const hasDMA200 = dma200Series.some((v) => typeof v === 'number');

    // ── Step 5: Build chart data with safe null fallbacks ─────────────────────
    const chartData = safePrices.map((price, index) => ({
        index,
        price:  +price.toFixed(2),
        dma50:  dma50Series?.[index]  != null ? +dma50Series[index].toFixed(2)  : null,
        dma200: dma200Series?.[index] != null ? +dma200Series[index].toFixed(2) : null,
    }));

    const minVal = Math.min(...safePrices) * 0.97;
    const maxVal = Math.max(...safePrices) * 1.03;

    const isPartialData = safePrices.length < 200;

    const trendColor =
        trend === 'Uptrend'   ? '#22c55e' :
        trend === 'Downtrend' ? '#ef4444' : '#f59e0b';

    return (
        <Grid item xs={12}>
            <Box className="glass-card animate-fade-in-up delay-2" sx={{ p: { xs: 3, md: 5 } }}>

                {/* Header */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2,
                        mb: 4,
                    }}
                >
                    <Box>
                        <Typography variant="h6">200-DAY PRICE HISTORY</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Box
                                sx={{
                                    width: 8, height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: trendColor,
                                    boxShadow: `0 0 6px ${trendColor}`,
                                }}
                            />
                            <Typography sx={{ fontSize: '0.75rem', color: trendColor, fontWeight: 500 }}>
                                {trend || 'Calculating…'}
                            </Typography>
                        </Box>
                    </Box>
                    <ChartLegend />
                </Box>

                {/* Step 7: Partial data notice */}
                {isPartialData && (
                    <Typography
                        sx={{
                            fontSize: '0.72rem',
                            color: '#f59e0b',
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                        }}
                    >
                        ⚠ Limited data available ({safePrices.length} days) — DMA lines may not render fully
                    </Typography>
                )}

                {/* Chart */}
                <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.04)"
                            vertical={false}
                        />
                        <XAxis dataKey="index" hide />
                        <YAxis
                            domain={[minVal, maxVal]}
                            tickFormatter={formatPrice}
                            tick={{ fill: '#5a5a6e', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={58}
                        />
                        <Tooltip
                            content={<ChartTooltip />}
                            cursor={{ stroke: 'rgba(255,255,255,0.08)' }}
                        />

                        {/* Price — always rendered (safePrices is validated above) */}
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#e8e8ed"
                            dot={false}
                            strokeWidth={1.5}
                            connectNulls
                        />

                        {/* Step 4: Conditional DMA lines */}
                        {hasDMA50 && (
                            <Line
                                type="monotone"
                                dataKey="dma50"
                                stroke="#22c55e"
                                dot={false}
                                strokeWidth={1.5}
                                strokeDasharray="5 3"
                                connectNulls
                            />
                        )}
                        {hasDMA200 && (
                            <Line
                                type="monotone"
                                dataKey="dma200"
                                stroke="#f59e0b"
                                dot={false}
                                strokeWidth={1.5}
                                strokeDasharray="5 3"
                                connectNulls
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>

                <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#5a5a6e' }}>
                    {safePrices.length} trading days · Daily close prices · DMAs computed from historical data · Source: Yahoo Finance
                </Typography>
            </Box>
        </Grid>
    );
}

export default PriceChartCard;
