import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { SpanNode } from '../lib/api';
import { COMPONENT_COLORS } from '../lib/api';

function fmtMs(seconds: number): string {
    const ms = seconds * 1000;
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(0)}ms`;
}

function SpanRow({ node, depth, max }: { node: SpanNode; depth: number; max: number }) {
    const [open, setOpen] = useState(depth < 2);
    const [details, setDetails] = useState(false);
    const color = COMPONENT_COLORS[node.component] ?? '#8a93b2';
    const hasChildren = node.children.length > 0;
    const pct = max > 0 ? Math.max(2, (node.duration / max) * 100) : 2;
    const failed = node.status === 'failed';
    const hasDetails = Boolean(node.context || node.result || node.message);

    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.75,
                    pl: depth * 3,
                    borderRadius: 1,
                    '&:hover': { backgroundColor: 'rgba(120,150,220,0.06)' },
                }}
            >
                <IconButton
                    size="small"
                    onClick={() => setOpen((o) => !o)}
                    sx={{ visibility: hasChildren ? 'visible' : 'hidden', color: 'text.secondary' }}
                >
                    {open ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                </IconButton>

                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />

                <Box
                    onClick={() => hasDetails && setDetails((d) => !d)}
                    sx={{ flexGrow: 1, minWidth: 0, cursor: hasDetails ? 'pointer' : 'default' }}
                >
                    <Typography
                        noWrap
                        sx={{ fontWeight: 500, color: failed ? 'error.main' : 'text.primary' }}
                    >
                        {node.name}
                    </Typography>
                </Box>

                <Chip
                    label={node.component}
                    size="small"
                    sx={{
                        height: 20,
                        fontSize: 11,
                        color,
                        borderColor: color,
                        backgroundColor: `${color}1a`,
                    }}
                    variant="outlined"
                />

                {/* duration bar */}
                <Box sx={{ width: 140, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
                    <Box
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            width: `${pct}%`,
                            background: failed
                                ? 'linear-gradient(90deg,#ff5d6c,#ff8a94)'
                                : `linear-gradient(90deg,${color},${color}66)`,
                        }}
                    />
                </Box>

                <Typography
                    sx={{ width: 64, textAlign: 'right', fontFamily: 'Roboto Mono, monospace', fontSize: 13, color: 'text.secondary', flexShrink: 0 }}
                >
                    {fmtMs(node.duration)}
                </Typography>
            </Box>

            {hasDetails && (
                <Collapse in={details} unmountOnExit>
                    <Box
                        sx={{
                            ml: depth * 3 + 5,
                            my: 0.5,
                            p: 1.5,
                            borderRadius: 1,
                            backgroundColor: 'rgba(7,11,24,0.6)',
                            border: '1px solid rgba(120,150,220,0.12)',
                            fontFamily: 'Roboto Mono, monospace',
                            fontSize: 12,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color: 'text.secondary',
                        }}
                    >
                        {node.message && <Box sx={{ color: 'error.light', mb: 1 }}>{node.message}</Box>}
                        {node.context && <Box>context: {JSON.stringify(node.context, null, 2)}</Box>}
                        {node.result && <Box sx={{ mt: 1 }}>result: {JSON.stringify(node.result, null, 2)}</Box>}
                    </Box>
                </Collapse>
            )}

            {hasChildren && (
                <Collapse in={open} unmountOnExit>
                    {node.children.map((child) => (
                        <SpanRow key={child.span_id} node={child} depth={depth + 1} max={max} />
                    ))}
                </Collapse>
            )}
        </Box>
    );
}

function maxDuration(nodes: SpanNode[]): number {
    return nodes.reduce((m, n) => Math.max(m, n.duration, maxDuration(n.children)), 0);
}

export default function SpanTree({ spans }: { spans: SpanNode[] }) {
    const max = maxDuration(spans);
    return (
        <Box>
            {spans.map((node) => (
                <SpanRow key={node.span_id} node={node} depth={0} max={max} />
            ))}
        </Box>
    );
}
