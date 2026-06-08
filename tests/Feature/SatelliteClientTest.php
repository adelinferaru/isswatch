<?php

namespace Tests\Feature;

use App\Services\SatelliteClient;
use App\Services\SatelliteException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SatelliteClientTest extends TestCase
{
    use RefreshDatabase;

    public function test_position_unwraps_the_success_envelope(): void
    {
        Http::fake([
            'satellite.test/api/satellite/*' => Http::response([
                'result' => 1,
                'data' => ['name' => 'iss', 'latitude' => 1.5, 'longitude' => 2.5, 'altitude' => 420],
            ]),
        ]);

        $data = app(SatelliteClient::class)->position();

        $this->assertSame('iss', $data['name']);
        $this->assertSame(420, $data['altitude']);
    }

    public function test_outbound_call_carries_a_traceparent_header(): void
    {
        Http::fake([
            'satellite.test/*' => Http::response(['result' => 1, 'data' => []]),
        ]);

        app(SatelliteClient::class)->position();

        // withFlowTrace() should attach a W3C traceparent so the upstream can continue the trace.
        Http::assertSent(fn ($request) => preg_match(
            '/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/',
            $request->header('traceparent')[0] ?? '',
        ) === 1);
    }

    public function test_validation_failure_becomes_a_satellite_exception(): void
    {
        Http::fake([
            'satellite.test/api/distance/*' => Http::response([
                'result' => 0,
                'errors' => ['lat' => ['The lat must be between -90 and 90.']],
            ], 422),
        ]);

        try {
            app(SatelliteClient::class)->distance(999, 0);
            $this->fail('Expected SatelliteException.');
        } catch (SatelliteException $e) {
            $this->assertSame(422, $e->status);
            $this->assertArrayHasKey('lat', $e->errors);
        }
    }

    public function test_proxy_position_endpoint_returns_ok_envelope(): void
    {
        Http::fake([
            'satellite.test/api/satellite/*' => Http::response([
                'result' => 1,
                'data' => ['name' => 'iss', 'velocity' => 27600],
            ]),
        ]);

        $this->getJson('/app/position')
            ->assertOk()
            ->assertJson(['ok' => true, 'data' => ['name' => 'iss']]);
    }

    public function test_proxy_distance_validates_before_calling_upstream(): void
    {
        Http::fake();

        $this->getJson('/app/distance?lat=999&lon=0')->assertStatus(422);

        Http::assertNothingSent();
    }
}
