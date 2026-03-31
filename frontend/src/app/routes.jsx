import { Navigate } from 'react-router-dom';
import StockAnalysisPage from '../features/stock-analysis/StockAnalysisPage';
import MethodologyPage from '../features/methodology/MethodologyPage';
import HomePage from '../features/home/HomePage';
import FundamentalsPage from '../features/fundamentals/FundamentalsPage';

const routes = [
    { path: '/', element: <HomePage /> },

    // Analysis — bare route shows default page, :ticker shows data
    { path: '/analysis', element: <StockAnalysisPage /> },
    { path: '/analysis/:ticker', element: <StockAnalysisPage /> },

    // Fundamentals — same pattern
    { path: '/fundamentals', element: <FundamentalsPage /> },
    { path: '/fundamentals/:ticker', element: <FundamentalsPage /> },

    { path: '/methodology', element: <MethodologyPage /> },

    // Catch-all: redirect unknown paths to home
    { path: '*', element: <Navigate to="/" replace /> },
];

export default routes;



