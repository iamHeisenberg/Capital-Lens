import { Box, Typography } from '@mui/material';
import MetricBlock from './MetricBlock';
import { getSalesGrowthColor } from '../utils/getMetricColor';

/**
 * Sales Growth card — YoY, 3Y CAGR, 5Y CAGR.
 */
function SalesGrowthCard({ sales }) {
    const { yoy, cagr3y, cagr5y } = sales || {};

    return (
        <Box
            className="glass-card animate-fade-in-up delay-2"
            sx={{ p: { xs: 2.5, md: 2.5 }, height: '100%' }}
        >
            <Typography variant="h6" sx={{ mb: 2 }}>
                SALES GROWTH
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <MetricBlock label="YoY" value={yoy} suffix="%" color={getSalesGrowthColor(yoy)} />
                <MetricBlock label="3Y CAGR" value={cagr3y} suffix="%" color={getSalesGrowthColor(cagr3y)} />
                <MetricBlock label="5Y CAGR" value={cagr5y} suffix="%" color={getSalesGrowthColor(cagr5y)} />
            </Box>
        </Box>
    );
}

export default SalesGrowthCard;
