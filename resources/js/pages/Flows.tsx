import { Fragment, useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HubIcon from '@mui/icons-material/Hub';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SpanTree from '../components/SpanTree';
import type { FlowSummary, FlowTree } from '../lib/api';

const REFRESH_MS = 4000;

function fmtDuration(s: number) {
    return s >= 1 ? `${s.toFixed(2)}s` : `${Math.round(s * 1000)}ms`;
}

export default function Flows() {
    const [flows, setFlows] = useState<FlowSummary[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [tree, setTree] = useState<FlowTree | null>(null);
    const [loadingTree, setLoadingTree] = useState(false);
    const [empty, setEmpty] = useState(false);
    const selectedRef = useRef<string | null>(null);
    selectedRef.current = selected;

    const loadFlows = async () => {
        try {
            const { data } = await axios.get<{ flows: FlowSummary[] }>('/app/flows');
            setFlows(data.flows);
            setEmpty(data.flows.length === 0);
            // auto-select the most recent flow on first load
            if (!selectedRef.current && data.flows.length > 0) {
                openTrace(data.flows[0].trace_id);
            }
        } catch {
            /* keep last good state */
        }
    };

    const openTrace = async (trace: string) => {
        setSelected(trace);
        setLoadingTree(true);
        try {
            const { data } = await axios.get<FlowTree>(`/app/flows/${trace}`);
            setTree(data);
        } catch {
            setTree(null);
        } finally {
            setLoadingTree(false);
        }
    };

    useEffect(() => {
        loadFlows();
        const id = setInterval(loadFlows, REFRESH_MS);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // The trace panel — rendered inline under the selected card on mobile, and in
    // the right column on desktop.
    const treePanel = (
        <Paper sx={{ p: 3, minHeight: { xs: 'auto', md: 320 } }}>
            {loadingTree && !tree ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            ) : tree ? (
                <>
                    <Stack
                        direction="row"
                        spacing={1.5}
                        useFlexGap
                        sx={{ mb: 2, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                        <AccountTreeIcon sx={{ color: 'primary.main' }} />
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1">Trace tree</Typography>
                            <Typography
                                variant="caption"
                                sx={{ color: 'text.secondary', fontFamily: 'Roboto Mono, monospace', wordBreak: 'break-all' }}
                            >
                                {tree.trace_id}
                            </Typography>
                        </Box>
                        {tree.components.map((c) => (
                            <Chip key={c} size="small" label={c} variant="outlined" />
                        ))}
                        <Button
                            size="small" endIcon={<OpenInNewIcon />}
                            component="a" href={`/flow/${tree.trace_id}`} target="_blank" rel="noreferrer"
                        >
                            Package viewer
                        </Button>
                    </Stack>
                    <SpanTree spans={tree.spans} />
                </>
            ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                    <Typography sx={{ color: 'text.secondary' }}>Select a flow to inspect its trace.</Typography>
                </Box>
            )}
        </Paper>
    );

    return (
        <>
            <Head title="Flow traces" />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Stack direction="row" spacing={2} sx={{ mb: 1, alignItems: 'center' }}>
                    <Typography variant="h4">Flow traces</Typography>
                    <Chip size="small" label="auto-refreshing" color="success" variant="outlined" />
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Every ISS lookup is wrapped in <strong>nestedflowtracker</strong> spans. Calls that reach the
                    satellite service share one <code>trace_id</code> via the W3C <code>traceparent</code> header,
                    so they render as a single tree spanning <strong>both</strong> apps. Generate some by visiting{' '}
                    the Live or Distance pages.
                </Typography>

                {empty && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        No flows recorded yet — open the Live map or Distance page to create some, then come back.
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Flow list */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Stack spacing={1.5}>
                            {flows.map((f) => {
                                const active = f.trace_id === selected;
                                return (
                                  <Fragment key={f.trace_id}>
                                    <Paper
                                        onClick={() => openTrace(f.trace_id)}
                                        sx={{
                                            p: 2,
                                            cursor: 'pointer',
                                            borderColor: active ? 'primary.main' : undefined,
                                            transition: 'border-color .15s',
                                            '&:hover': { borderColor: 'primary.main' },
                                        }}
                                    >
                                        <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: f.status === 'failed' ? 'error.main' : 'success.main' }} />
                                            <Typography noWrap sx={{ fontWeight: 500, flexGrow: 1 }}>{f.name}</Typography>
                                            <Typography variant="caption" sx={{ fontFamily: 'Roboto Mono, monospace', color: 'text.secondary' }}>
                                                {fmtDuration(f.duration)}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                            {f.cross_service && (
                                                <Chip icon={<HubIcon />} size="small" label="cross-service" color="secondary" variant="outlined" sx={{ height: 22 }} />
                                            )}
                                            <Chip size="small" label={`${f.span_count} spans`} variant="outlined" sx={{ height: 22 }} />
                                            <Box sx={{ flexGrow: 1 }} />
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'Roboto Mono, monospace' }}>
                                                {f.trace_id.slice(0, 8)}
                                            </Typography>
                                        </Stack>
                                    </Paper>

                                    {/* Mobile: the trace tree appears right under the selected card. */}
                                    {active && (
                                        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                                            {treePanel}
                                        </Box>
                                    )}
                                  </Fragment>
                                );
                            })}
                        </Stack>
                    </Grid>

                    {/* Desktop: the trace tree sits in the right column. */}
                    <Grid size={{ xs: 12, md: 7 }} sx={{ display: { xs: 'none', md: 'block' } }}>
                        {treePanel}
                    </Grid>
                </Grid>
            </Container>
        </>
    );
}
