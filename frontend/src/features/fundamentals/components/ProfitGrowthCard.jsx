import { Box, Typography } from '@mui/material';
import MetricBlock from './MetricBlock';
import { getGrowthColor } from '../utils/getMetricColor';

/**
 * Profit Growth card — YoY, 3Y CAGR, 5Y CAGR.
 */
function ProfitGrowthCard({ profit }) {
    const { yoy, cagr3y, cagr5y } = profit || {};

    return (
        <Box
            className="glass-card animate-fade-in-up delay-3"
            sx={{ p: { xs: 2.5, md: 2.5 }, height: '100%' }}
        >
            <Typography variant="h6" sx={{ mb: 2 }}>
                PROFIT GROWTH
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <MetricBlock label="YoY" value={yoy} suffix="%" color={getGrowthColor(yoy)} />
                <MetricBlock label="3Y CAGR" value={cagr3y} suffix="%" color={getGrowthColor(cagr3y)} />
                <MetricBlock label="5Y CAGR" value={cagr5y} suffix="%" color={getGrowthColor(cagr5y)} />
            </Box>
        </Box>
    );
}

export default ProfitGrowthCard;
