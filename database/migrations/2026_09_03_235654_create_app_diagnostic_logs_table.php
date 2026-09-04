<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_diagnostic_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('device_id', 64)->index();
            $table->uuid('customer_id')->nullable()->index();
            $table->string('session_id', 64)->nullable()->index();
            $table->string('level', 16)->default('info')->index(); // info|warning|error|fatal
            $table->string('event', 64)->index();
            $table->string('message', 500);
            $table->string('app_version', 32)->nullable();
            $table->string('platform', 16)->nullable();
            $table->string('os_version', 64)->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->index(['created_at', 'level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_diagnostic_logs');
    }
};
