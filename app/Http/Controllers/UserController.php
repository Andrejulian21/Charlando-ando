<?php

namespace App\Http\Controllers;

use App\Models\DirectMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/**
 * User self-service endpoints: read the current user, update the
 * editable profile fields (display name, avatar URL, status), and
 * trigger a presence broadcast by writing the new status to the DB.
 */
class UserController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'display_name' => $user->display_name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
                'status' => $user->status,
                'last_seen_at' => $user->last_seen_at?->toIso8601String(),
            ],
        ]);
    }

    public function updateMe(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'display_name' => ['sometimes', 'required', 'string', 'min:2', 'max:32'],
            'avatar_url' => ['sometimes', 'nullable', 'url', 'max:512'],
            'status' => ['sometimes', Rule::in(User::STATUSES)],
        ]);

        $previousStatus = $user->status;
        $user->fill($data)->save();

        // When status changes, publish a PresenceChanged event so every
        // subscribed client updates their member list and avatar dots.
        if (isset($data['status']) && $data['status'] !== $previousStatus) {
            \App\Events\PresenceChanged::dispatch($user, $user->status);
        }

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'display_name' => $user->display_name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
                'status' => $user->status,
            ],
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $query = $request->query('q', '');
        $authId = Auth::id();

        $usersQuery = User::query()
            ->where('id', '!=', $authId);

        if ($query !== '') {
            $term = mb_strtolower($query);
            $usersQuery->where(function ($q) use ($term) {
                $like = '%' . $term . '%';
                $q->whereRaw('LOWER(name) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(display_name) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$like]);
            });
        }

        $users = $usersQuery
            ->orderBy('name')
            ->limit(50)
            ->get(['id', 'name', 'display_name', 'avatar_url']);

        $userIds = $users->pluck('id')->toArray();
        $existingDms = DirectMessage::query()
            ->whereIn('user_a_id', array_merge([$authId], $userIds))
            ->whereIn('user_b_id', array_merge([$authId], $userIds))
            ->get()
            ->filter(fn (DirectMessage $dm) => in_array($dm->otherUserId($authId), $userIds, true))
            ->keyBy(fn (DirectMessage $dm) => $dm->otherUserId($authId));

        $data = $users->map(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'display_name' => $user->display_name,
            'avatar_url' => $user->avatar_url,
            'dm_exists' => $existingDms->has($user->id),
        ])->values();

        return response()->json(['data' => $data]);
    }
}
