import { Box, Typography } from '@mui/material';

function formatValue(key, value) {
    if (value == null) return '—';

    if (['roe', 'roce', 'ebitdaMargin', 'opm', 'npm', 'sales3y', 'profit3y'].includes(key)) {
        return `${value.toFixed(2)}%`;
    }

    if (['cfoToEbitda', 'debtToEquity', 'peg1y', 'peg3y', 'peg'].includes(key)) {
        return value.toFixed(2);
    }

    if (['pe', 'evToEbitda', 'marketCapToSales'].includes(key)) {
        return value.toFixed(2);
    }

    return String(value);
}

const LABELS = {
    pe: 'PE',
    peg1y: 'PEG (1Y EPS)',
    peg3y: 'PEG (3Y Profit)',
    evToEbitda: 'EV / EBITDA',
    marketCapToSales: 'MCap / Sales',
    sales3y: 'Sales CAGR (3Y)',
    profit3y: 'Profit CAGR (3Y)',
    ebitdaMargin: 'EBITDA Margin',
    opm: 'OPM',
    npm: 'NPM',
    roe: 'ROE',
    roce: 'ROCE',
    cfoToEbitda: 'CFO / EBITDA',
    debtToEquity: 'Debt / Equity',
};

const ORDERS = {
    valuation: ['pe', 'peg1y', 'peg3y', 'evToEbitda', 'marketCapToSales'],
    growth: ['sales3y', 'profit3y'],
    profitability: ['ebitdaMargin', 'opm', 'npm'],
    capitalEfficiency: ['roe', 'roce', 'cfoToEbitda'],
    balanceSheet: ['debtToEquity'],
};

function ScoreBreakdown({ metrics, category }) {
    if (!metrics || !category) return null;

    const orderedKeys = ORDERS[category] || Object.keys(metrics);

    return (
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {orderedKeys.map((key) => {
                const metric = metrics[key];
                if (!metric) return null;

                const { value, score, max } = metric;

                return (
                    <Box
                        key={key}
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 0.75,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '0.75rem',
                                color: '#9ca3af',
                                minWidth: 80,
                            }}
                        >
                            {LABELS[key] || key}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '0.8rem',
                                color: '#e8e8ed',
                                flex: 1,
                                textAlign: 'center',
                            }}
                        >
                            {formatValue(key, value)}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '0.8rem',
                                color: '#e8e8ed',
                                minWidth: 64,
                                textAlign: 'right',
                                fontWeight: 600,
                            }}
                        >
                            {score} / {max}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
}

export default ScoreBreakdown;

