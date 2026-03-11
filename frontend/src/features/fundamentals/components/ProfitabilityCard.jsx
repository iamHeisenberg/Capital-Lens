import { Box, Typography } from '@mui/material';
import MetricBlock from './MetricBlock';
import { getEbitdaMarginColor, getOpmColor, getNpmColor } from '../utils/getMetricColor';

/**
 * Profitability metrics card — EBITDA Margin, OPM, NPM.
 */
function ProfitabilityCard({ profitability }) {
    const { ebitdaMargin, opm, npm } = profitability || {};

    return (
        <Box
            className="glass-card animate-fade-in-up delay-3"
            sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}
        >
            <Typography variant="h6" sx={{ mb: 2 }}>
                PROFITABILITY
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <MetricBlock label="EBITDA Margin" value={ebitdaMargin} suffix="%" color={getEbitdaMarginColor(ebitdaMargin)} />
                <MetricBlock label="Operating Margin" value={opm} suffix="%" color={getOpmColor(opm)} />
                <MetricBlock label="Net Margin" value={npm} suffix="%" color={getNpmColor(npm)} />
            </Box>
        </Box>
    );
}

export default ProfitabilityCard;
