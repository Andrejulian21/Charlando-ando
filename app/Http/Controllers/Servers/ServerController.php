<?php

namespace App\Http\Controllers\Servers;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Server;
use App\Models\ServerMember;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Server CRUD. Server creation is the seed point for the entire permission graph:
 *   1. The four default roles (owner=100, admin=80, moderator=60, member=40) are
 *      inserted with their static permission matrix from PermissionSeeder.
 *   2. A #general text channel is created at position 0.
 *   3. The authenticated user is added to server_members with the owner role.
 *
 * Everything happens inside a single DB transaction so a half-built server is
 * never visible to readers.
 */
class ServerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = Auth::id();

        if ($request->query('filter') === 'public') {
            $publicServers = Server::query()
                ->where('is_public', true)
                ->whereDoesntHave('members', fn ($q) => $q->where('users.id', $userId))
                ->withCount('members')
                ->get(['id', 'name', 'description', 'icon_url', 'owner_id'])
                ->load('owner:id,name');
            return response()->json(['data' => $publicServers]);
        }

        $myServers = Server::query()
            ->whereHas('members', fn ($q) => $q->where('users.id', $userId))
            ->with(['channels' => fn ($q) => $q->orderBy('position')->orderBy('id')])
            ->orderBy('name')
            ->get();

        $publicServers = Server::query()
            ->where('is_public', true)
            ->whereDoesntHave('members', fn ($q) => $q->where('users.id', $userId))
            ->withCount('members')
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'icon_url', 'owner_id'])
            ->load('owner:id,name');

        return response()->json([
            'data' => $myServers,
            'public' => $publicServers,
        ]);
    }

    public function show(Server $server): JsonResponse
    {
        $this->ensureMember($server);

        $server->load([
            'channels' => fn ($q) => $q->orderBy('position')->orderBy('id'),
            'roles',
            'members:id,name,display_name,avatar_url,status',
        ]);

        return response()->json(['data' => $server]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:64'],
            'icon_url' => ['nullable', 'url', 'max:512'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_public' => ['boolean'],
        ]);

        $userId = Auth::id();

        $server = DB::transaction(function () use ($data, $userId) {
            $server = Server::query()->create([
                'owner_id' => $userId,
                'name' => $data['name'],
                'icon_url' => $data['icon_url'] ?? null,
                'description' => $data['description'] ?? null,
                'is_public' => $data['is_public'] ?? false,
            ]);

            $this->seedDefaultRoles($server);
            $this->createGeneralChannel($server);

            $ownerRole = $server->roles()->where('level', Role::LEVEL_OWNER)->firstOrFail();
            ServerMember::query()->create([
                'server_id' => $server->id,
                'user_id' => $userId,
                'role_id' => $ownerRole->id,
                'joined_at' => now(),
            ]);

            return $server->fresh(['channels', 'roles']);
        });

        return response()->json(['data' => $server], 201);
    }

    public function update(Request $request, Server $server): JsonResponse
    {
        $this->ensureOwner($server);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:64'],
            'icon_url' => ['sometimes', 'nullable', 'url', 'max:512'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'is_public' => ['sometimes', 'boolean'],
        ]);

        $server->update($data);

        return response()->json(['data' => $server->fresh()]);
    }

    public function destroy(Server $server): JsonResponse
    {
        $this->ensureOwner($server);
        $server->delete();

        return response()->json(null, 204);
    }

    public function join(Server $server): JsonResponse
    {
        if (!$server->is_public) {
            abort(403, 'Este servidor es privado. Necesitas una invitación.');
        }

        $userId = Auth::id();
        $alreadyMember = $server->members()->whereKey($userId)->exists();
        if ($alreadyMember) {
            abort(422, 'Ya eres miembro de este servidor.');
        }

        $memberRole = $server->roles()->where('level', Role::LEVEL_MEMBER)->firstOrFail();
        ServerMember::query()->create([
            'server_id' => $server->id,
            'user_id' => $userId,
            'role_id' => $memberRole->id,
            'joined_at' => now(),
        ]);

        $server->load(['channels' => fn ($q) => $q->orderBy('position')->orderBy('id')]);

        return response()->json(['data' => $server], 200);
    }

    private function seedDefaultRoles(Server $server): void
    {
        $permissions = Permission::query()->pluck('id', 'key');

        foreach (PermissionSeeder::ROLE_MATRIX as $level => $keys) {
            $role = Role::query()->create([
                'server_id' => $server->id,
                'name' => $this->defaultRoleName($level),
                'level' => $level,
            ]);

            $ids = [];
            foreach ($keys as $key) {
                if (isset($permissions[$key])) {
                    $ids[] = $permissions[$key];
                }
            }

            if ($ids !== []) {
                $role->permissions()->sync($ids);
            }
        }
    }

    private function createGeneralChannel(Server $server): void
    {
        Channel::query()->create([
            'server_id' => $server->id,
            'name' => 'general',
            'type' => 'text',
            'position' => 0,
        ]);
    }

    private function defaultRoleName(int $level): string
    {
        return match ($level) {
            Role::LEVEL_OWNER => 'owner',
            Role::LEVEL_ADMIN => 'admin',
            Role::LEVEL_MODERATOR => 'moderator',
            Role::LEVEL_MEMBER => 'member',
            default => 'role-'.$level,
        };
    }

    private function ensureMember(Server $server): void
    {
        $userId = Auth::id();
        $isMember = $server->members()->whereKey($userId)->exists();
        abort_unless($isMember, 403, 'You are not a member of this server.');
    }

    private function ensureOwner(Server $server): void
    {
        abort_unless(Auth::id() === $server->owner_id, 403, 'Only the server owner can do that.');
    }

    private function ensureOwnerOrAdmin(Server $server): void
    {
        $userId = Auth::id();
        if ($userId === $server->owner_id) {
            return;
        }

        $member = ServerMember::query()
            ->where('server_id', $server->id)
            ->where('user_id', $userId)
            ->with('role')
            ->first();

        $level = $member?->role?->level ?? 0;
        abort_unless($level >= Role::LEVEL_ADMIN, 403, 'Admin role required.');
    }
}
