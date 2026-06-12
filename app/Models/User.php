<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    public const STATUS_ONLINE = 'online';
    public const STATUS_IDLE = 'idle';
    public const STATUS_DND = 'dnd';
    public const STATUS_INVISIBLE = 'invisible';

    public const STATUSES = [
        self::STATUS_ONLINE,
        self::STATUS_IDLE,
        self::STATUS_DND,
        self::STATUS_INVISIBLE,
    ];

    protected $fillable = [
        'name',
        'display_name',
        'email',
        'password',
        'provider',
        'provider_id',
        'avatar_url',
        'status',
        'last_seen_at',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function serverMemberships(): HasMany
    {
        return $this->hasMany(ServerMember::class);
    }

    public function servers(): BelongsToMany
    {
        return $this->belongsToMany(Server::class, 'server_members')
            ->withPivot(['role_id', 'nickname', 'joined_at'])
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
