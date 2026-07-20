<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Registro maestro de cada restaurante (tenant).
 *
 * Es el puente entre el subdominio (slug), el schema PostgreSQL aislado
 * (schema_name = rst_xxxxxx) y la suscripción. Vive en el schema public.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Identidad / ruteo
            $table->string('slug', 60)->unique();          // subdominio: elcantaro → elcantaro.vanpe.com.pe
            $table->string('schema_name', 20)->unique();    // rst_a1b2c3 (inmutable)

            // Datos del restaurante
            $table->string('razon_social', 200);
            $table->string('nombre_comercial', 150);
            $table->string('ruc', 11)->nullable()->unique();
            $table->string('email_admin', 150)->unique();
            $table->string('telefono', 20)->nullable();
            $table->string('logo_url', 500)->nullable();

            // Ubicación (catálogo geográfico local)
            $table->foreignId('departamento_id')->nullable()->constrained('departamentos')->nullOnDelete();
            $table->foreignId('provincia_id')->nullable()->constrained('provincias')->nullOnDelete();
            $table->foreignId('distrito_id')->nullable()->constrained('distritos')->nullOnDelete();
            $table->string('direccion', 255)->nullable();
            $table->decimal('latitud', 9, 6)->nullable();
            $table->decimal('longitud', 9, 6)->nullable();

            // Ciclo de vida
            $table->string('estado', 20)->default('trial'); // trial | active | suspended | cancelled
            $table->timestampTz('trial_ends_at')->nullable();
            $table->timestampTz('suspended_at')->nullable();
            $table->text('suspension_reason')->nullable();
            $table->timestampTz('cancelled_at')->nullable();

            // Onboarding
            $table->boolean('onboarding_completado')->default(false);
            $table->unsignedTinyInteger('onboarding_paso')->default(0); // 0..5

            // Visibilidad en la app del turista
            $table->boolean('publicado')->default(false);

            // Localización
            $table->string('timezone', 50)->default('America/Lima');
            $table->string('locale', 10)->default('es_PE');

            // Marketing
            $table->string('canal_adquisicion', 50)->nullable();

            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index('slug');
            $table->index('estado');
            $table->index('publicado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
