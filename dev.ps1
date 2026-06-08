# Launches the full ISSWatch demo: the satellite API (:8001), ISSWatch (:8000) and Vite.
# Each starts in its own PowerShell window. Open http://127.0.0.1:8000 once they're up.
#
# Note: PHP can't fork on Windows, so `php artisan serve` is single-threaded here (the
# PHP_CLI_SERVER_WORKERS variable is unsupported). That's fine for normal use — ISSWatch and
# satellite are separate processes, so the chained call still works. For heavier concurrency,
# serve both apps through Laragon's Apache/nginx vhosts instead (see README).

$php = "C:\laragon\bin\php\php-8.3.19-nts-Win32-vs16-x64\php.exe"
$satellite = "C:\laragon\www\satellite"
$isswatch  = "C:\laragon\www\isswatch"

if (-not (Test-Path $php))        { Write-Error "PHP 8.3 not found at $php"; exit 1 }
if (-not (Test-Path $satellite))  { Write-Error "satellite not found at $satellite (clone it first)"; exit 1 }

Start-Process powershell -ArgumentList @(
    '-NoExit','-Command',
    "Set-Location '$satellite'; & '$php' artisan serve --port=8001"
)

Start-Process powershell -ArgumentList @(
    '-NoExit','-Command',
    "Set-Location '$isswatch'; & '$php' artisan serve --port=8000"
)

Start-Process powershell -ArgumentList @(
    '-NoExit','-Command',
    "Set-Location '$isswatch'; npm run dev"
)

Write-Host "Started satellite (:8001), ISSWatch (:8000) and Vite."
Write-Host "Open http://127.0.0.1:8000"
