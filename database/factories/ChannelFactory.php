<?php

namespace Database\Factories;

use App\Models\Channel;
use App\Models\Server;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Channel>
 */
class ChannelFactory extends Factory
{
    protected $model = Channel::class;

    public function definition(): array
    {
        return [
            'server_id' => Server::factory(),
            'name' => fake()->unique()->word(),
            'type' => 'text',
            'topic' => fake()->optional()->sentence(),
            'position' => 0,
        ];
    }
}
