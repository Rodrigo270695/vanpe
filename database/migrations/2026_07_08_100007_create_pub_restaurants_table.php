<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pub_restaurants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->unique()->constrained('tenants')->cascadeOnDelete();

            $table->foreignId('departamento_id')->nullable()->constrained('departamentos')->nullOnDelete();
            $table->foreignId('provincia_id')->nullable()->constrained('provincias')->nullOnDelete();
            $table->foreignId('distrito_id')->nullable()->constrained('distritos')->nullOnDelete();

            $table->string('nombre', 150);
            $table->string('slug', 160)->unique();
            $table->text('descripcion')->nullable();

            $table->string('direccion', 255)->nullable();
            $table->decimal('latitud', 9, 6)->nullable();
            $table->decimal('longitud', 9, 6)->nullable();

            $table->string('telefono', 20)->nullable();
            $table->string('whatsapp', 20)->nullable();

            $table->json('tipo_cocina')->nullable();
            $table->unsignedTinyInteger('rango_precio')->nullable();

            $table->string('logo_url', 500)->nullable();
            $table->string('portada_url', 500)->nullable();

            $table->boolean('acepta_reservas')->default(true);
            $table->unsignedSmallInteger('anticipacion_min_horas')->default(1);
            $table->unsignedSmallInteger('capacidad_max_grupo')->nullable();

            $table->decimal('rating_promedio', 3, 2)->default(0);
            $table->unsignedInteger('total_resenas')->default(0);
            $table->unsignedInteger('total_reservas')->default(0);

            $table->boolean('destacado')->default(false);
            $table->timestampTz('destacado_hasta')->nullable();
            $table->decimal('score_ranking', 8, 4)->default(0);

            $table->boolean('activo')->default(false);
            $table->timestampTz('publicado_en')->nullable();
            $table->timestampTz('sincronizado_en')->nullable();

            $table->timestampsTz();

            $table->index(['departamento_id', 'activo']);
            $table->index(['latitud', 'longitud']);
            $table->index('score_ranking');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pub_restaurants');
    }
};
