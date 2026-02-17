import StockAnalysisPage from '../features/stock-analysis/StockAnalysisPage';
import MethodologyPage from '../features/methodology/MethodologyPage';
import HomePage from '../features/home/HomePage';

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
        path: '/methodology',
        element: <MethodologyPage />,
    },
];

export default routes;
