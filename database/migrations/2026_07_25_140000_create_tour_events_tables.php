<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tour_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('owner_type', 20)->default('platform'); // platform | tenant
            $table->foreignUuid('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->string('titulo');
            $table->string('slug')->unique();
            $table->string('resumen', 500)->nullable();
            $table->text('descripcion')->nullable();
            $table->string('portada_url')->nullable();
            $table->string('lugar')->nullable();
            $table->foreignId('departamento_id')->nullable()->constrained('departamentos')->nullOnDelete();
            $table->foreignId('provincia_id')->nullable()->constrained('provincias')->nullOnDelete();
            $table->foreignId('distrito_id')->nullable()->constrained('distritos')->nullOnDelete();
            $table->decimal('latitud', 10, 7)->nullable();
            $table->decimal('longitud', 10, 7)->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->string('estado', 20)->default('borrador'); // borrador | publicado | archivado
            $table->boolean('destacado')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['estado', 'starts_at']);
            $table->index(['owner_type', 'tenant_id']);
            $table->index(['departamento_id', 'estado']);
        });

        Schema::create('tour_event_sponsors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tour_event_id')->constrained('tour_events')->cascadeOnDelete();
            $table->string('nombre');
            $table->string('tipo', 30)->default('auspiciador'); // auspiciador | orquesta | artista | otro
            $table->string('logo_url')->nullable();
            $table->string('website')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['tour_event_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tour_event_sponsors');
        Schema::dropIfExists('tour_events');
    }
};
