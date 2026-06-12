<?php

namespace App\Http\Controllers\Servers;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Server;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Role CRUD nested under a server. Roles own a permission set (sync through
 * role_permission). Only server owners and admins can manage roles; the
 * server-level owner (level=100) and admin (level=80) roles are protected from
 * being demoted or deleted because every other role's hierarchy depends on
 * them.
 */
class RoleController extends Controller
{
    private const PROTECTED_LEVELS = [Role::LEVEL_OWNER, Role::LEVEL_ADMIN];

    public function index(Server $server): JsonResponse
    {
        $this->ensureCanManageRoles($server);

        $roles = $server->roles()
            ->with('permissions:id,key,description')
            ->orderByDesc('level')
            ->get();

        return response()->json(['data' => $roles]);
    }

    public function store(Request $request, Server $server): JsonResponse
    {
        $this->ensureCanManageRoles($server);

        $data = $this->validatePayload($request, $server, creating: true);

        $role = DB::transaction(function () use ($data, $server) {
            $role = $server->roles()->create([
                'name' => $data['name'],
                'level' => $data['level'],
                'color' => $data['color'] ?? null,
            ]);
            $this->syncPermissions($role, $data['permissions'] ?? []);

            return $role->fresh('permissions');
        });

        return response()->json(['data' => $role], 201);
    }

    public function update(Request $request, Server $server, Role $role): JsonResponse
    {
        $this->ensureCanManageRoles($server);
        $this->ensureRoleBelongsToServer($server, $role);

        if (in_array($role->level, self::PROTECTED_LEVELS, true)) {
            abort_if($request->has('level') && (int) $request->input('level') !== $role->level, 422, 'Default roles cannot be re-leveled.');
        }

        $data = $this->validatePayload($request, $server, creating: false, role: $role);

        DB::transaction(function () use ($role, $data) {
            $role->fill(array_intersect_key($data, array_flip(['name', 'level', 'color'])));
            $role->save();
            if (array_key_exists('permissions', $data)) {
                $this->syncPermissions($role, $data['permissions']);
            }
        });

        return response()->json(['data' => $role->fresh('permissions')]);
    }

    public function destroy(Server $server, Role $role): JsonResponse
    {
        $this->ensureCanManageRoles($server);
        $this->ensureRoleBelongsToServer($server, $role);
        abort_if(in_array($role->level, self::PROTECTED_LEVELS, true), 422, 'Default roles cannot be deleted.');

        $role->delete();

        return response()->json(null, 204);
    }

    private function validatePayload(Request $request, Server $server, bool $creating, ?Role $role = null): array
    {
        $uniqueNameRule = Rule::unique('roles', 'name')
            ->where('server_id', $server->id)
            ->ignore($role?->id);

        return $request->validate([
            'name' => [$creating ? 'required' : 'sometimes', 'string', 'max:32', $uniqueNameRule],
            'level' => [$creating ? 'required' : 'sometimes', 'integer', 'min:0', 'max:255'],
            'color' => ['nullable', 'string', 'max:16'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', 'max:64'],
        ]);
    }

    private function syncPermissions(Role $role, array $keys): void
    {
        $keys = array_values(array_unique(array_filter($keys, 'is_string')));
        $ids = $keys === []
            ? []
            : Permission::query()->whereIn('key', $keys)->pluck('id')->all();

        $role->permissions()->sync($ids);
    }

    private function ensureRoleBelongsToServer(Server $server, Role $role): void
    {
        abort_unless((int) $role->server_id === (int) $server->id, 404, 'Role not found in this server.');
    }

    private function ensureCanManageRoles(Server $server): void
    {
        $userId = Auth::id();
        if ($userId === $server->owner_id) {
            return;
        }

        $level = $server->members()
            ->whereKey($userId)
            ->with('role')
            ->first()
            ?->role
            ?->level ?? 0;

        abort_unless($level >= Role::LEVEL_ADMIN, 403, 'Admin role required.');
    }
}
