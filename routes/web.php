<?php

use App\Http\Controllers\FlowController;
use App\Http\Controllers\IssProxyController;
use App\Http\Controllers\PageController;
use Illuminate\Support\Facades\Route;

// Inertia pages
Route::get('/', [PageController::class, 'home'])->name('home');
Route::get('/live', [PageController::class, 'live'])->name('live');
Route::get('/distance', [PageController::class, 'distance'])->name('distance');
Route::get('/history', [PageController::class, 'history'])->name('history');
Route::get('/flows', [PageController::class, 'flows'])->name('flows');

// JSON endpoints the React pages poll (each call → a traced ISSWatch → satellite hop)
Route::prefix('app')->group(function () {
    Route::get('/position', [IssProxyController::class, 'position'])->name('app.position');
    Route::get('/distance', [IssProxyController::class, 'distance'])->name('app.distance');
    Route::get('/positions', [IssProxyController::class, 'positions'])->name('app.positions');

    // Flow-trace dashboard data (reads the shared cross-service store)
    Route::get('/flows', [FlowController::class, 'index'])->name('app.flows');
    Route::get('/flows/{trace}', [FlowController::class, 'show'])->name('app.flows.show');
});
