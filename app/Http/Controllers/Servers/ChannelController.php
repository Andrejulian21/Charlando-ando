<?php

namespace App\Http\Controllers\Servers;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\Role;
use App\Models\Server;
use App\Models\ServerMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/**
 * Channel CRUD nested under a server. Channels live inside a server so the route
 * model binding on Server::class is the membership check. Channel-level create /
 * update / destroy are gated on the admin-or-owner role; #general is protected
 * from being deleted or renamed because every server assumes it exists.
 */
class ChannelController extends Controller
{
    private const PROTECTED_CHANNEL_NAMES = ['general'];

    public function index(Server $server): JsonResponse
    {
        $this->ensureMember($server);

        $channels = $server->channels()
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $channels]);
    }

    public function show(Server $server, Channel $channel): JsonResponse
    {
        $this->ensureChannelBelongsToServer($server, $channel);
        $this->ensureMember($server);

        return response()->json(['data' => $channel]);
    }

    public function store(Request $request, Server $server): JsonResponse
    {
        $this->ensureOwnerOrAdmin($server);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:64', 'regex:/^[a-z0-9][a-z0-9-]*$/'],
            'type' => ['nullable', Rule::in(['text', 'voice'])],
            'topic' => ['nullable', 'string', 'max:500'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);

        $channel = $server->channels()->create([
            'name' => $data['name'],
            'type' => $data['type'] ?? 'text',
            'topic' => $data['topic'] ?? null,
            'position' => $data['position'] ?? $this->nextPosition($server),
        ]);

        return response()->json(['data' => $channel], 201);
    }

    public function update(Request $request, Server $server, Channel $channel): JsonResponse
    {
        $this->ensureChannelBelongsToServer($server, $channel);
        $this->ensureOwnerOrAdmin($server);

        if (in_array($channel->name, self::PROTECTED_CHANNEL_NAMES, true)) {
            abort_if($request->has('name') && $request->input('name') !== $channel->name, 422, 'The #general channel cannot be renamed.');
        }

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:64', 'regex:/^[a-z0-9][a-z0-9-]*$/'],
            'type' => ['sometimes', Rule::in(['text', 'voice'])],
            'topic' => ['sometimes', 'nullable', 'string', 'max:500'],
            'position' => ['sometimes', 'integer', 'min:0'],
        ]);

        $channel->update($data);

        return response()->json(['data' => $channel->fresh()]);
    }

    public function destroy(Server $server, Channel $channel): JsonResponse
    {
        $this->ensureChannelBelongsToServer($server, $channel);
        $this->ensureOwnerOrAdmin($server);

        abort_if(in_array($channel->name, self::PROTECTED_CHANNEL_NAMES, true), 422, 'The #general channel cannot be deleted.');

        $channel->delete();

        return response()->json(null, 204);
    }

    private function nextPosition(Server $server): int
    {
        return ((int) $server->channels()->max('position')) + 1;
    }

    private function ensureChannelBelongsToServer(Server $server, Channel $channel): void
    {
        abort_unless((int) $channel->server_id === (int) $server->id, 404, 'Channel not found in this server.');
    }

    private function ensureMember(Server $server): void
    {
        $isMember = $server->members()->whereKey(Auth::id())->exists();
        abort_unless($isMember, 403, 'You are not a member of this server.');
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
