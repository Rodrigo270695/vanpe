<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pub_sync_state', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('entity', 40)->unique();
            $table->timestampTz('synced_at')->nullable();
            $table->string('payload_hash', 64)->nullable();
            $table->string('status', 20)->default('pending');
            $table->text('error_message')->nullable();
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pub_sync_state');
    }
};
