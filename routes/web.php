<?php

use App\Http\Controllers\Auth\OAuthController;
use App\Http\Controllers\PageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'appName' => config('app.name', 'Charlando-ando'),
    ]);
});

// OAuth flow — must be reachable while logged out.
Route::get('/auth/{provider}/redirect', [OAuthController::class, 'redirect'])
    ->where('provider', 'google|github|discord')
    ->name('oauth.redirect');

Route::get('/auth/{provider}/callback', [OAuthController::class, 'callback'])
    ->where('provider', 'google|github|discord')
    ->name('oauth.callback');

// Public login page.
Route::get('/login', [PageController::class, 'login'])
    ->name('login');

// Authenticated SPA shell.
Route::middleware('auth')->group(function (): void {
    Route::get('/chat', [PageController::class, 'chatIndex'])
        ->name('chat.index');

    Route::get('/chat/{server}/{channel}', [PageController::class, 'chatShow'])
        ->where(['server' => '[0-9]+', 'channel' => '[0-9]+'])
        ->name('chat.show');

    Route::get('/dms', [PageController::class, 'dmsIndex'])
        ->name('dms.index');

    Route::get('/dms/{dm}', [PageController::class, 'dmsShow'])
        ->where('dm', '[0-9]+')
        ->name('dms.show');

    Route::get('/settings', [PageController::class, 'settingsIndex'])
        ->name('settings.index');

    Route::get('/settings/server/{server}', [PageController::class, 'settingsServer'])
        ->where('server', '[0-9]+')
        ->name('settings.server');
});
