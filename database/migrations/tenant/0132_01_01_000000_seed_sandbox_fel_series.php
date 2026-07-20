<?php

use App\Models\Tenant\FelSerie;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        FelSerie::query()
            ->where('ambiente', FelSerie::AMBIENTE_PRODUCCION)
            ->orderBy('serie')
            ->each(function (FelSerie $serie): void {
                $exists = FelSerie::query()
                    ->where('tipo_comprobante', $serie->tipo_comprobante)
                    ->where('serie', $serie->serie)
                    ->where('ambiente', FelSerie::AMBIENTE_SANDBOX)
                    ->exists();

                if ($exists) {
                    return;
                }

                FelSerie::query()->create([
                    'id' => (string) Str::uuid(),
                    'tipo_comprobante' => $serie->tipo_comprobante,
                    'serie' => $serie->serie,
                    'ambiente' => FelSerie::AMBIENTE_SANDBOX,
                    'ultimo_correlativo' => 0,
                    'activo' => $serie->activo,
                ]);
            });
    }

    public function down(): void
    {
        // No revertimos: las series sandbox pueden tener comprobantes de prueba.
    }
};
