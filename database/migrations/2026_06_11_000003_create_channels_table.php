<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('channels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('server_id')->constrained('servers')->cascadeOnDelete();
            $table->string('name', 64);
            $table->string('type', 16)->default('text');
            $table->text('topic')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['server_id', 'name']);
            $table->index(['server_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('channels');
    }
};
