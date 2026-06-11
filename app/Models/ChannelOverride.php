<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ChannelOverride extends Model
{
    /** @use HasFactory<\Database\Factories\ChannelOverrideFactory> */
    use HasFactory;

    public const TYPE_ALLOW = 'allow';
    public const TYPE_DENY = 'deny';

    protected $fillable = [
        'channel_id',
        'role_id',
    ];

    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'channel_override_permission')
            ->withPivot('type');
    }
}
