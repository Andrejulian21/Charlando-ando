<?php

use App\Http\Controllers\Messages\DirectMessageController;
use App\Http\Controllers\Messages\MessageController;
use App\Http\Controllers\PresenceController;
use App\Http\Controllers\Servers\ChannelController;
use App\Http\Controllers\Servers\InviteController;
use App\Http\Controllers\Servers\RoleController;
use App\Http\Controllers\Servers\ServerController;
use App\Http\Controllers\UserController;
use App\Models\Server;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| JSON endpoints consumed by the Inertia/SPA client. All routes are guarded
| by the session-backed 'auth' middleware; the SPA sends cookies on every
| request just like a normal browser navigation.
|
*/

Route::middleware('auth')->group(function (): void {
    // Current user
    Route::get('me', [UserController::class, 'me'])->name('api.me.show');
    Route::patch('me', [UserController::class, 'updateMe'])->name('api.me.update');

    // User search
    Route::get('users/search', [UserController::class, 'search'])->name('api.users.search');

    // Servers
    Route::get('servers', [ServerController::class, 'index'])->name('api.servers.index');
    Route::post('servers', [ServerController::class, 'store'])->name('api.servers.store');
    Route::get('servers/{server}', [ServerController::class, 'show'])->name('api.servers.show');
    Route::patch('servers/{server}', [ServerController::class, 'update'])->name('api.servers.update');
    Route::delete('servers/{server}', [ServerController::class, 'destroy'])->name('api.servers.destroy');
    Route::post('servers/{server}/join', [ServerController::class, 'join'])->name('api.servers.join');

    // Channels (nested under server)
    Route::get('servers/{server}/channels', [ChannelController::class, 'index'])->name('api.servers.channels.index');
    Route::post('servers/{server}/channels', [ChannelController::class, 'store'])->name('api.servers.channels.store');
    Route::get('servers/{server}/channels/{channel}', [ChannelController::class, 'show'])->name('api.servers.channels.show');
    Route::patch('servers/{server}/channels/{channel}', [ChannelController::class, 'update'])->name('api.servers.channels.update');
    Route::delete('servers/{server}/channels/{channel}', [ChannelController::class, 'destroy'])->name('api.servers.channels.destroy');

    // Messages
    Route::get('servers/{server}/channels/{channel}/messages', [MessageController::class, 'index'])
        ->name('api.channels.messages.index');
    Route::post('servers/{server}/channels/{channel}/messages', [MessageController::class, 'store'])
        ->name('api.channels.messages.store');

    // Server-level messages (no channel)
    Route::get('servers/{server}/messages', [MessageController::class, 'indexForServer'])
        ->name('api.servers.messages.index');
    Route::post('servers/{server}/messages', [MessageController::class, 'storeForServer'])
        ->name('api.servers.messages.store');

    // Direct messages
    Route::get('dms', [DirectMessageController::class, 'listThreads'])->name('api.dms.index');
    Route::get('dms/{dm}/messages', [DirectMessageController::class, 'index'])
        ->name('api.dms.messages.index');
    Route::post('dms/{dm}/messages', [DirectMessageController::class, 'store'])
        ->name('api.dms.messages.store');
    Route::post('dms', [DirectMessageController::class, 'createThread'])
        ->name('api.dms.store');

    // Invites
    Route::get('servers/{server}/invites', [InviteController::class, 'index'])->name('api.servers.invites.index');
    Route::post('servers/{server}/invites', [InviteController::class, 'store'])->name('api.servers.invites.store');
    Route::delete('servers/{server}/invites/{invite}', [InviteController::class, 'destroy'])->name('api.servers.invites.destroy');
    Route::post('invites/{code}/redeem', [InviteController::class, 'redeem'])->name('api.invites.redeem');
    Route::post('servers/{server}/invite-user', [InviteController::class, 'inviteUser'])->name('api.servers.invite-user');

    // Roles
    Route::get('servers/{server}/roles', [RoleController::class, 'index'])->name('api.servers.roles.index');
    Route::post('servers/{server}/roles', [RoleController::class, 'store'])->name('api.servers.roles.store');
    Route::patch('servers/{server}/roles/{role}', [RoleController::class, 'update'])->name('api.servers.roles.update');
    Route::delete('servers/{server}/roles/{role}', [RoleController::class, 'destroy'])->name('api.servers.roles.destroy');

    // Server members
    Route::delete('servers/{server}/members/{member}', [\App\Http\Controllers\Servers\ServerMemberController::class, 'destroy'])
        ->name('api.servers.members.destroy');
    Route::post('servers/{server}/bans', [\App\Http\Controllers\Servers\ServerMemberController::class, 'ban'])
        ->name('api.servers.members.ban');
});

// Sidecar-only endpoints (authenticated via X-Sidecar-Secret header).
Route::post('/presence/disconnect', [PresenceController::class, 'disconnect']);
