<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_push_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('token', 512);
            $table->string('platform', 20)->nullable(); // ios | android | web
            $table->string('device_name', 120)->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['customer_id', 'token']);
            $table->index('token');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_push_tokens');
    }
};
