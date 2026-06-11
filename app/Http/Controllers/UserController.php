<?php

namespace App\Http\Controllers;

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
}
