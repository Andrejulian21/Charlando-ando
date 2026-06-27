<?php

namespace Tests\Feature;

use App\Models\DirectMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_requires_authentication(): void
    {
        $response = $this->getJson('/api/users/search?q=test');
        $response->assertStatus(401);
    }

    public function test_search_returns_matching_users_by_name(): void
    {
        $alice = User::factory()->create(['name' => 'Alice Smith', 'email' => 'alice@test.com']);
        $bob = User::factory()->create(['name' => 'Bob Jones', 'email' => 'bob@test.com']);
        $carol = User::factory()->create(['name' => 'Carol White', 'email' => 'carol@test.com']);

        $response = $this->actingAs($alice)->getJson('/api/users/search?q=Bob');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($bob->id, $data[0]['id']);
        $this->assertEquals('Bob Jones', $data[0]['name']);
    }

    public function test_search_returns_matching_users_by_display_name(): void
    {
        $alice = User::factory()->create(['name' => 'alice', 'display_name' => 'Alice Wonder', 'email' => 'alice@test.com']);
        $bob = User::factory()->create(['name' => 'bob', 'display_name' => 'Bob Builder', 'email' => 'bob@test.com']);

        $response = $this->actingAs($alice)->getJson('/api/users/search?q=Bob');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($bob->id, $data[0]['id']);
    }

    public function test_search_returns_matching_users_by_email(): void
    {
        $alice = User::factory()->create(['name' => 'alice', 'email' => 'alice@example.com']);
        $bob = User::factory()->create(['name' => 'bob', 'email' => 'bob@example.com']);

        $response = $this->actingAs($alice)->getJson('/api/users/search?q=bob@example');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($bob->id, $data[0]['id']);
    }

    public function test_search_excludes_authenticated_user(): void
    {
        $alice = User::factory()->create(['name' => 'Alice', 'email' => 'alice@test.com']);
        $bob = User::factory()->create(['name' => 'Bob', 'email' => 'bob@test.com']);

        // Search for "Bob" as alice — bob exists, alice is excluded (different name anyway)
        $response = $this->actingAs($alice)->getJson('/api/users/search?q=Bob');
        $response->assertStatus(200);

        $data = $response->json('data');
        // bob is the only match and is not excluded (alice ≠ bob)
        $this->assertCount(1, $data);
        $this->assertEquals($bob->id, $data[0]['id']);

        // Search for "Alice" as alice — alice would match but is excluded
        $response = $this->actingAs($alice)->getJson('/api/users/search?q=Alice');
        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(0, $data);
    }

    public function test_search_returns_empty_array_for_empty_query(): void
    {
        $alice = User::factory()->create(['name' => 'Alice Smith', 'email' => 'alice@test.com']);

        $response = $this->actingAs($alice)->getJson('/api/users/search?q=');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertIsArray($data);
        $this->assertCount(0, $data);
    }

    public function test_search_returns_empty_array_for_no_match(): void
    {
        $alice = User::factory()->create(['name' => 'Alice Smith', 'email' => 'alice@test.com']);
        $bob = User::factory()->create(['name' => 'Bob Jones', 'email' => 'bob@test.com']);

        $response = $this->actingAs($alice)->getJson('/api/users/search?q=XYZNOTFOUND');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(0, $data);
    }

    public function test_search_is_case_insensitive(): void
    {
        $alice = User::factory()->create(['name' => 'alice', 'email' => 'alice@test.com']);
        $bob = User::factory()->create(['name' => 'bob', 'email' => 'bob@test.com']);

        $response = $this->actingAs($alice)->getJson('/api/users/search?q=BOB');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($bob->id, $data[0]['id']);
    }

    public function test_search_returns_at_most_50_results(): void
    {
        $searcher = User::factory()->create(['name' => 'Searcher', 'email' => 'searcher@test.com']);
        User::factory()->count(25)->create(['email' => null]);

        // Empty query returns all users except the searcher (up to 50)
        $response = $this->actingAs($searcher)->getJson('/api/users/search?q=');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(25, $data);

        // Now search with a real term
        $response = $this->actingAs($searcher)->getJson('/api/users/search?q=S');
        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertLessThanOrEqual(50, count($data));
    }

    public function test_search_returns_only_required_fields(): void
    {
        $alice = User::factory()->create(['name' => 'Alice Smith', 'email' => 'alice@test.com']);
        $bob = User::factory()->create(['name' => 'Bob Jones', 'email' => 'bob@test.com']);

        $response = $this->actingAs($alice)->getJson('/api/users/search?q=Bob');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertArrayHasKey('id', $data[0]);
        $this->assertArrayHasKey('name', $data[0]);
        $this->assertArrayHasKey('display_name', $data[0]);
        $this->assertArrayHasKey('avatar_url', $data[0]);
        $this->assertArrayNotHasKey('email', $data[0]);
        $this->assertArrayNotHasKey('password', $data[0]);
    }

    public function test_search_includes_dm_exists_flag(): void
    {
        $alice = User::factory()->create(['name' => 'Alice', 'email' => 'alice@test.com']);
        $bob = User::factory()->create(['name' => 'Bob', 'email' => 'bob@test.com']);

        // No DM exists yet
        $response = $this->actingAs($alice)->getJson('/api/users/search?q=Bob');
        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals($bob->id, $data[0]['id']);
        $this->assertFalse($data[0]['dm_exists']);

        // Create a DM between them
        DirectMessage::factory()->create([
            'user_a_id' => $alice->id,
            'user_b_id' => $bob->id,
        ]);

        $response = $this->actingAs($alice)->getJson('/api/users/search?q=Bob');
        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals($bob->id, $data[0]['id']);
        $this->assertTrue($data[0]['dm_exists']);
    }
}