<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rst_tables', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('area_id')->constrained('rst_areas')->cascadeOnDelete();

            $table->string('number', 20);
            $table->unsignedSmallInteger('capacity')->default(4);
            $table->unsignedSmallInteger('capacity_max')->nullable();

            $table->string('status', 15)->default('free');

            $table->smallInteger('pos_x')->nullable();
            $table->smallInteger('pos_y')->nullable();
            $table->string('shape', 15)->nullable();

            $table->string('qr_token', 40)->nullable()->unique();
            $table->boolean('reservable')->default(true);
            $table->boolean('active')->default(true);

            $table->timestampsTz();
            $table->softDeletesTz();

            $table->unique(['area_id', 'number']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rst_tables');
    }
};
