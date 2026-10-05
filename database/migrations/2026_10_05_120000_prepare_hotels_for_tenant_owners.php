<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Permite crear la ficha borrador del hotel al registrarse el dueño
 * (sin RUC, dirección ni teléfono todavía) y fija 1 hotel por tenant.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->char('ruc', 11)->nullable()->change();
            $table->string('direccion', 255)->nullable()->change();
            $table->string('telefono_reservas', 20)->nullable()->change();
            $table->unique('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->dropUnique(['tenant_id']);
            $table->char('ruc', 11)->nullable(false)->change();
            $table->string('direccion', 255)->nullable(false)->change();
            $table->string('telefono_reservas', 20)->nullable(false)->change();
        });
    }
};
