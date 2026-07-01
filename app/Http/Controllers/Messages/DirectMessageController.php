<?php

namespace App\Http\Controllers\Messages;

use App\Http\Controllers\Controller;
use App\Models\DirectMessage;
use App\Models\Message;
use App\Models\User;
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

    public function listThreads(Request $request): JsonResponse
    {
        $userId = Auth::id();

        $threads = DirectMessage::query()
            ->where(function ($q) use ($userId) {
                $q->where('user_a_id', $userId)->orWhere('user_b_id', $userId);
            })
            ->with(['userA', 'userB'])
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->get();

        $data = $threads->map(function (DirectMessage $dm) use ($userId) {
            $otherUserId = $dm->otherUserId($userId);
            $otherUser = $otherUserId === $dm->user_a_id ? $dm->userA : $dm->userB;

            return [
                'id' => $dm->id,
                'participant' => [
                    'id' => $otherUser->id,
                    'name' => $otherUser->name,
                    'display_name' => $otherUser->display_name,
                    'avatar_url' => $otherUser->avatar_url,
                    'status' => $otherUser->status,
                ],
                'last_message_at' => $dm->last_message_at?->toIso8601String(),
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function index(Request $request, DirectMessage $dm): JsonResponse
    {
        $this->ensureParticipant($dm);

        $cursor = $request->query('cursor');
        $cursor = is_numeric($cursor) ? (int) $cursor : null;
        $since = $request->query('since');
        $since = is_numeric($since) ? (int) $since : null;

        $query = $dm->messages()->orderByDesc('id');
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
        abort_unless(in_array($userId, [$dm->user_a_id, $dm->user_b_id], true), 403, 'No eres participante de esta conversación.');
    }

    public function createThread(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $authId = Auth::id();
        $targetUserId = (int) $data['user_id'];

        if ($authId === $targetUserId) {
            abort(422, 'No puedes crear un mensaje directo contigo mismo.');
        }

        $existing = DirectMessage::findBetween($authId, $targetUserId);
        $wasRecentlyCreated = false;

        if ($existing === null) {
            $existing = DirectMessage::firstOrCreateBetween($authId, $targetUserId);
            $wasRecentlyCreated = $existing->wasRecentlyCreated;
        }

        $participant = User::query()->findOrFail($targetUserId);

        return response()->json([
            'data' => [
                'id' => $existing->id,
                'participant' => [
                    'id' => $participant->id,
                    'name' => $participant->name,
                    'display_name' => $participant->display_name,
                    'avatar_url' => $participant->avatar_url,
                ],
            ],
        ], $wasRecentlyCreated ? 201 : 200);
    }
}
