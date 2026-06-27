<?php

namespace App\Providers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Share the authenticated user with every Inertia page so the SPA
        // always has access to the current user without each controller
        // having to pass it explicitly.
        Inertia::share('auth.user', fn () => Auth::user() ? [
            'id' => Auth::id(),
            'name' => Auth::user()->name,
            'display_name' => Auth::user()->display_name,
            'email' => Auth::user()->email,
            'avatar_url' => Auth::user()->avatar_url,
            'status' => Auth::user()->status,
        ] : null);
    }
}
