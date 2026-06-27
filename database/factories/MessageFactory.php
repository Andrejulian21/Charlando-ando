<?php

namespace Database\Factories;

use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Message>
 */
class MessageFactory extends Factory
{
    protected $model = Message::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'content' => fake()->sentence(),
            'edited_at' => null,
        ];
    }

    public function forServer(\App\Models\Server $server): static
    {
        return $this->state(fn (array $attributes) => [
            'messagable_type' => Server::class,
            'messagable_id' => $server->id,
        ]);
    }

    public function forChannel(Channel $channel): static
    {
        return $this->state(fn (array $attributes) => [
            'messagable_type' => Channel::class,
            'messagable_id' => $channel->id,
        ]);
    }
}
