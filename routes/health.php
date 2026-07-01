<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
|
| Public endpoint for Render's health check monitoring. Returns a simple
| JSON response so the platform knows the container is alive.
|
*/

Route::get('/health', function () {
    return response()->json([
        'status'  => 'ok',
        'service' => 'laravel',
        'env'     => app()->environment(),
    ]);
});
