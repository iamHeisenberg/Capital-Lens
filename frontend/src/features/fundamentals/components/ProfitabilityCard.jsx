import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import MetricBlock from './MetricBlock';
import ScoreBreakdown from './ScoreBreakdown';
import { getEbitdaMarginColor, getOpmColor, getNpmColor } from '../utils/getMetricColor';

/**
 * Profitability metrics card — EBITDA Margin, OPM, NPM.
 */
function ProfitabilityCard({ profitability, metricScores }) {
    const { ebitdaMargin, opm, npm } = profitability || {};
    const [showBreakdown, setShowBreakdown] = useState(false);

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
            {metricScores && (
                <Box sx={{ mt: 1.5 }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#9ca3af',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                        }}
                        onClick={() => setShowBreakdown((prev) => !prev)}
                    >
                        {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
                    </Typography>
                    {showBreakdown && <ScoreBreakdown metrics={metricScores} category="profitability" />}
                </Box>
            )}
        </Box>
    );
}

export default ProfitabilityCard;
