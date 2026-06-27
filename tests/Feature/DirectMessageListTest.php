<?php

namespace Tests\Feature;

use App\Models\DirectMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DirectMessageListTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_returns_user_threads(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $charlie = User::factory()->create();

        DirectMessage::factory()->create(['user_a_id' => $alice->id, 'user_b_id' => $bob->id]);
        DirectMessage::factory()->create(['user_a_id' => $alice->id, 'user_b_id' => $charlie->id]);

        $response = $this->actingAs($alice)->getJson('/api/dms');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }

    public function test_list_excludes_other_users_threads(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $charlie = User::factory()->create();

        DirectMessage::factory()->create(['user_a_id' => $bob->id, 'user_b_id' => $charlie->id]);

        $response = $this->actingAs($alice)->getJson('/api/dms');

        $response->assertStatus(200);
        $this->assertCount(0, $response->json('data'));
    }

    public function test_list_requires_authentication(): void
    {
        $response = $this->getJson('/api/dms');
        $response->assertStatus(401);
    }

    public function test_list_returns_correct_participant(): void
    {
        $alice = User::factory()->create(['name' => 'Alice']);
        $bob = User::factory()->create(['name' => 'Bob', 'display_name' => 'Bob Builder', 'status' => 'online']);

        DirectMessage::factory()->create(['user_a_id' => $alice->id, 'user_b_id' => $bob->id]);

        $response = $this->actingAs($alice)->getJson('/api/dms');

        $response->assertStatus(200);
        $thread = $response->json('data.0');
        $this->assertEquals($bob->id, $thread['participant']['id']);
        $this->assertEquals('Bob', $thread['participant']['name']);
        $this->assertEquals('Bob Builder', $thread['participant']['display_name']);
        $this->assertEquals('online', $thread['participant']['status']);
    }

    public function test_list_ordered_by_last_message(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $charlie = User::factory()->create();

        $oldThread = DirectMessage::factory()->create([
            'user_a_id' => $alice->id,
            'user_b_id' => $bob->id,
            'last_message_at' => now()->subHour(),
        ]);
        $newThread = DirectMessage::factory()->create([
            'user_a_id' => $alice->id,
            'user_b_id' => $charlie->id,
            'last_message_at' => now(),
        ]);

        $response = $this->actingAs($alice)->getJson('/api/dms');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals($newThread->id, $data[0]['id']);
        $this->assertEquals($oldThread->id, $data[1]['id']);
    }
}