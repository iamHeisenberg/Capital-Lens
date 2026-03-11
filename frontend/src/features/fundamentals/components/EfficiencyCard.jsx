import { Box, Typography } from '@mui/material';
import MetricBlock from './MetricBlock';
import { getRoeColor, getRoceColor, getCfoEbitdaColor } from '../utils/getMetricColor';

/**
 * Capital Efficiency metrics card — ROE, ROCE, CFO/EBITDA.
 * Thresholds designed to identify long-term compounders.
 */
function EfficiencyCard({ capitalEfficiency }) {
    const { roe, roce, cfoToEbitda } = capitalEfficiency || {};

    return (
        <Box
            className="glass-card animate-fade-in-up delay-4"
            sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}
        >
            <Typography variant="h6" sx={{ mb: 2 }}>
                CAPITAL EFFICIENCY
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <MetricBlock label="Return on Equity" value={roe} suffix="%" color={getRoeColor(roe)} />
                <MetricBlock label="Return on Capital Employed" value={roce} suffix="%" color={getRoceColor(roce)} />
                <MetricBlock label="CFO / EBITDA" value={cfoToEbitda} format="ratio" color={getCfoEbitdaColor(cfoToEbitda)} />
            </Box>
        </Box>
    );
}

export default EfficiencyCard;
