import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Dark, space-themed palette for ISSWatch.
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#5e8bff' },     // orbital blue
        secondary: { main: '#9b6bff' },   // nebula violet
        success: { main: '#3ddc97' },
        warning: { main: '#ffb74d' },
        error: { main: '#ff5d6c' },
        background: {
            default: '#070b18',
            paper: '#0f1730',
        },
        text: {
            primary: '#e6ebff',
            secondary: '#9aa7c7',
        },
    },
    shape: { borderRadius: 12 },
    typography: {
        fontFamily: 'Inter, system-ui, Arial, sans-serif',
        h1: { fontWeight: 700, letterSpacing: '-0.02em' },
        h2: { fontWeight: 700, letterSpacing: '-0.02em' },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 700 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage:
                        'linear-gradient(180deg, rgba(94,139,255,0.04), rgba(155,107,255,0.02))',
                    border: '1px solid rgba(120,150,220,0.12)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(7,11,24,0.85)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid rgba(120,150,220,0.12)',
                    backgroundImage: 'none',
                },
            },
        },
    },
});

// Auto-scale headings/typography down on smaller screens.
export default responsiveFontSizes(theme);
