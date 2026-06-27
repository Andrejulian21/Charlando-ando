<?php

namespace Tests\Feature;

use App\Models\Server;
use App\Models\ServerMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicGroupDirectoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_authentication(): void
    {
        $response = $this->getJson('/api/servers?filter=public');
        $response->assertStatus(401);
    }

    public function test_shows_unjoined_public_servers(): void
    {
        $user = User::factory()->create();

        $server1 = Server::factory()->public()->create(['name' => 'Server Alpha']);
        $server2 = Server::factory()->public()->create(['name' => 'Server Beta']);

        // User is member of server1 but not server2
        ServerMember::factory()->create([
            'server_id' => $server1->id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->getJson('/api/servers?filter=public');

        $response->assertStatus(200);
        $data = $response->json('data');

        // Should show server2 (unjoined) but not server1 (joined)
        $this->assertCount(1, $data);
        $this->assertEquals($server2->id, $data[0]['id']);
    }

    public function test_hides_joined_servers(): void
    {
        $user = User::factory()->create();

        $server = Server::factory()->public()->create();

        ServerMember::factory()->create([
            'server_id' => $server->id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->getJson('/api/servers?filter=public');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(0, $data);
    }

    public function test_hides_private_servers(): void
    {
        $user = User::factory()->create();

        Server::factory()->private()->create(); // is_public = false

        $response = $this->actingAs($user)->getJson('/api/servers?filter=public');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(0, $data);
    }

    public function test_includes_member_count(): void
    {
        $user = User::factory()->create();

        $server = Server::factory()->public()->create();

        // Create 3 members
        $member1 = User::factory()->create();
        $member2 = User::factory()->create();
        $member3 = User::factory()->create();

        ServerMember::factory()->create(['server_id' => $server->id, 'user_id' => $member1->id]);
        ServerMember::factory()->create(['server_id' => $server->id, 'user_id' => $member2->id]);
        ServerMember::factory()->create(['server_id' => $server->id, 'user_id' => $member3->id]);

        $response = $this->actingAs($user)->getJson('/api/servers?filter=public');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals(3, $data[0]['members_count']);
    }

    public function test_owner_can_see_own_server_in_public_directory(): void
    {
        $alice = User::factory()->create(['name' => 'Alice']);

        // Create a public server owned by alice but she is NOT a member
        $server = Server::factory()->public()->create(['owner_id' => $alice->id]);

        $response = $this->actingAs($alice)->getJson('/api/servers?filter=public');

        $response->assertStatus(200);
        $data = $response->json('data');

        // Alice is not a member (only owner), so filter=public does NOT exclude it —
        // the endpoint filters by membership, not ownership.
        $ids = array_column($data, 'id');
        $this->assertContains($server->id, $ids);
    }
}
