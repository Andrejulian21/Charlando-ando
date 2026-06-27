<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: null,
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        using: function () {
            $apiPath = __DIR__.'/../routes/api.php';
            $webPath = __DIR__.'/../routes/web.php';

            // API routes: use 'web' middleware for session auth with JSON prefix
            Route::middleware('web')->prefix('api')->group($apiPath);

            // Web routes: standard web middleware
            Route::middleware('web')->group($webPath);
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Inertia 3 handles redirect semantics via the EnsureGetOnRedirect middleware
        // registered by its service provider. The app does not need a global
        // HandleInertiaRequests middleware in v3 — controllers can call Inertia::render
        // directly and shared props are wired through ProvidesInertiaProperties.
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
