<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

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
            ->whereRaw('LEAST(user_a_id, user_b_id) = ?', [$lo])
            ->whereRaw('GREATEST(user_a_id, user_b_id) = ?', [$hi])
            ->first();
    }
}
