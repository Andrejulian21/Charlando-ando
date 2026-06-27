<?php

namespace Database\Factories;

use App\Models\Server;
use App\Models\ServerMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServerMember>
 */
class ServerMemberFactory extends Factory
{
    protected $model = ServerMember::class;

    public function definition(): array
    {
        return [
            'server_id' => Server::factory(),
            'user_id' => User::factory(),
            'role_id' => null,
            'nickname' => null,
            'joined_at' => now(),
        ];
    }
}
