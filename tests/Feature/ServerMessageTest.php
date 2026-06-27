<?php

namespace Tests\Feature;

use App\Models\Channel;
use App\Models\Message;
use App\Models\Server;
use App\Models\ServerMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServerMessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_requires_authentication(): void
    {
        $server = Server::factory()->create();

        $response = $this->getJson("/api/servers/{$server->id}/messages");
        $response->assertStatus(401);
    }

    public function test_store_requires_authentication(): void
    {
        $server = Server::factory()->create();

        $response = $this->postJson("/api/servers/{$server->id}/messages", [
            'content' => 'Hello world',
        ]);
        $response->assertStatus(401);
    }

    public function test_non_member_cannot_access(): void
    {
        $server = Server::factory()->create();
        $member = User::factory()->create();
        $outsider = User::factory()->create();

        // Add member to server
        ServerMember::factory()->create([
            'server_id' => $server->id,
            'user_id' => $member->id,
        ]);

        // Outsider cannot GET
        $response = $this->actingAs($outsider)->getJson("/api/servers/{$server->id}/messages");
        $response->assertStatus(403);

        // Outsider cannot POST
        $response = $this->actingAs($outsider)->postJson("/api/servers/{$server->id}/messages", [
            'content' => 'Hello',
        ]);
        $response->assertStatus(403);
    }

    public function test_member_can_list_messages(): void
    {
        $server = Server::factory()->create();
        $member = User::factory()->create();

        ServerMember::factory()->create([
            'server_id' => $server->id,
            'user_id' => $member->id,
        ]);

        $messages = Message::factory()->count(3)->create([
            'messagable_type' => Server::class,
            'messagable_id' => $server->id,
        ]);

        $response = $this->actingAs($member)->getJson("/api/servers/{$server->id}/messages");

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(3, $data);
    }

    public function test_member_can_send_message(): void
    {
        $server = Server::factory()->create();
        $member = User::factory()->create();

        ServerMember::factory()->create([
            'server_id' => $server->id,
            'user_id' => $member->id,
        ]);

        $response = $this->actingAs($member)->postJson("/api/servers/{$server->id}/messages", [
            'content' => 'Hello from the server!',
        ]);

        $response->assertStatus(201);

        $data = $response->json('data');
        $this->assertArrayHasKey('id', $data);
        $this->assertEquals('Hello from the server!', $data['content']);

        $this->assertDatabaseHas('messages', [
            'user_id' => $member->id,
            'messagable_type' => Server::class,
            'messagable_id' => $server->id,
            'content' => 'Hello from the server!',
        ]);
    }

    public function test_cursor_pagination(): void
    {
        $server = Server::factory()->create();
        $member = User::factory()->create();

        ServerMember::factory()->create([
            'server_id' => $server->id,
            'user_id' => $member->id,
        ]);

        // Create 65 messages
        Message::factory()->count(65)->create([
            'messagable_type' => Server::class,
            'messagable_id' => $server->id,
        ]);

        // First page — no cursor — should return 50 results with next_cursor
        $response = $this->actingAs($member)->getJson("/api/servers/{$server->id}/messages");
        $response->assertStatus(200);

        $firstData = $response->json('data');
        $this->assertCount(50, $firstData);
        $this->assertNotNull($response->json('next_cursor'));

        // Second page — with cursor — should return remaining 15
        $cursor = $response->json('next_cursor');
        $response = $this->actingAs($member)->getJson("/api/servers/{$server->id}/messages?cursor={$cursor}");
        $response->assertStatus(200);

        $secondData = $response->json('data');
        $this->assertGreaterThanOrEqual(15, count($secondData));
    }

    public function test_validates_required_content(): void
    {
        $server = Server::factory()->create();
        $member = User::factory()->create();

        ServerMember::factory()->create([
            'server_id' => $server->id,
            'user_id' => $member->id,
        ]);

        $response = $this->actingAs($member)->postJson("/api/servers/{$server->id}/messages", [
            'content' => '',
        ]);

        $response->assertStatus(422);
    }
}
