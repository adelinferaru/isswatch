import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { ReactNode } from 'react';
import theme from './theme';
import Layout from './components/Layout';

const appName = import.meta.env.VITE_APP_NAME || 'ISSWatch';

createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    resolve: async (name) => {
        const page: any = await resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        );
        // Wrap every page in the shared MUI Layout unless it sets its own.
        page.default.layout =
            page.default.layout || ((p: ReactNode) => <Layout>{p}</Layout>);
        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <App {...props} />
            </ThemeProvider>,
        );
    },
    progress: { color: '#5e8bff' },
});
