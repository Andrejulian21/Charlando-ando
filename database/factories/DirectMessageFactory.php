<?php

namespace Database\Factories;

use App\Models\DirectMessage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DirectMessage>
 */
class DirectMessageFactory extends Factory
{
    protected $model = DirectMessage::class;

    public function definition(): array
    {
        return [
            'user_a_id' => User::factory(),
            'user_b_id' => User::factory(),
            'last_message_at' => now(),
        ];
    }
}