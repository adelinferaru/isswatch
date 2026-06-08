<?php

namespace App\Services;

use AdelinFeraru\NestedFlowTracker\Laravel\Facades\Flow;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Talks to the upstream "satellite" ISS API over HTTP.
 *
 * Every call is wrapped in a NestedFlowTracker span and sent with
 * Http::withFlowTrace(), so the W3C `traceparent` header propagates the current
 * trace into the satellite service. With both apps writing to the shared flow
 * store, a single request renders as one trace tree spanning ISSWatch → satellite.
 */
class SatelliteClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly int $timeout = 15,
    ) {
    }

    /**
     * Current position/velocity/altitude for a satellite (defaults to the ISS).
     *
     * @return array<string, mixed>
     */
    public function position(int $id = 25544): array
    {
        return $this->get("ISSWatch → satellite: position #{$id}", "api/satellite/{$id}");
    }

    /**
     * Slant-range distance (km) from a ground point to the ISS.
     *
     * @return array<string, mixed>
     */
    public function distance(float $lat, float $lon): array
    {
        return $this->get('ISSWatch → satellite: distance', "api/distance/{$lat},{$lon}");
    }

    /**
     * ISS positions at 1–10 Unix timestamps.
     *
     * @param  array<int, int>  $timestamps
     * @return array<string, mixed>
     */
    public function positions(int $id, array $timestamps): array
    {
        return $this->get(
            "ISSWatch → satellite: positions #{$id}",
            "api/satellite/{$id}/positions",
            ['timestamps' => implode(',', $timestamps)],
        );
    }

    /**
     * @param  array<string, mixed>  $query
     * @return array<string, mixed>
     *
     * @throws SatelliteException
     */
    private function get(string $spanName, string $path, array $query = []): array
    {
        return Flow::span($spanName, function ($span) use ($path, $query) {
            $span->context = ['path' => $path, 'query' => $query, 'upstream' => $this->baseUrl];

            try {
                $response = Http::withFlowTrace()
                    ->baseUrl($this->baseUrl)
                    ->timeout($this->timeout)
                    ->acceptJson()
                    ->get($path, $query);
            } catch (ConnectionException $e) {
                $span->result = ['error' => $e->getMessage()];

                throw new SatelliteException('Could not reach the satellite service.', [], 504);
            }

            $body = $response->json() ?? [];
            $span->result = [
                'http_status' => $response->status(),
                'result' => $body['result'] ?? null,
            ];

            if (($body['result'] ?? 0) !== 1) {
                throw new SatelliteException(
                    $body['message'] ?? 'The satellite service returned an error.',
                    $body['errors'] ?? [],
                    $response->status() ?: 502,
                );
            }

            return $body['data'] ?? [];
        });
    }
}
