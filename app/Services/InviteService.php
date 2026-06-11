<?php

namespace App\Services;

use App\Exceptions\InvalidInviteException;
use App\Models\Invite;
use App\Models\Role;
use App\Models\Server;
use App\Models\ServerMember;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Invite lifecycle: create a code, redeem it into a server_members row.
 *
 * Redemption is wrapped in a DB transaction with a row lock on the invite so
 * two concurrent redemptions cannot both win past the max_uses check or both
 * insert duplicate server_members rows.
 */
class InviteService
{
    private const DEFAULT_TTL_HOURS = 24 * 7; // 7 days
    private const CODE_LENGTH = 16;

    public function create(
        Server $server,
        User $creator,
        ?int $maxUses = null,
        ?Carbon $expiresAt = null,
    ): Invite {
        return DB::transaction(function () use ($server, $creator, $maxUses, $expiresAt) {
            return Invite::query()->create([
                'server_id' => $server->id,
                'creator_id' => $creator->id,
                'code' => $this->uniqueCode(),
                'max_uses' => $maxUses,
                'uses' => 0,
                'expires_at' => $expiresAt ?? Carbon::now()->addHours(self::DEFAULT_TTL_HOURS),
            ]);
        });
    }

    public function redeem(string $code, User $user): ServerMember
    {
        return DB::transaction(function () use ($code, $user) {
            $invite = Invite::query()
                ->where('code', $code)
                ->lockForUpdate()
                ->first();

            if ($invite === null) {
                throw new InvalidInviteException('Invite code not found.');
            }

            if ($invite->isExpired()) {
                throw InvalidInviteException::expired();
            }

            if ($invite->isExhausted()) {
                throw InvalidInviteException::exhausted();
            }

            $invite->increment('uses');

            $memberRoleId = Role::query()
                ->where('server_id', $invite->server_id)
                ->where('level', Role::LEVEL_MEMBER)
                ->value('id');

            return ServerMember::query()->firstOrCreate(
                [
                    'server_id' => $invite->server_id,
                    'user_id' => $user->id,
                ],
                [
                    'role_id' => $memberRoleId,
                    'joined_at' => Carbon::now(),
                ],
            );
        });
    }

    private function uniqueCode(): string
    {
        // Str::random uses [A-Za-z0-9]; retry on the (vanishingly rare) collision.
        for ($i = 0; $i < 5; $i++) {
            $code = Str::random(self::CODE_LENGTH);
            if (! Invite::query()->where('code', $code)->exists()) {
                return $code;
            }
        }

        // Fallback: append a millisecond timestamp suffix.
        return Str::random(self::CODE_LENGTH - 6).now()->format('His');
    }
}
