import { Box, Typography } from '@mui/material';
import HeatmapTile from './HeatmapTile';

// ── Group label ────────────────────────────────────────────────────────────────

function GroupLabel({ label }) {
    return (
        <Typography sx={{
            fontSize:      '0.62rem',
            fontWeight:    600,
            letterSpacing: '0.12em',
            color:         '#5a5a6e',
            textTransform: 'uppercase',
            mb:            1,
        }}>
            {label}
        </Typography>
    );
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * SectorHeatmap
 *
 * Renders two groups:
 *   BENCHMARKS — fixed order (from sectors.json)
 *   SECTORS    — sorted by selectedPeriod return (best → worst)
 *
 * @param {object[]} benchmarks    Benchmark summaries
 * @param {object[]} sectors       Sector summaries
 * @param {string}   selectedPeriod  'r1m' | 'r3m' | 'r6m' | 'r1y' | 'r2y'
 * @param {string|null} selectedSymbol  Currently-open chart symbol (for active state)
 * @param {function} onSelect       Called with (symbol) when tile clicked; null to deselect
 */
export default function SectorHeatmap({
    benchmarks,
    sectors,
    selectedPeriod,
    selectedSymbol,
    onSelect,
}) {
    // Sort sectors by the selected period's return, descending (best first).
    // Benchmarks are always shown in their catalog order.
    const sortedSectors = [...sectors].sort((a, b) => {
        const ra = a.returns?.[selectedPeriod] ?? -Infinity;
        const rb = b.returns?.[selectedPeriod] ?? -Infinity;
        return rb - ra;
    });

    const handleTileClick = (symbol) => {
        // Toggle: clicking the active tile closes the panel
        onSelect(symbol === selectedSymbol ? null : symbol);
    };

    const tileGrid = {
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap:                 1,
    };

    return (
        <Box>
            {/* ── Benchmarks ── */}
            <Box sx={{ mb: 2.5 }}>
                <GroupLabel label="Benchmarks" />
                <Box sx={tileGrid}>
                    {benchmarks.map((s) => (
                        <HeatmapTile
                            key={s.symbol}
                            sector={s}
                            period={selectedPeriod}
                            isSelected={s.symbol === selectedSymbol}
                            onClick={() => handleTileClick(s.symbol)}
                        />
                    ))}
                </Box>
            </Box>

            {/* ── Sectors ── */}
            <Box>
                <GroupLabel label="Sectors" />
                <Box sx={tileGrid}>
                    {sortedSectors.map((s) => (
                        <HeatmapTile
                            key={s.symbol}
                            sector={s}
                            period={selectedPeriod}
                            isSelected={s.symbol === selectedSymbol}
                            onClick={() => handleTileClick(s.symbol)}
                        />
                    ))}
                </Box>
            </Box>
        </Box>
    );
}
