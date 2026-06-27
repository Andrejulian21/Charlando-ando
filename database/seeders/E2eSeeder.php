<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Server;
use App\Models\Channel;
use App\Models\Message;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class E2eSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'e2e@test.com',
            'password' => Hash::make('password'),
        ]);

        $server = Server::factory()->create([
            'name' => 'E2E Test Server',
            'owner_id' => $user->id,
        ]);

        $server->members()->attach($user->id);

        $channel = Channel::factory()->create([
            'server_id' => $server->id,
            'name' => 'general',
        ]);

        Message::factory()
            ->count(3)
            ->forChannel($channel)
            ->create(['user_id' => $user->id]);
    }
}