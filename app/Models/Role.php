<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    /** @use HasFactory<\Database\Factories\RoleFactory> */
    use HasFactory;

    public const LEVEL_OWNER = 100;
    public const LEVEL_ADMIN = 80;
    public const LEVEL_MODERATOR = 60;
    public const LEVEL_MEMBER = 40;

    protected $fillable = [
        'server_id',
        'name',
        'level',
        'color',
    ];

    protected $casts = [
        'level' => 'integer',
    ];

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permission');
    }

    public function serverMembers(): HasMany
    {
        return $this->hasMany(ServerMember::class);
    }

    public function channelOverrides(): HasMany
    {
        return $this->hasMany(ChannelOverride::class);
    }
}
