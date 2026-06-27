<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Channel extends Model
{
    /** @use HasFactory<\Database\Factories\ChannelFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'server_id',
        'name',
        'type',
        'topic',
        'position',
    ];

    protected $casts = [
        'position' => 'integer',
    ];

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    public function overrides(): HasMany
    {
        return $this->hasMany(ChannelOverride::class);
    }

    public function messages(): MorphMany
    {
        return $this->morphMany(Message::class, 'messagable');
    }
}
