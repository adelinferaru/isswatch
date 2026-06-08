<?php

namespace App\Http\Controllers;

use App\Services\SatelliteClient;
use App\Services\SatelliteException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thin JSON proxy the React pages poll. Each action delegates to SatelliteClient,
 * so every poll produces a fresh ISSWatch → satellite trace in the shared store.
 */
class IssProxyController extends Controller
{
    public function position(SatelliteClient $satellite): JsonResponse
    {
        return $this->relay(fn () => $satellite->position());
    }

    public function distance(Request $request, SatelliteClient $satellite): JsonResponse
    {
        $validated = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lon' => ['required', 'numeric', 'between:-180,180'],
        ]);

        return $this->relay(fn () => $satellite->distance(
            (float) $validated['lat'],
            (float) $validated['lon'],
        ));
    }

    public function positions(Request $request, SatelliteClient $satellite): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'integer'],
            'to' => ['required', 'integer', 'gt:from'],
            'count' => ['nullable', 'integer', 'between:2,10'],
        ]);

        $count = (int) ($validated['count'] ?? 10);
        $timestamps = $this->evenlySpaced((int) $validated['from'], (int) $validated['to'], $count);

        return $this->relay(fn () => $satellite->positions(25544, $timestamps));
    }

    /**
     * @param  callable(): array<string, mixed>  $call
     */
    private function relay(callable $call): JsonResponse
    {
        try {
            return response()->json(['ok' => true, 'data' => $call()]);
        } catch (SatelliteException $e) {
            return response()->json([
                'ok' => false,
                'message' => $e->getMessage(),
                'errors' => $e->errors,
            ], $e->status);
        }
    }

    /**
     * @return array<int, int>
     */
    private function evenlySpaced(int $from, int $to, int $count): array
    {
        if ($count < 2) {
            return [$from];
        }

        $step = ($to - $from) / ($count - 1);

        return array_map(
            static fn (int $i): int => (int) round($from + $step * $i),
            range(0, $count - 1),
        );
    }
}
