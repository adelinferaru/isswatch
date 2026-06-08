import { useState } from 'react';
import { Head } from '@inertiajs/react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { LineChart } from '@mui/x-charts/LineChart';
import { fetchData, type IssPosition, type ApiError } from '../lib/api';

const WINDOWS = [
    { label: '90 min', seconds: 90 * 60 },
    { label: '6 hours', seconds: 6 * 3600 },
    { label: '24 hours', seconds: 24 * 3600 },
];

export default function History() {
    const [win, setWin] = useState(WINDOWS[1].seconds);
    const [rows, setRows] = useState<IssPosition[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const run = async () => {
        setLoading(true);
        setError(null);
        const to = Math.floor(Date.now() / 1000);
        const from = to - win;
        try {
            const data = await fetchData<IssPosition[]>('/app/positions', { from, to, count: 10 });
            setRows([...data].sort((a, b) => a.timestamp - b.timestamp));
        } catch (e) {
            setError((e as ApiError).message);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const times = rows.map((r) => new Date(r.timestamp * 1000));

    return (
        <>
            <Head title="ISS position history" />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>Position history</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Sample the ISS's computed position across a time window and chart how its altitude and
                    velocity vary along the orbit.
                </Typography>

                <Paper sx={{ p: 2.5, mb: 3 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Window:</Typography>
                        <ToggleButtonGroup
                            exclusive size="small" value={win}
                            onChange={(_, v) => v && setWin(v)}
                        >
                            {WINDOWS.map((w) => (
                                <ToggleButton key={w.seconds} value={w.seconds}>{w.label}</ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button variant="contained" onClick={run} disabled={loading}
                            startIcon={loading ? <CircularProgress size={16} /> : undefined}>
                            Load history
                        </Button>
                    </Stack>
                </Paper>

                {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}

                {rows.length > 0 && (
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" sx={{ px: 1, pt: 1 }}>Altitude (km)</Typography>
                                <LineChart
                                    height={260}
                                    xAxis={[{ data: times, scaleType: 'time' }]}
                                    series={[{ data: rows.map((r) => r.altitude), color: '#5e8bff', area: true, showMark: true }]}
                                />
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" sx={{ px: 1, pt: 1 }}>Velocity (km/h)</Typography>
                                <LineChart
                                    height={260}
                                    xAxis={[{ data: times, scaleType: 'time' }]}
                                    series={[{ data: rows.map((r) => r.velocity), color: '#9b6bff', area: true, showMark: true }]}
                                />
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ p: 0, overflow: 'hidden' }}>
                              <Box sx={{ overflowX: 'auto' }}>
                                <Table size="small" sx={{ minWidth: 560 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Time (UTC)</TableCell>
                                            <TableCell align="right">Latitude</TableCell>
                                            <TableCell align="right">Longitude</TableCell>
                                            <TableCell align="right">Altitude (km)</TableCell>
                                            <TableCell align="right">Velocity (km/h)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rows.map((r) => (
                                            <TableRow key={r.timestamp}>
                                                <TableCell>{new Date(r.timestamp * 1000).toISOString().replace('T', ' ').slice(0, 19)}</TableCell>
                                                <TableCell align="right">{r.latitude.toFixed(2)}</TableCell>
                                                <TableCell align="right">{r.longitude.toFixed(2)}</TableCell>
                                                <TableCell align="right">{Math.round(r.altitude)}</TableCell>
                                                <TableCell align="right">{Math.round(r.velocity).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                              </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </Container>
        </>
    );
}
