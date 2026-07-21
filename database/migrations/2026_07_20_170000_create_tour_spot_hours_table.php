<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tour_spot_hours', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tour_spot_id')->constrained('tour_spots')->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week');
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->boolean('active')->default(true);
            $table->timestampsTz();

            $table->unique(['tour_spot_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tour_spot_hours');
    }
};
