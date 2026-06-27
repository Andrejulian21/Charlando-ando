<?php

use App\Http\Controllers\Auth\DevLoginController;
use App\Http\Controllers\Auth\OAuthController;
use App\Http\Controllers\DevEmitController;
use App\Http\Controllers\PageController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'appName' => config('app.name', 'Charlando-ando'),
        'canLogin' => true,
    ]);
});

// OAuth flow — reachable while logged out. Discord is intentionally NOT
// supported; the controller rejects it via guardProvider().
Route::get('/auth/{provider}/redirect', [OAuthController::class, 'redirect'])
    ->where('provider', 'google|github')
    ->name('oauth.redirect');

Route::get('/auth/{provider}/callback', [OAuthController::class, 'callback'])
    ->where('provider', 'google|github')
    ->name('oauth.callback');

// Frontend Inertia page that consumes the session-stashed OAuth result.
// Reachable while logged out (the OAuth callback stores the result and
// redirects here) and also when already authenticated.
Route::get('/auth/callback', [OAuthController::class, 'callbackPage'])
    ->name('auth.callback');

// Public login page.
Route::get('/login', [PageController::class, 'login'])
    ->name('login');

// Development-only auth routes (disabled in production).
// The DevLoginController aborts with 404 when APP_ENV != local.
Route::get('/dev-login', [DevLoginController::class, 'showLogin'])->name('dev.login');
Route::post('/dev-login', [DevLoginController::class, 'login']);
Route::get('/dev-register', [DevLoginController::class, 'showRegister'])->name('dev.register');
Route::post('/dev-register', [DevLoginController::class, 'register']);

// Development-only Socket.io emit endpoint for E2E tests.
if (app()->environment('local', 'testing')) {
    Route::post('/dev/emit', [DevEmitController::class, 'emit']);
}

// Authenticated SPA shell.
Route::middleware('auth')->group(function (): void {
    Route::post('/logout', function (Request $request) {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    })->name('logout');

    Route::get('/chat', [PageController::class, 'chatIndex'])
        ->name('chat.index');

    Route::get('/chat/{server}', [PageController::class, 'chatShow'])
        ->where('server', '[0-9]+')
        ->name('chat.show');

    Route::get('/chat/{server}/{channel}', [PageController::class, 'chatChannelShow'])
        ->where(['server' => '[0-9]+', 'channel' => '[0-9]+'])
        ->name('chat.channel');

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
