<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tour_event_media', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tour_event_id')->constrained('tour_events')->cascadeOnDelete();
            $table->string('tipo', 10)->default('imagen');
            $table->string('url', 500);
            $table->string('caption', 200)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_cover')->default(false);
            $table->timestampsTz();

            $table->index(['tour_event_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tour_event_media');
    }
};
