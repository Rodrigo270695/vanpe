<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crafts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();

            $table->string('nombre', 150);
            $table->string('slug', 160)->unique();
            $table->text('descripcion')->nullable();
            $table->decimal('latitud', 9, 6)->nullable();
            $table->decimal('longitud', 9, 6)->nullable();
            $table->string('telefono_contacto', 20)->nullable();
            // Lista de {red, url}: facebook, instagram, tiktok, ...
            $table->json('redes_sociales')->nullable();

            $table->string('imagen_portada_url', 500)->nullable();

            $table->decimal('rating_promedio', 3, 2)->default(0);
            $table->unsignedInteger('total_resenas')->default(0);
            $table->boolean('destacado')->default(false);
            $table->decimal('score_ranking', 8, 4)->default(0);

            $table->string('estado', 20)->default('borrador');
            $table->timestampTz('publicado_en')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index('estado');
            $table->index(['latitud', 'longitud']);
        });

        Schema::create('craft_media', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('craft_id')->constrained('crafts')->cascadeOnDelete();
            $table->string('url', 500);
            $table->string('titulo', 150)->nullable();
            $table->decimal('precio', 10, 2)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestampsTz();

            $table->index(['craft_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('craft_media');
        Schema::dropIfExists('crafts');
    }
};
