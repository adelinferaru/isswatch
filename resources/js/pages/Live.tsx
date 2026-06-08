import { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import L from 'leaflet';
import { MapContainer, TileLayer, CircleMarker, Polyline, Marker, useMap } from 'react-leaflet';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import SpeedIcon from '@mui/icons-material/Speed';
import HeightIcon from '@mui/icons-material/Height';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import StatCard from '../components/StatCard';
import { fetchData, type IssPosition, type ApiError } from '../lib/api';

const POLL_MS = 5000;

const issIcon = L.divIcon({
    className: '',
    html: `<div style="font-size:26px;filter:drop-shadow(0 0 6px #5e8bff)">🛰️</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
});

function Recenter({ lat, lon }: { lat: number; lon: number }) {
    const map = useMap();
    useEffect(() => {
        map.panTo([lat, lon], { animate: true, duration: 1 });
    }, [lat, lon, map]);
    return null;
}

export default function Live() {
    const [pos, setPos] = useState<IssPosition | null>(null);
    const [track, setTrack] = useState<[number, number][]>([]);
    const [error, setError] = useState<string | null>(null);
    const inFlight = useRef(false);

    useEffect(() => {
        let active = true;

        const tick = async () => {
            if (inFlight.current) return;
            inFlight.current = true;
            try {
                const data = await fetchData<IssPosition>('/app/position');
                if (!active) return;
                setPos(data);
                setError(null);
                setTrack((t) => [...t.slice(-60), [data.latitude, data.longitude]]);
            } catch (e) {
                if (active) setError((e as ApiError).message);
            } finally {
                inFlight.current = false;
            }
        };

        tick();
        const id = setInterval(tick, POLL_MS);
        return () => {
            active = false;
            clearInterval(id);
        };
    }, []);

    const here: [number, number] = pos ? [pos.latitude, pos.longitude] : [0, 0];

    // Reflect the ISS's day/night state in the basemap: a light map in daylight,
    // a dark one when eclipsed (and while we're still connecting).
    const night = pos ? pos.visibility !== 'daylight' : true;
    const tileUrl = night
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    return (
        <>
            <Head title="Live ISS map" />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Stack direction="row" spacing={2} sx={{ mb: 1, alignItems: 'center' }}>
                    <Typography variant="h4">Live ISS map</Typography>
                    <Chip
                        size="small"
                        label={error ? 'reconnecting…' : pos ? 'live' : 'connecting…'}
                        color={error ? 'warning' : pos ? 'success' : 'default'}
                        variant="outlined"
                    />
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Position refreshes every {POLL_MS / 1000}s via ISSWatch → satellite → wheretheiss.at.
                </Typography>

                {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper sx={{ overflow: 'hidden', height: { xs: 380, md: 480 } }}>
                            <MapContainer
                                center={[20, 0]}
                                zoom={3}
                                worldCopyJump
                                style={{ height: '100%', width: '100%', background: '#070b18' }}
                            >
                                <TileLayer
                                    key={night ? 'night' : 'day'}
                                    url={tileUrl}
                                    attribution='&copy; OpenStreetMap &copy; CARTO'
                                />
                                {pos && (
                                    <>
                                        <Polyline positions={track} pathOptions={{ color: '#5e8bff', weight: 2, opacity: 0.6 }} />
                                        <CircleMarker center={here} radius={18} pathOptions={{ color: '#5e8bff', fillColor: '#5e8bff', fillOpacity: 0.12, weight: 1 }} />
                                        <Marker position={here} icon={issIcon} />
                                        <Recenter lat={pos.latitude} lon={pos.longitude} />
                                    </>
                                )}
                            </MapContainer>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6, md: 12 }}>
                                <StatCard label="Latitude" value={pos ? pos.latitude.toFixed(3) : '—'} unit="°" />
                            </Grid>
                            <Grid size={{ xs: 6, md: 12 }}>
                                <StatCard label="Longitude" value={pos ? pos.longitude.toFixed(3) : '—'} unit="°" />
                            </Grid>
                            <Grid size={{ xs: 6, md: 12 }}>
                                <StatCard label="Altitude" value={pos ? Math.round(pos.altitude) : '—'} unit="km" icon={<HeightIcon fontSize="small" />} />
                            </Grid>
                            <Grid size={{ xs: 6, md: 12 }}>
                                <StatCard label="Velocity" value={pos ? Math.round(pos.velocity).toLocaleString() : '—'} unit="km/h" icon={<SpeedIcon fontSize="small" />} accent="secondary.main" />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <StatCard
                                    label="Visibility"
                                    value={pos ? pos.visibility : '—'}
                                    icon={<WbSunnyIcon fontSize="small" />}
                                    accent="warning.main"
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Container>
        </>
    );
}
