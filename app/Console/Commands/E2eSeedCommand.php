<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\E2eSeeder;

class E2eSeedCommand extends Command
{
    protected $signature = 'e2e:seed';
    protected $description = 'Seed test data for E2E tests';

    public function handle(E2eSeeder $seeder): int
    {
        $this->call('migrate:fresh', ['--env' => 'testing']);
        $seeder->run();
        $this->info('E2E test data seeded.');
        return Command::SUCCESS;
    }
}