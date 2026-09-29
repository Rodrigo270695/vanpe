<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();

            $table->foreignId('departamento_id')->nullable()->constrained('departamentos')->restrictOnDelete();
            $table->foreignId('provincia_id')->nullable()->constrained('provincias')->restrictOnDelete();
            $table->foreignId('distrito_id')->nullable()->constrained('distritos')->restrictOnDelete();

            // 1. Información general
            $table->string('nombre', 150);
            $table->string('slug', 160)->unique();
            $table->char('ruc', 11);
            $table->string('resumen', 300)->nullable();
            $table->text('descripcion')->nullable();
            $table->string('direccion', 255);
            $table->string('referencia', 255)->nullable();
            $table->decimal('latitud', 9, 6)->nullable();
            $table->decimal('longitud', 9, 6)->nullable();
            $table->string('telefono_reservas', 20);
            $table->string('email', 150)->nullable();
            $table->string('website', 200)->nullable();
            $table->string('check_in', 5)->nullable();
            $table->string('check_out', 5)->nullable();

            // 2. Habitaciones y tarifas
            $table->json('tipos_habitacion')->nullable();
            $table->decimal('precio_desde', 10, 2)->nullable();
            $table->decimal('precio_hasta', 10, 2)->nullable();
            $table->char('moneda', 3)->default('PEN');
            $table->string('clasificacion', 20)->default('sin_categoria');

            // 3 y 4. Servicios y medios de pago
            $table->json('servicios')->nullable();
            $table->json('medios_pago')->nullable();

            $table->string('imagen_portada_url', 500)->nullable();

            // 6. Diagnóstico de operación (uso interno)
            $table->string('sistema_reservas', 30)->nullable();
            $table->string('interes_whatsapp', 20)->nullable();
            $table->json('redes_sociales')->nullable();
            $table->json('herramientas_interes')->nullable();
            $table->text('mayor_reto')->nullable();
            $table->text('sugerencias')->nullable();

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

            $table->index(['departamento_id', 'estado']);
            $table->index('distrito_id');
            $table->index(['latitud', 'longitud']);
            $table->index('estado');
            $table->index('ruc');
        });

        Schema::create('hotel_media', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('hotel_id')->constrained('hotels')->cascadeOnDelete();
            $table->string('tipo', 10)->default('imagen');
            $table->string('url', 500);
            $table->string('caption', 200)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_cover')->default(false);
            $table->timestampsTz();

            $table->index(['hotel_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotel_media');
        Schema::dropIfExists('hotels');
    }
};
