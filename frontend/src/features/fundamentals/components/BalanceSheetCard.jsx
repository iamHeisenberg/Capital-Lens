import { Box, Typography } from '@mui/material';
import MetricBlock from './MetricBlock';
import { getDebtEquityColor } from '../utils/getMetricColor';

/**
 * Balance Sheet metrics card — Debt/Equity.
 */
function BalanceSheetCard({ balanceSheet }) {
    const { debtToEquity } = balanceSheet || {};

    return (
        <Box
            className="glass-card animate-fade-in-up delay-5"
            sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}
        >
            <Typography variant="h6" sx={{ mb: 2 }}>
                BALANCE SHEET
            </Typography>

            <MetricBlock label="Debt / Equity" value={debtToEquity} format="ratio" color={getDebtEquityColor(debtToEquity)} />
        </Box>
    );
}

export default BalanceSheetCard;
