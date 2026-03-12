import { Box, Typography } from '@mui/material';
import MetricBlock from './MetricBlock';
import { getPeColor, getPegColor, getEvEbitdaColor, getMarketCapToSalesColor } from '../utils/getMetricColor';

/**
 * Valuation metrics card — PE, PEG (1Y), PEG (3Y), EV / EBITDA, Market Cap / Sales.
 * Stacked vertically for the 5-column layout.
 */
function ValuationCard({ valuation }) {
    const { pe, peg, peg3y, marketCapToSales, evToEbitda } = valuation || {};

    return (
        <Box
            className="glass-card animate-fade-in-up delay-2"
            sx={{ p: { xs: 2.5, md: 2.5 }, height: '100%' }}
        >
            <Typography variant="h6" sx={{ mb: 2 }}>
                VALUATION
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <MetricBlock label="PE Ratio" value={pe} suffix="x" color={getPeColor(pe)} />
                <MetricBlock label="PEG (1Y EPS)" value={peg} format="ratio" color={getPegColor(peg)} />
                <MetricBlock label="PEG (3Y Profit)" value={peg3y} format="ratio" color={getPegColor(peg3y)} />
                <MetricBlock label="EV / EBITDA" value={evToEbitda} suffix="x" color={getEvEbitdaColor(evToEbitda)} />
                <MetricBlock label="Mkt Cap / Sales" value={marketCapToSales} suffix="x" color={getMarketCapToSalesColor(marketCapToSales)} />
            </Box>
        </Box>
    );
}

export default ValuationCard;
