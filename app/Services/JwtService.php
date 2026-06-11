<?php

namespace App\Services;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use UnexpectedValueException;

/**
 * HS256 JWT issuer/verifier signed with APP_KEY.
 *
 * Token shape:
 *   sub  = user id
 *   name = display name (or name fallback)
 *   iat  = issued at (unix seconds)
 *   exp  = expiration (unix seconds)
 *   jti  = random token id (allows future revocation lists)
 */
class JwtService
{
    private const ALG = 'HS256';

    private const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

    public function generate(User $user, ?int $ttl = null): string
    {
        $now = Carbon::now()->getTimestamp();
        $ttl = $ttl ?? self::DEFAULT_TTL_SECONDS;

        $payload = [
            'sub' => (string) $user->id,
            'name' => $user->display_name ?? $user->name,
            'iat' => $now,
            'exp' => $now + $ttl,
            'jti' => (string) Str::uuid(),
        ];

        return JWT::encode($payload, $this->secret(), self::ALG);
    }

    public function verify(string $token): ?User
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secret(), self::ALG));
        } catch (UnexpectedValueException) {
            return null;
        } catch (\Throwable) {
            return null;
        }

        $sub = $decoded->sub ?? null;
        if (! is_numeric($sub)) {
            return null;
        }

        return User::query()->find((int) $sub);
    }

    /**
     * Decode APP_KEY (Laravel stores it base64-encoded) into the raw bytes used as the
     * HMAC secret. Falls back to the raw env value if it is not base64.
     */
    private function secret(): string
    {
        $key = (string) config('app.key');

        if (Str::startsWith($key, 'base64:')) {
            $decoded = base64_decode(substr($key, 7), true);
            if ($decoded !== false) {
                return $decoded;
            }
        }

        return $key;
    }
}
