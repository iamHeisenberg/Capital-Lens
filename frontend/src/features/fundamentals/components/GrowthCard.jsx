import { Box, Typography, Divider } from '@mui/material';
import MetricBlock from './MetricBlock';
import { getSalesGrowthColor, getProfitGrowthColor } from '../utils/getMetricColor';

/**
 * Growth metrics card — Sales & Profit growth stacked vertically.
 * 5Y CAGR excluded due to Yahoo Finance API limitations.
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
                <MetricBlock label="YoY" value={sales.yoy} suffix="%" color={getSalesGrowthColor(sales.yoy)} />
                <MetricBlock label="3Y CAGR" value={sales.cagr3y} suffix="%" color={getSalesGrowthColor(sales.cagr3y)} />
            </Box>

            <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

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
                <MetricBlock label="YoY" value={profit.yoy} suffix="%" color={getProfitGrowthColor(profit.yoy)} />
                <MetricBlock label="3Y CAGR" value={profit.cagr3y} suffix="%" color={getProfitGrowthColor(profit.cagr3y)} />
            </Box>
        </Box>
    );
}

export default GrowthCard;
