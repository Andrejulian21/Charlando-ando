<?php

namespace App\Http\Controllers\Servers;

use App\Exceptions\InvalidInviteException;
use App\Http\Controllers\Controller;
use App\Models\Invite;
use App\Models\Server;
use App\Services\InviteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Invite endpoints. The "redeem" action is the only one that targets a code
 * directly (no server context) so it lives at /invites/{code}/redeem; the
 * other actions live under the server that owns the invite.
 */
class InviteController extends Controller
{
    public function __construct(private readonly InviteService $invites)
    {
    }

    public function index(Server $server): JsonResponse
    {
        $this->ensureCanManageInvites($server);

        $invites = $server->invites()
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $invites]);
    }

    public function store(Request $request, Server $server): JsonResponse
    {
        $this->ensureCanManageInvites($server);

        $data = $request->validate([
            'max_uses' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'expires_in_hours' => ['nullable', 'integer', 'min:1', 'max:8760'],
        ]);

        $invite = $this->invites->create(
            $server,
            Auth::user(),
            $data['max_uses'] ?? null,
            isset($data['expires_in_hours'])
                ? now()->addHours((int) $data['expires_in_hours'])
                : null,
        );

        return response()->json(['data' => $invite], 201);
    }

    public function destroy(Server $server, Invite $invite): JsonResponse
    {
        $this->ensureCanManageInvites($server);
        abort_unless((int) $invite->server_id === (int) $server->id, 404, 'Invite not found in this server.');

        $invite->delete();

        return response()->json(null, 204);
    }

    public function redeem(Request $request, string $code): JsonResponse
    {
        $request->validate([
            'code' => ['sometimes', 'string', 'max:32'],
        ]);

        $lookup = $request->input('code', $code);

        try {
            $member = $this->invites->redeem($lookup, Auth::user());
        } catch (InvalidInviteException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $member->load('server', 'role')], 201);
    }

    private function ensureCanManageInvites(Server $server): void
    {
        // Cheap membership check first; full permission resolution can wire in
        // once the SPA has the right auth header for PermissionResolver::canInServer.
        $userId = Auth::id();
        abort_unless($server->members()->whereKey($userId)->exists(), 403, 'You are not a member of this server.');
    }
}
