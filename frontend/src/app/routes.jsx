import StockAnalysisPage from '../features/stock-analysis/StockAnalysisPage';
import MethodologyPage from '../features/methodology/MethodologyPage';
import HomePage from '../features/home/HomePage';
import FundamentalsPage from '../features/fundamentals/FundamentalsPage';

const routes = [
    {
        path: '/',
        element: <HomePage />,
    },
    {
        path: '/analysis',
        element: <StockAnalysisPage />,
    },
    {
        path: '/fundamentals',
        element: <FundamentalsPage />,
    },
    {
        path: '/methodology',
        element: <MethodologyPage />,
    },
];

export default routes;

