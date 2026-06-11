<?php

use App\Http\Controllers\PresenceController;
use Illuminate\Support\Facades\Route;

// Sidecar-only endpoints (authenticated via X-Sidecar-Secret header).
Route::post('/presence/disconnect', [PresenceController::class, 'disconnect']);
