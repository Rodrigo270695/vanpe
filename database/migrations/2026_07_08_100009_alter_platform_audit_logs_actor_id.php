<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('platform_audit_logs', function (Blueprint $table) {
            $table->string('actor_id', 36)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('platform_audit_logs', function (Blueprint $table) {
            $table->uuid('actor_id')->nullable()->change();
        });
    }
};
