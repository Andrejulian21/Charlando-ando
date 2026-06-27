<?php

namespace App\Events;

use App\Models\Channel;
use App\Models\DirectMessage;
use App\Models\Message;
use App\Models\Server;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;

/**
 * Fired when a message is persisted to a channel or direct-message thread.
 *
 * The Laravel broadcasting subsystem is intentionally bypassed: instead of
 * routing through the configured broadcaster (which is `log` in development),
 * this event publishes a JSON envelope directly to the Redis `events` channel
 * that the Socket.io sidecar is subscribed to. The envelope shape is:
 *
 *   { "event": "message:new", "room": "channel:42", "data": { ... } }
 *
 * The sidecar maps `room` to a Socket.io room and emits `event` with `data`.
 */
class MessageSent implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public const EVENT_NAME = 'message:new';

    public function __construct(public Message $message)
    {
        $this->message->loadMissing('user:id,name,display_name,avatar_url,status');
    }

    /**
     * Rooms the broadcaster would target. We override `broadcast()` below so
     * this only matters for any tooling that introspects the event.
     *
     * @return array<int, string>
     */
    public function broadcastOn(): array
    {
        $room = $this->room();
        return $room === '' ? [] : [$room];
    }

    /**
     * The payload delivered to clients. The `room` is included so the
     * sidecar and any future consumer can route without re-deriving it.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $user = $this->message->user;

        return [
            'id' => $this->message->id,
            'room' => $this->room(),
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'display_name' => $user->display_name,
                'avatar_url' => $user->avatar_url,
            ] : null,
            'content' => $this->message->content,
            'edited_at' => $this->message->edited_at?->toIso8601String(),
            'created_at' => $this->message->created_at?->toIso8601String(),
        ];
    }

    /**
     * Skip Laravel's broadcaster pipeline and publish straight to the Redis
     * `events` channel that the Socket.io sidecar subscribes to.
     */
    public function broadcast($connection = null): void
    {
        $room = $this->room();
        if ($room === '') {
            return;
        }

        Redis::publish('events', json_encode([
            'event' => self::EVENT_NAME,
            'room' => $room,
            'data' => $this->broadcastWith(),
        ], JSON_THROW_ON_ERROR));
    }

    private function room(): string
    {
        $type = $this->message->messagable_type;
        $id = $this->message->messagable_id;

        return match ($type) {
            Channel::class => "channel:{$id}",
            DirectMessage::class => "dm:{$id}",
            Server::class => "server:{$id}",
            default => '',
        };
    }
}
