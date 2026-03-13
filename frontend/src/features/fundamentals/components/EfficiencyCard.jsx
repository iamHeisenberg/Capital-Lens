import { Box, Typography, Collapse, IconButton } from '@mui/material';
import { useState } from 'react';
import MetricBlock from './MetricBlock';
import { getRoeColor, getRoceColor, getCfoEbitdaColor } from '../utils/getMetricColor';
import ScoreBreakdown from './ScoreBreakdown';

/**
 * Capital Efficiency metrics card — ROE, ROCE, CFO/EBITDA.
 * Thresholds designed to identify long-term compounders.
 */
function EfficiencyCard({ capitalEfficiency, efficiencyMetrics }) {
    const [open, setOpen] = useState(false);
    const { roe, roce, cfoToEbitda } = capitalEfficiency || {};

    return (
        <Box
            className="glass-card animate-fade-in-up delay-4"
            sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    CAPITAL EFFICIENCY
                </Typography>
                {efficiencyMetrics && (
                    <IconButton
                        size="small"
                        onClick={() => setOpen((prev) => !prev)}
                        sx={{ color: '#9ca3af' }}
                        aria-label={open ? 'Hide efficiency breakdown' : 'Show efficiency breakdown'}
                    >
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>
                            {open ? '−' : '+'}
                        </Typography>
                    </IconButton>
                )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <MetricBlock label="Return on Equity" value={roe} suffix="%" color={getRoeColor(roe)} />
                <MetricBlock label="Return on Capital Employed" value={roce} suffix="%" color={getRoceColor(roce)} />
                <MetricBlock label="CFO / EBITDA" value={cfoToEbitda} format="ratio" color={getCfoEbitdaColor(cfoToEbitda)} />
            </Box>

            {efficiencyMetrics && (
                <Collapse in={open}>
                    <ScoreBreakdown metrics={efficiencyMetrics} />
                </Collapse>
            )}
        </Box>
    );
}

export default EfficiencyCard;
