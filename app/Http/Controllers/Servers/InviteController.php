<?php

namespace App\Http\Controllers\Servers;

use App\Events\MessageSent;
use App\Exceptions\InvalidInviteException;
use App\Http\Controllers\Controller;
use App\Models\DirectMessage;
use App\Models\Invite;
use App\Models\Message;
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

    public function inviteUser(Request $request, Server $server): JsonResponse
    {
        $this->ensureCanManageInvites($server);

        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $userId = Auth::id();

        // Don't allow inviting yourself
        if ((int) $data['user_id'] === $userId) {
            abort(422, 'No puedes invitarte a ti mismo.');
        }

        // Check if already a member
        $alreadyMember = $server->members()->whereKey($data['user_id'])->exists();
        if ($alreadyMember) {
            abort(422, 'El usuario ya es miembro de este servidor.');
        }

        // Find or create DM thread between creator and invited user
        $dm = DirectMessage::threadBetween($userId, (int) $data['user_id']);
        if (!$dm) {
            $dm = DirectMessage::firstOrCreateBetween($userId, (int) $data['user_id']);
        }

        // Create invite message in the DM
        $inviteContent = json_encode([
            'type' => 'server_invite',
            'server_id' => $server->id,
            'server_name' => $server->name,
            'invited_by' => Auth::user()->display_name ?? Auth::user()->name,
        ]);

        $message = new Message([
            'user_id' => $userId,
            'content' => $inviteContent,
        ]);
        $message->messagable()->associate($dm);
        $message->save();

        MessageSent::dispatch($message);

        return response()->json(['data' => $message, 'dm_id' => $dm->id], 201);
    }
}
