import { Box, Container, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import darkTheme from '../../theme/darkTheme';
import Navbar from './Navbar';
import Footer from './Footer';

function PageLayout({ children, fullBleed = false }) {
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#06060a',
                }}
            >
                <Navbar />
                {fullBleed ? (
                    <Box sx={{ flex: 1 }}>{children}</Box>
                ) : (
                    <Container
                        maxWidth="lg"
                        sx={{
                            flex: 1,
                            py: { xs: 4, md: 6 },
                            px: { xs: 2, md: 4 },
                        }}
                    >
                        {children}
                    </Container>
                )}
                {!fullBleed && <Footer />}
            </Box>
        </ThemeProvider>
    );
}

export default PageLayout;
