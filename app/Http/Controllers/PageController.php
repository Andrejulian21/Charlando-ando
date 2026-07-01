<?php

namespace App\Http\Controllers;

use App\Models\Channel;
use App\Models\Server;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Renders the SPA shell pages. Each action hands off to Inertia::render with the
 * route parameters as props so the React side can fetch the matching domain data
 * (servers, channels, DMs, settings) through the API. The actual page components
 * live in resources/js/pages/ and are resolved by the Inertia client loader.
 */
class PageController extends Controller
{
    private const MESSAGE_PAGE_SIZE = 50;

    public function login(): Response
    {
        return Inertia::render('Auth/Login', [
            'devLogin' => true,
        ]);
    }

    public function chatIndex(Request $request): Response
    {
        $userId = $request->user()->getAuthIdentifier();

        $servers = Server::query()
            ->whereHas('members', fn ($q) => $q->where('users.id', $userId))
            ->with(['channels' => fn ($q) => $q->orderBy('position')->orderBy('id')])
            ->orderBy('name')
            ->get();

        $publicServers = Server::query()
            ->where('is_public', true)
            ->whereDoesntHave('members', fn ($q) => $q->where('users.id', $userId))
            ->with('owner:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'icon_url', 'owner_id']);

        $threads = \App\Models\DirectMessage::query()
            ->where(function ($q) use ($userId) {
                $q->where('user_a_id', $userId)->orWhere('user_b_id', $userId);
            })
            ->with([
                'userA:id,name,display_name,avatar_url,status',
                'userB:id,name,display_name,avatar_url,status',
            ])
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->limit(10)
            ->get();

        return Inertia::render('Chat/Index', [
            'servers' => $servers,
            'publicServers' => $publicServers,
            'threads' => $threads,
            'currentUserId' => $userId,
        ]);
    }

    public function chatShow(Request $request, Server $server): Response
    {
        $this->ensureMember($request, $server);

        $userId = $request->user()->getAuthIdentifier();

        // Load the first channel and its messages
        $channel = $server->channels()->orderBy('position')->orderBy('id')->first();

        // Load channels separately (for sidebar) and members separately (for member list).
        // We avoid passing the full Server model to prevent Eloquent relation metadata
        // (pivot, counts, etc.) from leaking into the Inertia props.
        $serverChannels = $server->channels()
            ->orderBy('position')
            ->orderBy('id')
            ->get(['id', 'server_id', 'name', 'type', 'topic', 'position', 'created_at', 'updated_at']);

        $members = $server->members()
            ->select(['users.id', 'users.name', 'users.display_name', 'users.avatar_url', 'users.status'])
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'display_name' => $user->display_name,
                'avatar_url' => $user->avatar_url,
                'status' => $user->status,
            ]);

        $messages = $channel
            ? $channel->messages()->orderByDesc('id')->limit(self::MESSAGE_PAGE_SIZE + 1)->get(['id', 'user_id', 'content', 'edited_at', 'created_at'])
            : collect();

        $hasMore = $messages->count() > self::MESSAGE_PAGE_SIZE;
        if ($hasMore) {
            $messages = $messages->take(self::MESSAGE_PAGE_SIZE);
        }

        $channelData = $channel ? ['id' => $channel->id, 'name' => $channel->name, 'type' => $channel->type] : null;

        $userServers = Server::query()
            ->whereHas('members', fn ($q) => $q->where('users.id', $userId))
            ->whereKeyNot($server->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon_url']);

        // Build a plain-array server so Inertia never serializes an Eloquent model
        // with its internal relation metadata (pivot, counts, etc.).
        $serverData = [
            'id' => $server->id,
            'owner_id' => $server->owner_id,
            'name' => $server->name,
            'icon_url' => $server->icon_url,
            'description' => $server->description,
            'is_public' => $server->is_public,
            'created_at' => $server->created_at?->toIso8601String(),
            'updated_at' => $server->updated_at?->toIso8601String(),
            'channels' => $serverChannels,
            'members' => $members,
        ];

        return Inertia::render('Chat/Show', [
            'server' => $serverData,
            'channel' => $channelData,
            'messages' => $messages->values()->all(),
            'nextCursor' => $hasMore ? (int) $messages->last()->id : null,
            'members' => $members->all(),
            'otherServers' => $userServers->all(),
        ]);
    }

    public function chatChannelShow(Request $request, Server $server, Channel $channel): Response
    {
        abort_unless((int) $channel->server_id === (int) $server->id, 404);
        $this->ensureMember($request, $server);

        $userId = $request->user()->getAuthIdentifier();

        $messages = $channel->messages()
            ->orderByDesc('id')
            ->limit(self::MESSAGE_PAGE_SIZE + 1)
            ->get(['id', 'user_id', 'content', 'edited_at', 'created_at']);

        $hasMore = $messages->count() > self::MESSAGE_PAGE_SIZE;
        if ($hasMore) {
            $messages = $messages->take(self::MESSAGE_PAGE_SIZE);
        }

        // Build channel/server data as plain arrays to avoid Eloquent metadata leaking.
        $serverChannels = $server->channels()
            ->orderBy('position')
            ->orderBy('id')
            ->get(['id', 'server_id', 'name', 'type', 'topic', 'position', 'created_at', 'updated_at']);

        $members = $server->members()
            ->select(['users.id', 'users.name', 'users.display_name', 'users.avatar_url', 'users.status'])
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'display_name' => $user->display_name,
                'avatar_url' => $user->avatar_url,
                'status' => $user->status,
            ]);

        $userServers = Server::query()
            ->whereHas('members', fn ($q) => $q->where('users.id', $userId))
            ->whereKeyNot($server->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon_url']);

        $serverData = [
            'id' => $server->id,
            'owner_id' => $server->owner_id,
            'name' => $server->name,
            'icon_url' => $server->icon_url,
            'description' => $server->description,
            'is_public' => $server->is_public,
            'created_at' => $server->created_at?->toIso8601String(),
            'updated_at' => $server->updated_at?->toIso8601String(),
            'channels' => $serverChannels,
            'members' => $members,
        ];

        return Inertia::render('Chat/Show', [
            'server' => $serverData,
            'channel' => ['id' => $channel->id, 'name' => $channel->name, 'type' => $channel->type],
            'messages' => $messages->values()->all(),
            'nextCursor' => $hasMore ? (int) $messages->last()->id : null,
            'members' => $members->all(),
            'otherServers' => $userServers->all(),
        ]);
    }

    public function dmsIndex(Request $request): Response
    {
        $userId = $request->user()->getAuthIdentifier();

        // All DM threads the user participates in, ordered by recency.
        $threads = \App\Models\DirectMessage::query()
            ->where(function ($q) use ($userId) {
                $q->where('user_a_id', $userId)->orWhere('user_b_id', $userId);
            })
            ->with([
                'userA:id,name,display_name,avatar_url,status',
                'userB:id,name,display_name,avatar_url,status',
            ])
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->limit(50)
            ->get();

        $servers = $this->userServers($userId);

        return Inertia::render('Dms/Index', [
            'threads' => $threads,
            'currentUserId' => $userId,
            'servers' => $servers,
        ]);
    }

    public function dmsShow(Request $request, \App\Models\DirectMessage $dm): Response
    {
        $userId = $request->user()->getAuthIdentifier();
        abort_unless(in_array($userId, [$dm->user_a_id, $dm->user_b_id], true), 403);

        $messages = $dm->messages()
            ->orderByDesc('id')
            ->limit(self::MESSAGE_PAGE_SIZE + 1)
            ->get(['id', 'user_id', 'content', 'edited_at', 'created_at']);

        $hasMore = $messages->count() > self::MESSAGE_PAGE_SIZE;
        if ($hasMore) {
            $messages = $messages->take(self::MESSAGE_PAGE_SIZE);
        }

        $dm->load([
            'userA:id,name,display_name,avatar_url,status',
            'userB:id,name,display_name,avatar_url,status',
        ]);

        $threads = \App\Models\DirectMessage::query()
            ->where(function ($q) use ($userId) {
                $q->where('user_a_id', $userId)->orWhere('user_b_id', $userId);
            })
            ->with([
                'userA:id,name,display_name,avatar_url,status',
                'userB:id,name,display_name,avatar_url,status',
            ])
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->limit(50)
            ->get();

        // Pre-compute the other participant so the frontend doesn't need
        // to resolve snake_case vs camelCase relation names.
        $otherUserId = $dm->otherUserId($userId);
        $otherUser = $otherUserId === $dm->user_a_id ? $dm->userA : $dm->userB;

        $servers = $this->userServers($userId);

        return Inertia::render('Dms/Show', [
            'dm' => $dm,
            'otherUser' => $otherUser ? $otherUser->toArray() : null,
            'messages' => $messages->values(),
            'nextCursor' => $hasMore ? (int) $messages->last()->id : null,
            'currentUserId' => $userId,
            'threads' => $threads,
            'servers' => $servers,
        ]);
    }

    public function settingsIndex(Request $request): Response
    {
        $user = $request->user();
        $userId = $user->getAuthIdentifier();

        $servers = Server::query()
            ->whereHas('members', fn ($q) => $q->where('users.id', $userId))
            ->orderBy('name')
            ->get(['id', 'name', 'icon_url', 'owner_id']);

        return Inertia::render('Settings/Index', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'display_name' => $user->display_name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
                'status' => $user->status,
            ],
            'servers' => $servers,
        ]);
    }

    public function settingsServer(Request $request, Server $server): Response
    {
        $this->ensureMember($request, $server);
        $userId = $request->user()->getAuthIdentifier();

        $server->load([
            'channels' => fn ($q) => $q->orderBy('position')->orderBy('id'),
            'roles',
            'members:id,name,display_name,avatar_url,status',
            'invites' => fn ($q) => $q->orderByDesc('created_at'),
        ]);

        $servers = Server::query()
            ->whereHas('members', fn ($q) => $q->where('users.id', $userId))
            ->orderBy('name')
            ->get(['id', 'name', 'icon_url', 'owner_id']);

        return Inertia::render('Settings/ServerShow', [
            'server' => $server,
            'servers' => $servers,
        ]);
    }

    private function ensureMember(Request $request, Server $server): void
    {
        $userId = $request->user()->getAuthIdentifier();
        $isMember = $server->members()->whereKey($userId)->exists();
        abort_unless($isMember, 403, 'No eres miembro de este servidor.');
    }

    private function userServers(int $userId): \Illuminate\Database\Eloquent\Collection
    {
        return \App\Models\Server::query()
            ->whereHas('members', fn ($q) => $q->where('users.id', $userId))
            ->orderBy('name')
            ->get(['id', 'name', 'icon_url']);
    }
}
