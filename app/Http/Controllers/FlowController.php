<?php

namespace App\Http\Controllers;

use AdelinFeraru\NestedFlowTracker\Laravel\Eloquent\FlowSpan;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

/**
 * Reads the shared NestedFlowTracker store and feeds the React flow dashboard.
 *
 * Spans are linked by the W3C span_id / parent_span_id, which chains across the
 * ISSWatch → satellite boundary, so show() returns a single tree spanning both
 * services with each node tagged by its originating `component`.
 */
class FlowController extends Controller
{
    /** Recent flows (most recent first), summarised one row per trace. */
    public function index(): JsonResponse
    {
        // Pull a generous window of recent spans, then fold them into per-trace rows.
        $spans = FlowSpan::query()
            ->orderByDesc('id')
            ->limit(600)
            ->get(['id', 'trace_id', 'name', 'component', 'status', 'duration', 'parent_span_id', 'created_at']);

        $flows = $spans
            ->groupBy('trace_id')
            ->map(function (Collection $group): array {
                $root = $group->firstWhere('parent_span_id', null) ?? $group->sortBy('id')->first();

                return [
                    'trace_id' => $root->trace_id,
                    'name' => $root->name,
                    'components' => $group->pluck('component')->unique()->values()->all(),
                    'cross_service' => $group->pluck('component')->unique()->count() > 1,
                    'status' => $group->contains(fn (FlowSpan $s) => $s->status->value === 'failed') ? 'failed' : 'ok',
                    'duration' => (float) ($root->duration ?? 0),
                    'span_count' => $group->count(),
                    'started_at' => optional($root->created_at)->toIso8601String(),
                    'started_ms' => optional($root->created_at)->getTimestampMs(),
                ];
            })
            ->sortByDesc('started_ms')
            ->take(50)
            ->values();

        return response()->json(['flows' => $flows]);
    }

    /** A single flow rendered as a nested span tree. */
    public function show(string $trace): JsonResponse
    {
        $spans = FlowSpan::query()
            ->where('trace_id', $trace)
            ->orderBy('id')
            ->get();

        if ($spans->isEmpty()) {
            return response()->json(['message' => 'Flow not found.'], 404);
        }

        // Index children by their parent span id; roots are spans whose parent
        // is absent from this trace (true root, or the inbound continuation).
        $childrenOf = $spans->groupBy('parent_span_id');
        $knownIds = $spans->pluck('span_id')->filter()->flip();

        $roots = $spans
            ->filter(fn (FlowSpan $s) => $s->parent_span_id === null || ! $knownIds->has($s->parent_span_id))
            ->map(fn (FlowSpan $s) => $this->node($s, $childrenOf))
            ->values();

        return response()->json([
            'trace_id' => $trace,
            'components' => $spans->pluck('component')->unique()->values()->all(),
            'spans' => $roots,
        ]);
    }

    /**
     * @param  Collection<string, Collection<int, FlowSpan>>  $childrenOf
     * @return array<string, mixed>
     */
    private function node(FlowSpan $span, Collection $childrenOf): array
    {
        $children = ($childrenOf->get($span->span_id) ?? collect())
            ->map(fn (FlowSpan $child) => $this->node($child, $childrenOf))
            ->values();

        return [
            'span_id' => $span->span_id,
            'name' => $span->name,
            'component' => $span->component,
            'status' => $span->status->value,
            'duration' => (float) ($span->duration ?? 0),
            'message' => $span->message,
            'context' => $span->context,
            'result' => $span->result,
            'children' => $children,
        ];
    }
}
