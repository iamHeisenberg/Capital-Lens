import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import MetricBlock from './MetricBlock';
import ScoreBreakdown from './ScoreBreakdown';
import { getDebtEquityColor } from '../utils/getMetricColor';

/**
 * Balance Sheet metrics card — Debt/Equity.
 */
function BalanceSheetCard({ balanceSheet, metricScores }) {
    const { debtToEquity } = balanceSheet || {};
    const [showBreakdown, setShowBreakdown] = useState(false);

    return (
        <Box
            className="glass-card animate-fade-in-up delay-5"
            sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}
        >
            <Typography variant="h6" sx={{ mb: 2 }}>
                BALANCE SHEET
            </Typography>

            <MetricBlock label="Debt / Equity" value={debtToEquity} format="ratio" color={getDebtEquityColor(debtToEquity)} />
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
                    {showBreakdown && <ScoreBreakdown metrics={metricScores} category="balanceSheet" />}
                </Box>
            )}
        </Box>
    );
}

export default BalanceSheetCard;
