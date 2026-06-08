<?php

namespace App\Providers;

use App\Services\SatelliteClient;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(SatelliteClient::class, fn () => new SatelliteClient(
            baseUrl: rtrim((string) config('services.satellite.base_url'), '/'),
            timeout: (int) config('services.satellite.timeout', 15),
        ));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // The nestedflowtracker viewer (/flow) is open in local; in other
        // environments it requires this gate. This is a public showcase, so the
        // traces are intentionally viewable. Tighten this to restrict access.
        Gate::define('viewFlow', static fn ($user = null) => true);
    }
}
