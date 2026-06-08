import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import type { ElementType, ReactNode } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import GitHubIcon from '@mui/icons-material/GitHub';
import MenuIcon from '@mui/icons-material/Menu';

// MUI's polymorphic `component` prop and Inertia's forwardRef Link disagree on
// types; ElementType is the accepted escape hatch and behaves identically.
const NavLink = Link as ElementType;

const NAV = [
    { label: 'Home', href: '/' },
    { label: 'Live Map', href: '/live' },
    { label: 'Distance', href: '/distance' },
    { label: 'History', href: '/history' },
    { label: 'Flows', href: '/flows' },
];

export default function Layout({ children }: { children: ReactNode }) {
    const { url } = usePage();
    const path = url.split('?')[0];
    const [open, setOpen] = useState(false);

    const isActive = (href: string) =>
        href === '/' ? path === '/' : path.startsWith(href);

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <AppBar position="sticky" elevation={0}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ gap: 2 }}>
                        <SatelliteAltIcon sx={{ color: 'primary.main' }} />
                        <Typography
                            component={NavLink}
                            href="/"
                            variant="h6"
                            sx={{ color: 'text.primary', textDecoration: 'none', fontWeight: 700 }}
                        >
                            ISS<Box component="span" sx={{ color: 'primary.main' }}>Watch</Box>
                        </Typography>

                        {/* Desktop nav */}
                        <Stack direction="row" spacing={0.5} sx={{ ml: 3, flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                            {NAV.map((item) => (
                                <Button
                                    key={item.href}
                                    component={NavLink}
                                    href={item.href}
                                    size="small"
                                    sx={{
                                        color: isActive(item.href) ? 'primary.main' : 'text.secondary',
                                        fontWeight: isActive(item.href) ? 700 : 500,
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Stack>

                        {/* Spacer on mobile (no desktop nav to grow) */}
                        <Box sx={{ flexGrow: 1, display: { xs: 'block', md: 'none' } }} />

                        <IconButton
                            component="a"
                            href="https://github.com/adelinferaru"
                            target="_blank"
                            rel="noreferrer"
                            size="small"
                            sx={{ color: 'text.secondary' }}
                        >
                            <GitHubIcon fontSize="small" />
                        </IconButton>

                        {/* Mobile hamburger */}
                        <IconButton
                            onClick={() => setOpen(true)}
                            size="small"
                            sx={{ color: 'text.primary', display: { xs: 'inline-flex', md: 'none' } }}
                            aria-label="Open navigation"
                        >
                            <MenuIcon />
                        </IconButton>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Mobile nav drawer */}
            <Drawer
                anchor="right"
                open={open}
                onClose={() => setOpen(false)}
                slotProps={{ paper: { sx: { width: 240, backgroundImage: 'none' } } }}
            >
                <List sx={{ pt: 2 }}>
                    {NAV.map((item) => (
                        <ListItemButton
                            key={item.href}
                            component={NavLink}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            selected={isActive(item.href)}
                        >
                            <ListItemText
                                primary={item.label}
                                slotProps={{
                                    primary: {
                                        sx: {
                                            color: isActive(item.href) ? 'primary.main' : 'text.primary',
                                            fontWeight: isActive(item.href) ? 700 : 500,
                                        },
                                    },
                                }}
                            />
                        </ListItemButton>
                    ))}
                </List>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1 }}>
                {children}
            </Box>

            <Box
                component="footer"
                sx={{
                    py: 3,
                    mt: 6,
                    borderTop: '1px solid rgba(120,150,220,0.12)',
                    color: 'text.secondary',
                }}
            >
                <Container maxWidth="lg">
                    <Typography variant="body2">
                        ISSWatch — a live demo of{' '}
                        <Box component="a" href="https://github.com/adelinferaru/satellite"
                             target="_blank" rel="noreferrer"
                             sx={{ color: 'primary.main' }}>satellite</Box>{' '}
                        &{' '}
                        <Box component="a" href="https://github.com/adelinferaru/nestedflowtracker"
                             target="_blank" rel="noreferrer"
                             sx={{ color: 'secondary.main' }}>nestedflowtracker</Box>.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
}
