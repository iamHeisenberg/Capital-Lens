import { useNavigate, useLocation } from 'react-router-dom';
import { Autocomplete, TextField, Box, Typography } from '@mui/material';
import useTickerSearch from '../../hooks/useTickerSearch';

/**
 * GlobalSearchBar
 *
 * A compact MUI Autocomplete that filters the local tickers.json dataset.
 * Navigates to the same section the user is already on (analysis or fundamentals)
 * when a stock is selected, preserving navigation context.
 */
function GlobalSearchBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { query, setQuery, results } = useTickerSearch();

    const handleSelect = (_, option) => {
        if (!option) return;
        setQuery('');
        // Stay in the user's current section when selecting a new stock
        const isFundamentals = location.pathname.startsWith('/fundamentals');
        const section = isFundamentals ? 'fundamentals' : 'analysis';
        navigate(`/${section}/${option.symbol}`);
    };

    return (
        <Autocomplete
            options={results}
            getOptionLabel={(opt) => opt.name}
            inputValue={query}
            onInputChange={(_, value, reason) => {
                // Don't clear the input when an option is highlighted (keyboard nav)
                if (reason !== 'reset') setQuery(value);
            }}
            onChange={handleSelect}
            value={null}
            filterOptions={(x) => x} // filtering is done in the hook
            noOptionsText={
                query.trim()
                    ? 'No stocks found'
                    : 'Type to search...'
            }
            renderOption={(props, option) => (
                <Box
                    component="li"
                    {...props}
                    key={option.symbol}
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2,
                        px: 2,
                        py: 1,
                    }}
                >
                    <Typography sx={{ fontSize: '0.85rem', color: '#e8e8ed' }}>
                        {option.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#5a5a6e', fontFamily: 'monospace' }}>
                        {option.symbol}
                    </Typography>
                </Box>
            )}
            slotProps={{
                paper: {
                    sx: {
                        backgroundColor: '#12121a',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                        mt: 0.5,
                        '& .MuiAutocomplete-noOptions': {
                            color: '#5a5a6e',
                            fontSize: '0.8rem',
                        },
                        '& .MuiAutocomplete-option': {
                            '&:hover, &[aria-selected="true"]': {
                                backgroundColor: 'rgba(255,255,255,0.04)',
                            },
                        },
                    },
                },
            }}
            sx={{ width: { sm: 200, md: 260 } }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    placeholder="Search stocks..."
                    variant="outlined"
                    size="small"
                    slotProps={{
                        input: {
                            ...params.InputProps,
                            sx: {
                                color: '#e8e8ed',
                                fontSize: '0.8rem',
                                backgroundColor: 'rgba(255,255,255,0.04)',
                                borderRadius: '8px',
                                '& fieldset': {
                                    borderColor: 'rgba(255,255,255,0.08)',
                                    borderRadius: '8px',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(255,255,255,0.15)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#06b6d4',
                                    borderWidth: '1px',
                                },
                                '& input::placeholder': {
                                    color: '#5a5a6e',
                                    opacity: 1,
                                },
                            },
                        },
                    }}
                />
            )}
        />
    );
}

export default GlobalSearchBar;
