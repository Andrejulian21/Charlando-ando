<?php

namespace App\Http\Controllers\Servers;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Server;
use App\Models\ServerMember;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ServerMemberController extends Controller
{
    public function destroy(Request $request, Server $server, User $member): JsonResponse
    {
        $this->ensureOwnerOrAdmin($server);

        if ((int) $member->id === (int) $server->owner_id) {
            abort(403, 'No puedes expulsar al dueño del servidor.');
        }

        $server->members()->detach($member->id);

        return response()->json(null, 204);
    }

    public function ban(Request $request, Server $server): JsonResponse
    {
        $this->ensureOwnerOrAdmin($server);

        $data = $request->validate(['user_id' => ['required', 'integer', 'exists:users,id']]);

        if ((int) $data['user_id'] === (int) $server->owner_id) {
            abort(403, 'No puedes banear al dueño del servidor.');
        }

        $server->members()->detach($data['user_id']);

        // TODO: Add actual ban record if Ban model exists
        // For now, kicking is equivalent to banning

        return response()->json(null, 204);
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
        abort_unless($level >= Role::LEVEL_ADMIN, 403, 'Se requiere rol de administrador.');
    }
}