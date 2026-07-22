<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tourist_routes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('name', 160);
            // draft = ruta actual en edición | archived = historial
            $table->string('status', 20)->default('draft');
            $table->unsignedSmallInteger('stops_count')->default(0);
            $table->decimal('distance_meters', 12, 2)->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->timestampsTz();

            $table->index(['customer_id', 'status']);
            $table->index(['customer_id', 'created_at']);
        });

        Schema::create('tourist_route_stops', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tourist_route_id')
                ->constrained('tourist_routes')
                ->cascadeOnDelete();

            // restaurant | tour_spot
            $table->string('target_type', 30);
            $table->uuid('target_id');
            $table->string('slug', 180)->nullable();
            $table->string('nombre', 200);
            $table->decimal('latitud', 10, 7);
            $table->decimal('longitud', 10, 7);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestampsTz();

            $table->unique(['tourist_route_id', 'target_type', 'target_id'], 'route_stop_unique');
            $table->index(['tourist_route_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tourist_route_stops');
        Schema::dropIfExists('tourist_routes');
    }
};
