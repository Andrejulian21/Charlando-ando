<?php

namespace App\Http\Controllers\Messages;

use App\Http\Controllers\Controller;
use App\Models\DirectMessage;
use App\Models\Message;
use App\Events\MessageSent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Direct-message thread message list and create. Mirrors MessageController
 * but anchored to a DirectMessage row so the route model binding is the
 * membership check.
 *
 * Cursor pagination contract is identical: `?cursor=N` returns up to 50
 * messages with id < N, ordered DESC. `next_cursor` is null when fewer
 * than the limit was returned.
 */
class DirectMessageController extends Controller
{
    private const PAGE_SIZE = 50;

    public function index(Request $request, DirectMessage $dm): JsonResponse
    {
        $this->ensureParticipant($dm);

        $cursor = $request->query('cursor');
        $cursor = is_numeric($cursor) ? (int) $cursor : null;

        $query = $dm->messages()->orderByDesc('id');
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

    public function store(Request $request, DirectMessage $dm): JsonResponse
    {
        $this->ensureParticipant($dm);

        $data = $request->validate([
            'content' => ['required', 'string', 'max:4000'],
        ]);

        $message = new Message([
            'user_id' => Auth::id(),
            'content' => $data['content'],
        ]);
        $message->messagable()->associate($dm);
        $message->save();

        $dm->forceFill(['last_message_at' => $message->created_at ?? now()])->save();

        MessageSent::dispatch($message);

        return response()->json(['data' => $message], 201);
    }

    private function ensureParticipant(DirectMessage $dm): void
    {
        $userId = Auth::id();
        abort_unless(in_array($userId, [$dm->user_a_id, $dm->user_b_id], true), 403, 'You are not a participant in this conversation.');
    }
}
