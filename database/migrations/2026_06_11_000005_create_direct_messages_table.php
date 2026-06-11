<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('direct_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_a_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('user_b_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
        });

        // Functional unique index so a (1,2) and (2,1) conversation collapse to one row.
        // MySQL 8+ required.
        DB::statement('
            CREATE UNIQUE INDEX direct_messages_pair_unique
            ON direct_messages (LEAST(user_a_id, user_b_id), GREATEST(user_a_id, user_b_id))
        ');
    }

    public function down(): void
    {
        Schema::dropIfExists('direct_messages');
    }
};
