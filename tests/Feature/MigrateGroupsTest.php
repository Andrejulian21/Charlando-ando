<?php

namespace Tests\Feature;

use App\Models\Channel;
use App\Models\Message;
use App\Models\Server;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MigrateGroupsTest extends TestCase
{
    use RefreshDatabase;

    public function test_migrate_reparents_messages(): void
    {
        $owner = User::factory()->create();
        $server = Server::factory()->create(['owner_id' => $owner->id]);
        $channel = Channel::factory()->create(['server_id' => $server->id]);

        // Create messages on the channel
        $messages = Message::factory()->count(3)->create([
            'messagable_type' => Channel::class,
            'messagable_id' => $channel->id,
        ]);

        $this->assertDatabaseHas('messages', [
            'messagable_type' => Channel::class,
            'messagable_id' => $channel->id,
        ]);

        $this->artisan('migrate:groups');

        // All messages should now be reparented to the server
        foreach ($messages as $message) {
            $this->assertDatabaseHas('messages', [
                'id' => $message->id,
                'messagable_type' => Server::class,
                'messagable_id' => $server->id,
            ]);
        }
    }

    public function test_migrate_soft_deletes_channels(): void
    {
        $owner = User::factory()->create();
        $server = Server::factory()->create(['owner_id' => $owner->id]);
        $channel = Channel::factory()->create(['server_id' => $server->id]);

        $channelId = $channel->id;

        $this->artisan('migrate:groups');

        // Channel is soft-deleted (still in DB with deleted_at set)
        $this->assertSoftDeleted('channels', ['id' => $channelId]);
        $this->assertEquals(0, Channel::count()); // default query excludes soft-deleted
    }

    public function test_migrate_is_idempotent(): void
    {
        $owner = User::factory()->create();
        $server = Server::factory()->create(['owner_id' => $owner->id]);
        $channel = Channel::factory()->create(['server_id' => $server->id]);

        Message::factory()->count(2)->create([
            'messagable_type' => Channel::class,
            'messagable_id' => $channel->id,
        ]);

        // First run
        $this->artisan('migrate:groups');

        // Second run — should warn "Already migrated"
        $this->artisan('migrate:groups');

        // Messages should still be correctly parented (not double-reparented)
        $serverMessages = Message::where('messagable_type', Server::class)
            ->where('messagable_id', $server->id)
            ->count();
        $this->assertEquals(2, $serverMessages);

        // Channel is still soft-deleted (not re-deleted)
        $this->assertEquals(1, Channel::withTrashed()->where('id', $channel->id)->whereNotNull('deleted_at')->count());
    }

    public function test_rollback_restores_channels(): void
    {
        $owner = User::factory()->create();
        $server = Server::factory()->create(['owner_id' => $owner->id]);
        $channel = Channel::factory()->create(['server_id' => $server->id]);

        $channelId = $channel->id;

        $message = Message::factory()->create([
            'messagable_type' => Channel::class,
            'messagable_id' => $channel->id,
        ]);

        // Migrate — channel is soft-deleted
        $this->artisan('migrate:groups');
        $this->assertSoftDeleted('channels', ['id' => $channelId]);

        // Rollback — restores channels and reparents messages back to channel
        $this->artisan('migrate:groups', ['--rollback' => true]);

        // Channel is restored
        $this->assertDatabaseHas('channels', ['id' => $channelId, 'deleted_at' => null]);
        $this->assertEquals(1, Channel::count());

        // Message is reparented back to channel
        $this->assertDatabaseHas('messages', [
            'id' => $message->id,
            'messagable_type' => Channel::class,
            'messagable_id' => $channelId,
        ]);
    }
}
