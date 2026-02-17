import StockAnalysisPage from '../features/stock-analysis/StockAnalysisPage';

const routes = [
    {
        path: '/',
        element: <StockAnalysisPage />,
    },
    // Future routes:
    // { path: '/market', element: <MarketOverviewPage /> },
    // { path: '/sector', element: <SectorAnalysisPage /> },
    // { path: '/portfolio', element: <PortfolioPage /> },
    // { path: '/ai', element: <AIPage /> },
    // { path: '/methodology', element: <MethodologyPage /> },
];

export default routes;
