<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('cajero_id')->constrained('users')->restrictOnDelete();

            $table->decimal('monto_apertura', 10, 2)->default(0);
            $table->decimal('monto_cierre', 10, 2)->nullable();
            $table->decimal('monto_esperado_efectivo', 10, 2)->nullable();
            $table->decimal('diferencia', 10, 2)->nullable();
            $table->decimal('total_ventas', 10, 2)->default(0);

            $table->string('estado', 10)->default('abierta');
            $table->text('notas_cierre')->nullable();

            $table->timestampTz('abierta_en')->useCurrent();
            $table->timestampTz('cerrada_en')->nullable();
            $table->timestampsTz();

            $table->index('estado');
            $table->index('abierta_en');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_sessions');
    }
};
