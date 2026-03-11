import { Box, Typography } from '@mui/material';
import MetricBlock from './MetricBlock';
import { getGrowthColor } from '../utils/getMetricColor';

/**
 * Growth metrics card — Sales & Profit growth stacked vertically.
 * Thresholds benchmarked against India's nominal GDP (~10–12%).
 */
function GrowthCard({ growth }) {
    const sales = growth?.sales || {};
    const profit = growth?.profit || {};

    return (
        <Box
            className="glass-card animate-fade-in-up delay-2"
            sx={{ p: { xs: 2.5, md: 2.5 }, height: '100%' }}
        >
            <Typography
                sx={{
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    color: '#5a5a6e',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    mb: 2,
                }}
            >
                GROWTH
            </Typography>

            {/* Sales */}
            <Typography
                sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#e8e8ed',
                    mb: 1,
                }}
            >
                Sales
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                <MetricBlock label="YoY" value={sales.yoy} suffix="%" color={getGrowthColor(sales.yoy)} />
                <MetricBlock label="3Y CAGR" value={sales.cagr3y} suffix="%" color={getGrowthColor(sales.cagr3y)} />
                <MetricBlock label="5Y CAGR" value={sales.cagr5y} suffix="%" color={getGrowthColor(sales.cagr5y)} />
            </Box>

            {/* Profit */}
            <Typography
                sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#e8e8ed',
                    mb: 1,
                }}
            >
                Profit
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <MetricBlock label="YoY" value={profit.yoy} suffix="%" color={getGrowthColor(profit.yoy)} />
                <MetricBlock label="3Y CAGR" value={profit.cagr3y} suffix="%" color={getGrowthColor(profit.cagr3y)} />
                <MetricBlock label="5Y CAGR" value={profit.cagr5y} suffix="%" color={getGrowthColor(profit.cagr5y)} />
            </Box>
        </Box>
    );
}

export default GrowthCard;
