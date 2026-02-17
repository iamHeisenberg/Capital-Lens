import { Box, Container } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import darkTheme from '../../theme/darkTheme';
import Navbar from './Navbar';
import Footer from './Footer';

function PageLayout({ children }) {
    return (
        <ThemeProvider theme={darkTheme}>
            <Box sx={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
                <Navbar />
                <Container maxWidth="lg" sx={{ py: 6 }}>
                    {children}
                    <Footer />
                </Container>
            </Box>
        </ThemeProvider>
    );
}

export default PageLayout;
