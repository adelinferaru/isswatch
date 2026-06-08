import axios from 'axios';

export type IssPosition = {
    name: string;
    id: number;
    latitude: number;
    longitude: number;
    altitude: number;
    velocity: number;
    visibility: string;
    footprint: number;
    timestamp: number;
    units: string;
};

export type DistanceResult = {
    distance: number;
    unit: string;
    measurement: string;
    iss: { latitude: number; longitude: number; altitude: number | null };
};

export type FlowSummary = {
    trace_id: string;
    name: string;
    components: string[];
    cross_service: boolean;
    status: 'ok' | 'failed';
    duration: number;
    span_count: number;
    started_at: string | null;
    started_ms: number | null;
};

export type SpanNode = {
    span_id: string;
    name: string;
    component: string;
    status: 'ok' | 'failed' | 'running';
    duration: number;
    message: string | null;
    context: Record<string, unknown> | null;
    result: Record<string, unknown> | null;
    children: SpanNode[];
};

export type FlowTree = {
    trace_id: string;
    components: string[];
    spans: SpanNode[];
};

export type ApiError = {
    message: string;
    errors?: Record<string, string[]>;
};

/** Unwrap the proxy envelope { ok, data } or throw an ApiError. */
export async function fetchData<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    try {
        const { data } = await axios.get(url, { params });
        if (data && data.ok === false) {
            throw { message: data.message, errors: data.errors } as ApiError;
        }
        return data.data as T;
    } catch (e: any) {
        if (e?.response?.data) {
            throw {
                message: e.response.data.message ?? 'Request failed.',
                errors: e.response.data.errors,
            } as ApiError;
        }
        if (e?.message) throw e as ApiError;
        throw { message: 'Network error.' } as ApiError;
    }
}

export const COMPONENT_COLORS: Record<string, string> = {
    isswatch: '#5e8bff',
    satellite: '#9b6bff',
};
