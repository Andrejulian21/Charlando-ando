<?php

namespace App\Services;

use App\Models\Channel;
use App\Models\ChannelOverride;
use App\Models\Permission;
use App\Models\Server;
use App\Models\ServerMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Centralised "can the user do X here?" check.
 *
 * Resolution order:
 *   1. Server membership: only server members can act on a server's resources.
 *   2. Server-level role permissions: every role has a static set of permission
 *      keys (see PermissionSeeder::ROLE_MATRIX). This is the base grant.
 *   3. Channel overrides: for a given (channel, role) pair, a ChannelOverride
 *      can `allow` or `deny` specific permission keys. The override list
 *      modifies the server-level grant.
 *
 * Deny-precedence: if the role has the permission at the server level but the
 * channel override denies it, the override wins. Conversely, an `allow` entry
 * grants a permission the role did not have at the server level. A role with
 * no override row for the channel keeps its server-level grant untouched.
 */
class PermissionResolver
{
    public function can(User $user, string $permissionKey, ?Channel $channel = null): bool
    {
        if ($channel !== null) {
            return $this->resolveForChannel($user, $channel, $permissionKey);
        }

        // No channel = server-level check. Caller is expected to also pass a
        // server context for server-wide permissions; without a server we
        // cannot locate the role, so this is a safe default.
        return false;
    }

    public function canInServer(User $user, Server $server, string $permissionKey, ?Channel $channel = null): bool
    {
        $member = $this->member($user, $server);
        if ($member === null || $member->role === null) {
            return false;
        }

        $granted = $member->role->permissions()
            ->where('key', $permissionKey)
            ->exists();

        if ($channel === null) {
            return $granted;
        }

        return $this->applyChannelOverride($member->role, $channel, $permissionKey, $granted);
    }

    private function resolveForChannel(User $user, Channel $channel, string $permissionKey): bool
    {
        $server = $channel->server;
        if ($server === null) {
            return false;
        }

        return $this->canInServer($user, $server, $permissionKey, $channel);
    }

    private function applyChannelOverride($role, Channel $channel, string $permissionKey, bool $granted): bool
    {
        $override = ChannelOverride::query()
            ->where('channel_id', $channel->id)
            ->where('role_id', $role->id)
            ->first();

        if ($override === null) {
            return $granted;
        }

        $row = DB::table('channel_override_permission')
            ->join('permissions', 'permissions.id', '=', 'channel_override_permission.permission_id')
            ->where('channel_override_permission.channel_override_id', $override->id)
            ->where('permissions.key', $permissionKey)
            ->select('channel_override_permission.type')
            ->first();

        if ($row === null) {
            return $granted;
        }

        // Deny always wins.
        if ($row->type === ChannelOverride::TYPE_DENY) {
            return false;
        }

        // Allow row grants even if the server-level role did not have it.
        return true;
    }

    private function member(User $user, Server $server): ?ServerMember
    {
        return ServerMember::query()
            ->where('server_id', $server->id)
            ->where('user_id', $user->id)
            ->with('role')
            ->first();
    }
}
