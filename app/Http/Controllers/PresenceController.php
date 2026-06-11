<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PresenceController extends Controller
{
    /**
     * Called by the Socket.io sidecar when a user disconnects.
     * Updates last_seen_at and sets status to offline.
     *
     * Authenticated via a shared secret (SIDECAR_SECRET env var)
     * so only the sidecar can call this endpoint.
     */
    public function disconnect(Request $request): JsonResponse
    {
        $this->validateSidecarSecret($request);

        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        User::where('id', $request->input('user_id'))->update([
            'status' => 'offline',
            'last_seen_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    private function validateSidecarSecret(Request $request): void
    {
        $expected = config('services.sidecar.secret');

        if (empty($expected)) {
            abort(503, 'Sidecar secret not configured');
        }

        $provided = $request->header('X-Sidecar-Secret');

        if (! hash_equals($expected, (string) $provided)) {
            abort(403, 'Invalid sidecar secret');
        }
    }
}
