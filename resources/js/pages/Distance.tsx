import { useState } from 'react';
import { Head } from '@inertiajs/react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import StraightenIcon from '@mui/icons-material/Straighten';
import StatCard from '../components/StatCard';
import { fetchData, type DistanceResult, type ApiError } from '../lib/api';

export default function Distance() {
    const [lat, setLat] = useState('40.7128');
    const [lon, setLon] = useState('-74.0060');
    const [result, setResult] = useState<DistanceResult | null>(null);
    const [error, setError] = useState<ApiError | null>(null);
    const [loading, setLoading] = useState(false);

    const fieldError = (key: string) => error?.errors?.[key]?.[0];

    const submit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = await fetchData<DistanceResult>('/app/distance', { lat, lon });
            setResult(data);
        } catch (err) {
            setError(err as ApiError);
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const locate = () => {
        if (!navigator.geolocation) {
            setError({ message: 'Geolocation is not available in this browser.' });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (p) => {
                setLat(p.coords.latitude.toFixed(4));
                setLon(p.coords.longitude.toFixed(4));
            },
            () => setError({ message: 'Could not get your location (permission denied?).' }),
        );
    };

    return (
        <>
            <Head title="Distance to the ISS" />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>How far above you is the ISS?</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Enter a ground point — we compute the <strong>slant range</strong>: the true line-of-sight
                    distance through space to the station, not the distance along the ground.
                </Typography>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Paper sx={{ p: 3 }} component="form" onSubmit={submit}>
                            <Stack spacing={2.5}>
                                <TextField
                                    label="Latitude" value={lat} onChange={(e) => setLat(e.target.value)}
                                    error={Boolean(fieldError('lat'))} helperText={fieldError('lat')}
                                    fullWidth
                                />
                                <TextField
                                    label="Longitude" value={lon} onChange={(e) => setLon(e.target.value)}
                                    error={Boolean(fieldError('lon'))} helperText={fieldError('lon')}
                                    fullWidth
                                />
                                <Stack direction="row" spacing={1.5}>
                                    <Button type="submit" variant="contained" disabled={loading}
                                        startIcon={loading ? <CircularProgress size={16} /> : <StraightenIcon />}>
                                        Measure
                                    </Button>
                                    <Button variant="outlined" onClick={locate} startIcon={<MyLocationIcon />}>
                                        Use my location
                                    </Button>
                                </Stack>
                                {error && !error.errors && <Alert severity="error">{error.message}</Alert>}
                            </Stack>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 7 }}>
                        {result ? (
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <Paper sx={{ p: 4, textAlign: 'center', background: 'radial-gradient(600px 200px at 50% 0%, rgba(94,139,255,0.15), transparent)' }}>
                                        <Typography variant="overline" sx={{ color: 'text.secondary' }}>Slant range</Typography>
                                        <Typography variant="h2" sx={{ fontFamily: 'Roboto Mono, monospace', color: 'primary.main' }}>
                                            {Math.round(result.distance).toLocaleString()}
                                            <Box component="span" sx={{ fontSize: '0.35em', color: 'text.secondary', ml: 1 }}>km</Box>
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <StatCard label="ISS latitude" value={result.iss.latitude.toFixed(2)} unit="°" />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <StatCard label="ISS longitude" value={result.iss.longitude.toFixed(2)} unit="°" />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <StatCard label="ISS altitude" value={result.iss.altitude ? Math.round(result.iss.altitude) : '—'} unit="km" accent="secondary.main" />
                                </Grid>
                            </Grid>
                        ) : (
                            <Paper sx={{ p: 6, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography sx={{ color: 'text.secondary' }}>
                                    Enter coordinates and press <strong>Measure</strong>.
                                </Typography>
                            </Paper>
                        )}
                    </Grid>
                </Grid>
            </Container>
        </>
    );
}
