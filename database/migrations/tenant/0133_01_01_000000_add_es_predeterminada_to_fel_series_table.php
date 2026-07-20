<?php

use App\Models\Tenant\FelSerie;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fel_series', function (Blueprint $table) {
            $table->boolean('es_predeterminada')->default(false)->after('activo');
        });

        FelSerie::query()
            ->select('tipo_comprobante', 'ambiente')
            ->distinct()
            ->orderBy('tipo_comprobante')
            ->orderBy('ambiente')
            ->each(function (FelSerie $grupo): void {
                $primera = FelSerie::query()
                    ->where('tipo_comprobante', $grupo->tipo_comprobante)
                    ->where('ambiente', $grupo->ambiente)
                    ->where('activo', true)
                    ->orderBy('serie')
                    ->first();

                if ($primera === null) {
                    return;
                }

                FelSerie::query()
                    ->where('tipo_comprobante', $grupo->tipo_comprobante)
                    ->where('ambiente', $grupo->ambiente)
                    ->update(['es_predeterminada' => false]);

                $primera->update(['es_predeterminada' => true]);
            });
    }

    public function down(): void
    {
        Schema::table('fel_series', function (Blueprint $table) {
            $table->dropColumn('es_predeterminada');
        });
    }
};
