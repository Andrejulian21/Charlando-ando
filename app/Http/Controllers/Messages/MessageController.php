<?php

namespace App\Http\Controllers\Messages;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\Message;
use App\Models\Server;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Channel message list and create. Messages use the polymorphic `messagable`
 * relation (Channel|Server|DirectMessage). The HTTP shape is anchored to a
 * server+channel route so membership and channel scoping happen in route model
 * binding before any data is touched.
 *
 * Cursor pagination:
 *   - If `?cursor=N` is supplied, return up to 50 messages with id < N,
 *     ordered by id DESC.
 *   - The first page is `?cursor=<latest id>` or, more typically, an unset
 *     cursor (returns the most recent 50). `next_cursor` is null when fewer
 *     than the limit was returned, so the client can stop scrolling.
 */
class MessageController extends Controller
{
    private const PAGE_SIZE = 50;

    public function index(Request $request, Server $server, Channel $channel): JsonResponse
    {
        $this->ensureChannelBelongsToServer($server, $channel);
        $this->ensureMember($server);

        $cursor = $request->query('cursor');
        $cursor = is_numeric($cursor) ? (int) $cursor : null;
        $since = $request->query('since');
        $since = is_numeric($since) ? (int) $since : null;

        $query = $channel->messages()->orderByDesc('id');
        if ($cursor !== null) {
            $query->where('id', '<', $cursor);
        }
        if ($since !== null) {
            $query->where('id', '>', $since);
        }

        $messages = $query->limit(self::PAGE_SIZE + 1)->get(['id', 'user_id', 'content', 'edited_at', 'created_at']);
        $hasMore = $messages->count() > self::PAGE_SIZE;
        if ($hasMore) {
            $messages = $messages->take(self::PAGE_SIZE);
        }

        return response()->json([
            'data' => $messages->values(),
            'next_cursor' => $hasMore ? (int) $messages->last()->id : null,
        ]);
    }

    public function store(Request $request, Server $server, Channel $channel): JsonResponse
    {
        $this->ensureChannelBelongsToServer($server, $channel);
        $this->ensureMember($server);

        $data = $request->validate([
            'content' => ['required', 'string', 'max:4000'],
        ]);

        $message = new Message([
            'user_id' => Auth::id(),
            'content' => $data['content'],
        ]);
        $message->messagable()->associate($channel);
        $message->save();

        // Real-time fan-out: the event publishes a JSON envelope to the Redis
        // `events` channel that the Socket.io sidecar subscribes to.
        MessageSent::dispatch($message);

        return response()->json(['data' => $message], 201);
    }

    public function indexForServer(Request $request, Server $server): JsonResponse
    {
        $this->ensureMember($server);

        $cursor = $request->query('cursor');
        $cursor = is_numeric($cursor) ? (int) $cursor : null;

        $query = $server->messages()->orderByDesc('id');
        if ($cursor !== null) {
            $query->where('id', '<', $cursor);
        }

        $messages = $query->limit(self::PAGE_SIZE + 1)->get(['id', 'user_id', 'content', 'edited_at', 'created_at']);
        $hasMore = $messages->count() > self::PAGE_SIZE;
        if ($hasMore) {
            $messages = $messages->take(self::PAGE_SIZE);
        }

        return response()->json([
            'data' => $messages->values(),
            'next_cursor' => $hasMore ? (int) $messages->last()->id : null,
        ]);
    }

    public function storeForServer(Request $request, Server $server): JsonResponse
    {
        $this->ensureMember($server);

        $data = $request->validate([
            'content' => ['required', 'string', 'max:4000'],
        ]);

        $message = new Message([
            'user_id' => Auth::id(),
            'content' => $data['content'],
        ]);
        $message->messagable()->associate($server);
        $message->save();

        MessageSent::dispatch($message);

        return response()->json(['data' => $message], 201);
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
}
