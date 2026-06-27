<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\DB;

class DirectMessage extends Model
{
    /** @use HasFactory<\Database\Factories\DirectMessageFactory> */
    use HasFactory;

    protected $fillable = [
        'user_a_id',
        'user_b_id',
        'last_message_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    public function userA(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_a_id');
    }

    public function userB(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_b_id');
    }

    public function messages(): MorphMany
    {
        return $this->morphMany(Message::class, 'messagable');
    }

    public static function findBetween(int $userIdA, int $userIdB): ?self
    {
        $lo = min($userIdA, $userIdB);
        $hi = max($userIdA, $userIdB);

        return self::query()
            ->where('user_a_id', $lo)
            ->where('user_b_id', $hi)
            ->first();
    }

    /** @alias of findBetween */
    public static function threadBetween(int $userIdA, int $userIdB): ?self
    {
        return self::findBetween($userIdA, $userIdB);
    }

    /**
     * Return the ID of the other participant given one participant's ID.
     */
    public function otherUserId(int $userId): int
    {
        return $userId === $this->user_a_id ? $this->user_b_id : $this->user_a_id;
    }

    /**
     * Find or create a DM thread between two user IDs, with a transaction
     * to prevent duplicate creation under race conditions.
     */
    public static function firstOrCreateBetween(int $userIdA, int $userIdB): self
    {
        if ($userIdA === $userIdB) {
            abort(422, 'Cannot create a direct message with yourself.');
        }

        $existing = self::findBetween($userIdA, $userIdB);
        if ($existing !== null) {
            return $existing;
        }

        return DB::transaction(function () use ($userIdA, $userIdB) {
            $lo = min($userIdA, $userIdB);
            $hi = max($userIdA, $userIdB);

            $dm = self::query()->create([
                'user_a_id' => $lo,
                'user_b_id' => $hi,
            ]);
            $dm->wasRecentlyCreated = true;

            return $dm;
        });
    }
}
