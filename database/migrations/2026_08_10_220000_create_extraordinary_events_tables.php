<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('extraordinary_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('titulo');
            $table->string('slug')->unique();
            $table->string('cta_label', 120)->default('Ver la ruta');
            $table->string('floating_text', 180)->nullable();
            $table->text('descripcion')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('year_effect', 8)->nullable()->default('2026');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('extraordinary_event_stops', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('extraordinary_event_id')
                ->constrained('extraordinary_events')
                ->cascadeOnDelete();
            $table->string('nombre');
            $table->string('slug')->nullable();
            $table->string('target_type', 32)->nullable(); // restaurant|tour_spot|custom
            $table->uuid('target_id')->nullable();
            $table->decimal('latitud', 10, 7);
            $table->decimal('longitud', 10, 7);
            $table->timestamp('visita_at')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['extraordinary_event_id', 'sort_order']);
        });

        Schema::table('tourist_routes', function (Blueprint $table) {
            $table->uuid('extraordinary_event_id')->nullable()->after('customer_id');
            $table->index('extraordinary_event_id');
        });
    }

    public function down(): void
    {
        Schema::table('tourist_routes', function (Blueprint $table) {
            $table->dropIndex(['extraordinary_event_id']);
            $table->dropColumn('extraordinary_event_id');
        });
        Schema::dropIfExists('extraordinary_event_stops');
        Schema::dropIfExists('extraordinary_events');
    }
};
