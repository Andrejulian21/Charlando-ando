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

            $table->index(['user_a_id', 'user_b_id']);
        });

        // Functional unique index so a (1,2) and (2,1) conversation collapse to one row.
        // PostgreSQL and MySQL support LEAST/GREATEST natively; SQLite needs CASE expressions.
        $driver = DB::getDriverName();
        if (in_array($driver, ['mysql', 'pgsql', 'postgresql'], true)) {
            DB::statement('
                CREATE UNIQUE INDEX direct_messages_pair_unique
                ON direct_messages (LEAST(user_a_id, user_b_id), GREATEST(user_a_id, user_b_id))
            ');
        } else {
            DB::statement('
                CREATE UNIQUE INDEX direct_messages_pair_unique
                ON direct_messages (
                    CASE WHEN user_a_id < user_b_id THEN user_a_id ELSE user_b_id END,
                    CASE WHEN user_a_id < user_b_id THEN user_b_id ELSE user_a_id END
                )
            ');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('direct_messages');
        // The functional index is dropped with the table; no separate statement needed.
    }
};
