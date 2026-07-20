<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Usuarios del restaurante (personal), dentro del schema del tenant (rst_*).
 *
 * Aislados por schema. El dueño (owner) se crea aquí con email; el resto del
 * personal (mozo, cocinero, cajero) puede iniciar sesión por `username`, que
 * solo debe ser único DENTRO de este restaurante.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username', 60)->unique();       // login del staff (único por tenant)
            $table->string('email')->nullable()->unique();  // el owner sí tiene; el staff puede no tener
            $table->timestampTz('email_verified_at')->nullable();
            $table->string('password');
            $table->string('telefono', 20)->nullable();
            $table->boolean('activo')->default(true);
            $table->boolean('es_owner')->default(false);
            $table->rememberToken();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index('activo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
