# ISSWatch

A live International Space Station tracker built to **showcase two repos as a single demo**:

- **[satellite](https://github.com/adelinferaru/satellite)** — a Laravel 13 REST API returning the
  ISS's live position/velocity/altitude and slant-range distance from any coordinate.
- **[nestedflowtracker](https://github.com/adelinferaru/nestedflowtracker)** — a zero-infra flow
  tracer. Every request here is wrapped in spans, and calls that cross into the satellite service
  share one `trace_id` (via the W3C `traceparent` header) so they render as a **single trace tree
  spanning both apps**.

ISSWatch itself is **Laravel 13 + Inertia + React + TypeScript + MUI**.

## Architecture

```
Browser ──Inertia/axios──▶ ISSWatch (Laravel 13 + React/MUI, :8000)
                                │  Http::withFlowTrace()  (propagates traceparent)
                                ▼
                           satellite API (Laravel 13, :8001)
                                │
                                ▼
                           api.wheretheiss.at

ISSWatch  ─┐
           ├─▶  shared flow store (SQLite: C:/laragon/www/flow-shared.sqlite)  ◀─ /flows dashboard
satellite ─┘        (both write nestedflowtracker spans here → one unified trace)
```

| App | Dir | Port | `FLOW_COMPONENT` |
|---|---|---|---|
| ISSWatch (this) | `C:\laragon\www\isswatch` | 8000 (+ Vite 5173) | `isswatch` |
| satellite | `C:\laragon\www\satellite` | 8001 | `satellite` |

## Pages

- **/** — showcase landing explaining both repos.
- **/live** — real-time ISS position on a Leaflet map with a fading ground track.
- **/distance** — slant-range distance from your coordinates (geolocation or manual).
- **/history** — sample past positions over a window and chart altitude/velocity (`@mui/x-charts`).
- **/flows** — the flow-trace dashboard: every lookup as a **cross-service trace tree**. The package's
  own viewer is also available at **/flow**.

## Running it

> ⚠️ Laravel 13 requires **PHP ≥ 8.3**, and the bare `php` on PATH here is 7.2. Use the Laragon 8.3
> binary: `C:\laragon\bin\php\php-8.3.19-nts-Win32-vs16-x64\php.exe` (`$php` below; 8.3.30 also works).
>
> ℹ️ PHP can't fork on Windows, so `php artisan serve` is **single-threaded** here
> (`PHP_CLI_SERVER_WORKERS` is unsupported — it errors with "forking is not supported"). That's fine
> for normal use: ISSWatch and satellite are separate processes, so the chained call works, and the
> Live page guards against overlapping its own polls. For heavier concurrency, serve both apps through
> **Laragon vhosts** instead (below).

**Quick start (PowerShell):** `./dev.ps1` — starts satellite (:8001), ISSWatch (:8000) and Vite, then
open <http://127.0.0.1:8000>.

**Or manually**, in three terminals (`$php` = the 8.3 binary above):

```powershell
# 1) satellite
cd C:\laragon\www\satellite ; & $php artisan serve --port=8001

# 2) ISSWatch
cd C:\laragon\www\isswatch  ; & $php artisan serve --port=8000

# 3) Vite (HMR for the React front end)
cd C:\laragon\www\isswatch  ; npm run dev
```

For a production-style front end instead of Vite HMR, run `npm run build` once and skip terminal 3.

### Option B — Laragon vhosts (real concurrency on Windows)

Laragon auto-creates a vhost per `www` folder, served by Apache/nginx + PHP-FPM (properly concurrent,
unlike `artisan serve`). After a Laragon **Reload**, the apps are at `http://isswatch.test` and
`http://satellite.test`. Then point ISSWatch at the satellite vhost in `.env`:

```dotenv
SATELLITE_BASE_URL=http://satellite.test
```

Build the front end with `npm run build` (the vhost serves the compiled assets). No `artisan serve`
needed in this mode.

## Troubleshooting: slow or failing ISS data

If the Live map shows `cURL error 28: SSL connection timeout`, the upstream
`api.wheretheiss.at` is slow/unreachable **from your network**. Diagnose with:

```powershell
curl -s -o NUL -w "connect=%{time_connect}s ssl=%{time_appconnect}s total=%{time_total}s`n" https://api.wheretheiss.at/v1/satellites/25544
curl -s -o NUL -w "ssl=%{time_appconnect}s`n" https://api.github.com   # compare: should be fast
```

If `connect` is fast but `ssl` is ~10s (and github is instant), it's a **path-MTU black hole** or a
VPN/antivirus TLS-inspection issue specific to that host — not the app. Things to try: disable VPN,
disable HTTPS scanning in your antivirus, test on another network (e.g. phone hotspot), or lower your
adapter MTU.

The satellite service is tuned to cope: it caches each **successful** fix for `ISS_CACHE_SECONDS`
(default 10) so polls stay instant between upstream hits, and waits up to `ISS_HTTP_TIMEOUT` (default
25s) for the slow handshake. ISSWatch waits `SATELLITE_TIMEOUT` (default 30s) for satellite. Tune
these in the respective `.env` files.

> Found & fixed along the way: the satellite cache used an **absolute** `now()->addSeconds()` expiry
> computed *before* the slow call, so the entry was already expired by the time it was written and
> never hit. It now uses a relative integer TTL and only caches successful fixes — worth porting back
> to the satellite repo.

## The shared flow store

Both apps point a `flow` database connection at `C:/laragon/www/flow-shared.sqlite`
(`FLOW_CONNECTION=flow`). Because both write their spans there, the `/flows` dashboard (and the
package's `/flow` viewer in either app) shows the full **ISSWatch → satellite → wheretheiss.at** tree
for a single request. The `flow_spans` table is created once via the satellite app's migration.

To recreate it from scratch, from the satellite directory:
`& $php artisan migrate --database=flow --path=database/migrations`.

## Deploying to Laravel Forge

Deploy **ISSWatch** (`adelinferaru/isswatch`) and **satellite-demo**
(`adelinferaru/satellite-demo`) as **two sites on one Forge server**, so they share that server's
MySQL for the cross-service trace store. On a real Linux server the `artisan serve` limitations from
local dev don't apply — nginx + PHP-FPM handle the chained call and concurrency fine.

1. **Databases** (Forge → server → Database): create `flow_shared` (the shared trace store) plus an
   app DB for each site (`isswatch`, `satellite`).
2. **satellite-demo site** — connect the repo. Env:
   ```dotenv
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://satellite-demo.your-domain
   DB_CONNECTION=mysql            # + DB_DATABASE=satellite, DB_USERNAME, DB_PASSWORD
   FLOW_COMPONENT=satellite
   FLOW_AUTO_HTTP=false
   FLOW_DB_DRIVER=mysql
   FLOW_DB_HOST=127.0.0.1
   FLOW_DB_DATABASE=flow_shared   # + FLOW_DB_USERNAME, FLOW_DB_PASSWORD
   ```
   Deploy script: `composer install --no-dev -o` · `php artisan migrate --force` ·
   `php artisan migrate --database=flow --path=database/migrations --force` ·
   `php artisan config:cache && php artisan route:cache`
3. **ISSWatch site** — connect the repo. Same `FLOW_DB_*` (point at the **same** `flow_shared`), plus:
   ```dotenv
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://isswatch.your-domain
   SATELLITE_BASE_URL=https://satellite-demo.your-domain
   FLOW_COMPONENT=isswatch
   ```
   Deploy script: `composer install --no-dev -o` · `npm ci && npm run build` ·
   `php artisan migrate --force` ·
   `php artisan migrate --database=flow --path=database/migrations --force` ·
   `php artisan config:cache && php artisan route:cache`

The flow migration against `flow_shared` is idempotent (a `migrations` table inside that DB tracks it),
so running it from both deploy scripts is safe. Visit `https://isswatch.your-domain` → `/flows` shows
the single cross-service tree spanning both sites. The `viewFlow` gate is open (public showcase) —
tighten it in `app/Providers/AppServiceProvider.php` to restrict who can see `/flow`.

## Tests

```powershell
cd C:\laragon\www\isswatch ; & $php artisan test
```

`tests/Feature/SatelliteClientTest.php` covers the traced proxy with `Http::fake()` — envelope
unwrapping, `traceparent` propagation, validation→exception mapping, and the JSON proxy endpoints.

## Key files

- `app/Services/SatelliteClient.php` — traced HTTP client to satellite (`Http::withFlowTrace`, spans).
- `app/Http/Controllers/IssProxyController.php` — JSON endpoints the React pages poll.
- `app/Http/Controllers/FlowController.php` — reads the shared store, builds the nested trace tree.
- `resources/js/pages/*.tsx` — the five pages; `components/SpanTree.tsx` renders the trace tree.
- In **satellite**: `app/Http/Middleware/ContinueFlowTrace.php` links its root span to the inbound
  caller's span (via nestedflowtracker 3.1's `options['parent_span_id']`) so the trace is one tree
  (replaces `FLOW_AUTO_HTTP`).
