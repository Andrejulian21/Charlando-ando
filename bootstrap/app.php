<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
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
