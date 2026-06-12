<?php

namespace Tests\Feature;

use App\Models\DirectMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DirectMessageCreationTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_dm_requires_authentication(): void
    {
        $alice = User::factory()->create();
        $response = $this->postJson('/api/dms', ['user_id' => $alice->id]);
        $response->assertStatus(401);
    }

    public function test_creating_dm_creates_new_thread(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $response = $this->actingAs($alice)->postJson('/api/dms', ['user_id' => $bob->id]);
        $response->assertStatus(201);

        $data = $response->json('data');
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('participant', $data);
        $this->assertEquals($bob->id, $data['participant']['id']);

        $this->assertDatabaseHas('direct_messages', [
            'id' => $data['id'],
        ]);
    }

    public function test_creating_dm_returns_existing_thread(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $existing = DirectMessage::factory()->create([
            'user_a_id' => $alice->id,
            'user_b_id' => $bob->id,
        ]);

        $response = $this->actingAs($alice)->postJson('/api/dms', ['user_id' => $bob->id]);
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertEquals($existing->id, $data['id']);
        $this->assertEquals($bob->id, $data['participant']['id']);

        // Verify no duplicate was created
        $this->assertEquals(1, DirectMessage::count());
    }

    public function test_creating_dm_works_in_reverse_direction(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        // Bob initiates DM with alice
        $response = $this->actingAs($bob)->postJson('/api/dms', ['user_id' => $alice->id]);
        $response->assertStatus(201);

        $data = $response->json('data');
        $this->assertEquals($alice->id, $data['participant']['id']);
    }

    public function test_dm_response_includes_participant_info(): void
    {
        $alice = User::factory()->create(['name' => 'Alice', 'display_name' => 'Alice Wonder', 'email' => 'alice@test.com']);
        $bob = User::factory()->create(['name' => 'Bob', 'display_name' => 'Bob Builder', 'email' => 'bob@test.com']);

        $response = $this->actingAs($alice)->postJson('/api/dms', ['user_id' => $bob->id]);
        $response->assertStatus(201);

        $participant = $response->json('data.participant');
        $this->assertEquals($bob->id, $participant['id']);
        $this->assertEquals('Bob', $participant['name']);
        $this->assertEquals('Bob Builder', $participant['display_name']);
    }

    public function test_cannot_create_dm_with_self(): void
    {
        $alice = User::factory()->create();

        $response = $this->actingAs($alice)->postJson('/api/dms', ['user_id' => $alice->id]);
        $response->assertStatus(422);
    }

    public function test_create_dm_validates_user_exists(): void
    {
        $alice = User::factory()->create();

        $response = $this->actingAs($alice)->postJson('/api/dms', ['user_id' => 99999]);
        $response->assertStatus(422);
    }
}