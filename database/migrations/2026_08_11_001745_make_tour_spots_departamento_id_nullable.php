<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Borradores de centros (stub al registrar tenant) aún no tienen ubicación.
     */
    public function up(): void
    {
        Schema::table('tour_spots', function (Blueprint $table) {
            $table->dropForeign(['departamento_id']);
            $table->dropForeign(['provincia_id']);
            $table->dropForeign(['distrito_id']);
        });

        DB::statement('ALTER TABLE tour_spots ALTER COLUMN departamento_id DROP NOT NULL');
        DB::statement('ALTER TABLE tour_spots ALTER COLUMN provincia_id DROP NOT NULL');
        DB::statement('ALTER TABLE tour_spots ALTER COLUMN distrito_id DROP NOT NULL');

        Schema::table('tour_spots', function (Blueprint $table) {
            $table->foreign('departamento_id')->references('id')->on('departamentos')->nullOnDelete();
            $table->foreign('provincia_id')->references('id')->on('provincias')->nullOnDelete();
            $table->foreign('distrito_id')->references('id')->on('distritos')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tour_spots', function (Blueprint $table) {
            $table->dropForeign(['departamento_id']);
            $table->dropForeign(['provincia_id']);
            $table->dropForeign(['distrito_id']);
        });

        DB::statement('ALTER TABLE tour_spots ALTER COLUMN departamento_id SET NOT NULL');
        DB::statement('ALTER TABLE tour_spots ALTER COLUMN provincia_id SET NOT NULL');
        DB::statement('ALTER TABLE tour_spots ALTER COLUMN distrito_id SET NOT NULL');

        Schema::table('tour_spots', function (Blueprint $table) {
            $table->foreign('departamento_id')->references('id')->on('departamentos')->restrictOnDelete();
            $table->foreign('provincia_id')->references('id')->on('provincias')->restrictOnDelete();
            $table->foreign('distrito_id')->references('id')->on('distritos')->restrictOnDelete();
        });
    }
};
