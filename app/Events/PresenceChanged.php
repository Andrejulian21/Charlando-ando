<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;

/**
 * Fired when a user's online status changes (online, idle, dnd, invisible,
 * offline). Like MessageSent, this publishes straight to the Redis `events`
 * channel so the Socket.io sidecar can fan it out to interested rooms.
 *
 * The `room` for a presence update is the user themself — the sidecar uses
 * its `user:{id}` room to sync the user's other devices, plus publishes a
 * secondary `presence` envelope that other sidecar instances consume to
 * forward the change to shared channel / DM rooms.
 */
class PresenceChanged implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public const EVENT_NAME = 'presence:update';

    public function __construct(
        public User $user,
        public string $status,
    ) {
    }

    /**
     * @return array<int, string>
     */
    public function broadcastOn(): array
    {
        return ["user:{$this->user->id}"];
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->user->id,
            'status' => $this->status,
            'at' => now()->toIso8601String(),
        ];
    }

    public function broadcast($connection = null): void
    {
        Redis::publish('events', json_encode([
            'event' => self::EVENT_NAME,
            'room' => "user:{$this->user->id}",
            'data' => $this->broadcastWith(),
        ], JSON_THROW_ON_ERROR));
    }
}
