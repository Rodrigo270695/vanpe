<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waiting_list', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('cliente_nombre', 120);
            $table->string('cliente_telefono', 20)->nullable();
            $table->unsignedSmallInteger('num_personas');
            $table->timestampTz('hora_llegada')->useCurrent();
            $table->string('estado', 15)->default('esperando');
            $table->string('notas', 200)->nullable();
            $table->foreignUuid('table_id')->nullable()->constrained('rst_tables')->nullOnDelete();
            $table->timestamps();

            $table->index('estado');
            $table->index('hora_llegada');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waiting_list');
    }
};
