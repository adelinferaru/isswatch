import { Head, Link } from '@inertiajs/react';
import type { ElementType } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import GitHubIcon from '@mui/icons-material/GitHub';
import PublicIcon from '@mui/icons-material/Public';
import StraightenIcon from '@mui/icons-material/Straighten';
import TimelineIcon from '@mui/icons-material/Timeline';

type Props = { repos: { satellite: string; nestedflowtracker: string } };

// MUI polymorphic `component` + Inertia forwardRef Link type escape hatch.
const NavLink = Link as ElementType;

const FEATURES = [
    { icon: <PublicIcon />, title: 'Live ISS map', desc: 'Real-time position on a world map, refreshing every few seconds.', href: '/live' },
    { icon: <StraightenIcon />, title: 'Distance to you', desc: 'Slant-range distance from your coordinates straight up to the station.', href: '/distance' },
    { icon: <TimelineIcon />, title: 'Position history', desc: 'Query past positions over a window and chart altitude & velocity.', href: '/history' },
    { icon: <AccountTreeIcon />, title: 'Flow traces', desc: 'Every request rendered as a cross-service trace tree, live.', href: '/flows' },
];

export default function Showcase({ repos }: Props) {
    return (
        <>
            <Head title="Live ISS tracking + distributed tracing" />

            {/* Hero */}
            <Box
                sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderBottom: '1px solid rgba(120,150,220,0.12)',
                    background:
                        'radial-gradient(1200px 500px at 70% -10%, rgba(94,139,255,0.18), transparent), radial-gradient(900px 400px at 10% 10%, rgba(155,107,255,0.12), transparent)',
                }}
            >
                <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
                    <Chip
                        icon={<SatelliteAltIcon />}
                        label="A live demo of two open-source repos"
                        sx={{ mb: 3, color: 'primary.main', borderColor: 'primary.main' }}
                        variant="outlined"
                    />
                    <Typography variant="h2" sx={{ maxWidth: 820, mb: 2 }}>
                        Track the ISS in real time — and watch every request{' '}
                        <Box component="span" sx={{ color: 'primary.main' }}>trace itself</Box> across services.
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'text.secondary', maxWidth: 720, fontWeight: 400, mb: 4 }}>
                        ISSWatch is an Inertia + React + MUI front end over the{' '}
                        <strong>satellite</strong> ISS API, with every call instrumented by{' '}
                        <strong>nestedflowtracker</strong> — so you can see the live trace span both apps.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Button component={NavLink} href="/live" variant="contained" size="large" startIcon={<PublicIcon />}>
                            Open live map
                        </Button>
                        <Button component={NavLink} href="/flows" variant="outlined" size="large" startIcon={<AccountTreeIcon />}>
                            See the traces
                        </Button>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
                {/* Feature grid */}
                <Grid container spacing={3} sx={{ mb: { xs: 6, md: 10 } }}>
                    {FEATURES.map((f) => (
                        <Grid key={f.title} size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper
                                component={NavLink}
                                href={f.href}
                                sx={{
                                    p: 3,
                                    height: '100%',
                                    display: 'block',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    transition: 'transform .15s, border-color .15s',
                                    '&:hover': { transform: 'translateY(-4px)', borderColor: 'primary.main' },
                                }}
                            >
                                <Box sx={{ color: 'primary.main', mb: 1.5 }}>{f.icon}</Box>
                                <Typography variant="h6" sx={{ mb: 0.5 }}>{f.title}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{f.desc}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* The two repos */}
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>What's under the hood</Typography>
                <Typography variant="h4" sx={{ mb: 4 }}>Two repos, one live demo</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <RepoCard
                            icon={<SatelliteAltIcon sx={{ fontSize: 32 }} />}
                            accent="primary.main"
                            name="satellite"
                            tagline="Laravel 12 ISS REST API"
                            desc="Returns live ISS position, velocity and altitude, and computes slant-range distance from any coordinate. Wraps wheretheiss.at with a 1-second cache."
                            href={repos.satellite}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <RepoCard
                            icon={<AccountTreeIcon sx={{ fontSize: 32 }} />}
                            accent="secondary.main"
                            name="nestedflowtracker"
                            tagline="Zero-infra flow tracer for Laravel"
                            desc="Wrap any block of code in a span; it's timed and stored as a tree. Flows propagate across services via the W3C traceparent header — exactly what powers the Flows page."
                            href={repos.nestedflowtracker}
                        />
                    </Grid>
                </Grid>
            </Container>
        </>
    );
}

function RepoCard({ icon, accent, name, tagline, desc, href }: {
    icon: React.ReactNode; accent: string; name: string; tagline: string; desc: string; href: string;
}) {
    return (
        <Paper sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ color: accent, mb: 2 }}>{icon}</Box>
            <Typography variant="h5" sx={{ fontFamily: 'Roboto Mono, monospace' }}>{name}</Typography>
            <Typography variant="subtitle2" sx={{ color: accent, mb: 1.5 }}>{tagline}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, flexGrow: 1 }}>{desc}</Typography>
            <Button
                component="a" href={href} target="_blank" rel="noreferrer"
                variant="outlined" startIcon={<GitHubIcon />} sx={{ alignSelf: 'flex-start' }}
            >
                View on GitHub
            </Button>
        </Paper>
    );
}
