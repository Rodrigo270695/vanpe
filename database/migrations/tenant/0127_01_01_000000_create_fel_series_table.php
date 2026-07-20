<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fel_series', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedTinyInteger('tipo_comprobante');
            $table->string('serie', 4);
            $table->unsignedBigInteger('ultimo_correlativo')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestampsTz();

            $table->unique(['tipo_comprobante', 'serie']);
        });

        $now = now();
        DB::table('fel_series')->insert([
            [
                'id' => (string) Str::uuid(),
                'tipo_comprobante' => 2,
                'serie' => 'B001',
                'ultimo_correlativo' => 0,
                'activo' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => (string) Str::uuid(),
                'tipo_comprobante' => 1,
                'serie' => 'F001',
                'ultimo_correlativo' => 0,
                'activo' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('fel_series');
    }
};
