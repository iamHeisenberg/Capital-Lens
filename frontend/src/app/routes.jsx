import { Navigate, useParams } from 'react-router-dom';
import StockAnalysisPage from '../features/stock-analysis/StockAnalysisPage';
import MethodologyPage from '../features/methodology/MethodologyPage';
import HomePage from '../features/home/HomePage';
import FundamentalsPage from '../features/fundamentals/FundamentalsPage';
import MarketsPage from '../features/markets/MarketsPage';

/**
 * Redirects /analysis/:ticker → /technicals/:ticker.
 * useParams() is the correct way to read dynamic segments in React Router.
 */
function RedirectAnalysis() {
    const { ticker } = useParams();
    return <Navigate to={ticker ? `/technicals/${ticker}` : '/technicals'} replace />;
}

const routes = [
    { path: '/', element: <HomePage /> },

    // Markets — sector & index performance dashboard
    { path: '/markets', element: <MarketsPage /> },

    // Technicals — canonical routes
    { path: '/technicals',         element: <StockAnalysisPage /> },
    { path: '/technicals/:ticker', element: <StockAnalysisPage /> },

    // Backward-compat redirects — /analysis → /technicals (keep for bookmarks / old links)
    { path: '/analysis',           element: <Navigate to="/technicals" replace /> },
    { path: '/analysis/:ticker',   element: <RedirectAnalysis /> },

    // Fundamentals
    { path: '/fundamentals',         element: <FundamentalsPage /> },
    { path: '/fundamentals/:ticker', element: <FundamentalsPage /> },

    { path: '/methodology', element: <MethodologyPage /> },

    // Catch-all
    { path: '*', element: <Navigate to="/" replace /> },
];

export default routes;



