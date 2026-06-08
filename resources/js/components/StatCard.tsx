import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

export default function StatCard({
    label,
    value,
    unit,
    icon,
    accent = 'primary.main',
}: {
    label: string;
    value: ReactNode;
    unit?: string;
    icon?: ReactNode;
    accent?: string;
}) {
    return (
        <Paper sx={{ p: 2.5, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {icon && <Box sx={{ color: accent, display: 'flex' }}>{icon}</Box>}
                <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1 }}>
                    {label}
                </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontFamily: 'Roboto Mono, monospace', lineHeight: 1.1 }}>
                {value}
                {unit && (
                    <Box component="span" sx={{ fontSize: '0.5em', color: 'text.secondary', ml: 0.75 }}>
                        {unit}
                    </Box>
                )}
            </Typography>
        </Paper>
    );
}
