<?php

namespace App\Console\Commands;

use App\Models\Channel;
use App\Models\Message;
use App\Models\Server;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateGroups extends Command
{
    protected $signature = 'migrate:groups {--rollback : Revert the migration}';
    protected $description = 'Migrate channel messages to server level (WhatsApp-like groups)';

    public function handle(): int
    {
        if ($this->option('rollback')) {
            return $this->rollback();
        }
        return $this->migrate();
    }

    protected function migrate(): int
    {
        // Check if already migrated (all channels soft-deleted)
        $channelCount = Channel::query()->count();
        if ($channelCount === 0) {
            $this->warn('Already migrated. Nothing to do.');
            return Command::SUCCESS;
        }

        $bar = $this->output->createProgressBar(Server::count());
        $bar->start();

        DB::transaction(function () use ($bar) {
            Server::with('channels')->chunk(50, function ($servers) use ($bar) {
                foreach ($servers as $server) {
                    $channelIds = $server->channels->pluck('id');
                    
                    // Re-parent channel messages to server
                    Message::whereIn('messagable_id', $channelIds)
                        ->where('messagable_type', (new Channel)->getMorphClass())
                        ->update([
                            'messagable_type' => (new Server)->getMorphClass(),
                            'messagable_id' => $server->id,
                        ]);

                    // Soft-delete channels
                    $server->channels()->delete();
                    
                    $bar->advance();
                }
            });
        });

        $bar->finish();
        $this->newLine();
        $this->info('Migration complete. All channel messages moved to server level.');
        
        return Command::SUCCESS;
    }

    protected function rollback(): int
    {
        $trashedChannels = Channel::onlyTrashed()->get();
        if ($trashedChannels->isEmpty()) {
            $this->warn('No rolled-back channels found. Nothing to do.');
            return Command::SUCCESS;
        }

        $bar = $this->output->createProgressBar($trashedChannels->count());
        $bar->start();

        DB::transaction(function () use ($trashedChannels, $bar) {
            foreach ($trashedChannels as $channel) {
                // Re-parent server-level messages back to this channel
                Message::where('messagable_id', $channel->server_id)
                    ->where('messagable_type', (new Server)->getMorphClass())
                    ->update([
                        'messagable_type' => (new Channel)->getMorphClass(),
                        'messagable_id' => $channel->id,
                    ]);

                // Restore the channel
                $channel->restore();
                
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
        $this->info('Rollback complete. Messages restored to original channels.');

        return Command::SUCCESS;
    }
}
