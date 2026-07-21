<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tour_spots', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignId('departamento_id')->constrained('departamentos')->restrictOnDelete();
            $table->foreignId('provincia_id')->constrained('provincias')->restrictOnDelete();
            $table->foreignId('distrito_id')->constrained('distritos')->restrictOnDelete();

            $table->string('nombre', 150);
            $table->string('slug', 160)->unique();
            $table->string('resumen', 300)->nullable();
            $table->text('descripcion')->nullable();

            $table->string('direccion', 255)->nullable();
            $table->string('referencia', 255)->nullable();
            $table->decimal('latitud', 9, 6)->nullable();
            $table->decimal('longitud', 9, 6)->nullable();
            $table->integer('altitud_msnm')->nullable();

            $table->string('telefono', 20)->nullable();
            $table->string('whatsapp', 20)->nullable();
            $table->string('website', 200)->nullable();
            $table->string('email', 150)->nullable();

            $table->boolean('es_gratuito')->default(false);
            $table->decimal('precio_entrada_desde', 10, 2)->nullable();
            $table->decimal('precio_entrada_hasta', 10, 2)->nullable();
            $table->char('moneda', 3)->default('PEN');
            $table->boolean('requiere_reserva')->default(false);

            $table->string('dificultad_acceso', 20)->default('facil');
            $table->string('vialidad_principal', 80)->nullable();
            $table->unsignedSmallInteger('tiempo_acceso_min')->nullable();
            $table->decimal('distancia_acceso_km', 6, 2)->nullable();
            $table->text('acceso_notas')->nullable();
            $table->string('estacionamiento', 30)->default('desconocido');
            $table->boolean('accesible_movilidad_reducida')->nullable();

            $table->string('mejor_epoca', 120)->nullable();
            $table->unsignedSmallInteger('duracion_visita_min')->nullable();
            $table->string('horario_texto', 200)->nullable();
            $table->json('tips')->nullable();
            $table->json('como_llegar')->nullable();

            $table->string('imagen_portada_url', 500)->nullable();

            $table->decimal('rating_promedio', 3, 2)->default(0);
            $table->unsignedInteger('total_resenas')->default(0);
            $table->boolean('destacado')->default(false);
            $table->timestampTz('destacado_hasta')->nullable();
            $table->decimal('score_ranking', 8, 4)->default(0);

            $table->string('estado', 20)->default('borrador');
            $table->timestampTz('publicado_en')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index(['departamento_id', 'estado']);
            $table->index('distrito_id');
            $table->index(['latitud', 'longitud']);
            $table->index('score_ranking');
            $table->index('estado');
        });

        Schema::create('tour_spot_categories', function (Blueprint $table) {
            $table->foreignUuid('tour_spot_id')->constrained('tour_spots')->cascadeOnDelete();
            $table->foreignUuid('tour_category_id')->constrained('tour_categories')->restrictOnDelete();
            $table->boolean('is_primary')->default(false);
            $table->primary(['tour_spot_id', 'tour_category_id']);
        });

        Schema::create('tour_spot_access_modes', function (Blueprint $table) {
            $table->foreignUuid('tour_spot_id')->constrained('tour_spots')->cascadeOnDelete();
            $table->foreignUuid('ref_catalog_item_id')->constrained('ref_catalog_items')->restrictOnDelete();
            $table->boolean('recomendado')->default(false);
            $table->string('notas', 200)->nullable();
            $table->primary(['tour_spot_id', 'ref_catalog_item_id']);
        });

        Schema::create('tour_spot_media', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tour_spot_id')->constrained('tour_spots')->cascadeOnDelete();
            $table->string('tipo', 10)->default('imagen');
            $table->string('url', 500);
            $table->string('caption', 200)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_cover')->default(false);
            $table->timestampsTz();

            $table->index(['tour_spot_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tour_spot_media');
        Schema::dropIfExists('tour_spot_access_modes');
        Schema::dropIfExists('tour_spot_categories');
        Schema::dropIfExists('tour_spots');
    }
};
