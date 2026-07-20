<?php

namespace App\Support\Fel;

use App\Models\Tenant\FelSerie;
use RuntimeException;

final class FelSerieResolver
{
    public function resolver(int $tipoComprobante, string $ambiente, bool $forUpdate = false): FelSerie
    {
        $this->validarAmbiente($ambiente);

        $query = FelSerie::query()
            ->where('tipo_comprobante', $tipoComprobante)
            ->where('ambiente', $ambiente)
            ->where('activo', true)
            ->where('es_predeterminada', true);

        if ($forUpdate) {
            $query->lockForUpdate();
        }

        $serie = $query->first();

        if ($serie === null) {
            $tipo = $tipoComprobante === FelSerie::TIPO_FACTURA ? 'factura' : 'boleta';

            throw new RuntimeException(__('messages.fel.no_default_series', [
                'tipo' => $tipo,
                'ambiente' => $ambiente,
            ]));
        }

        return $serie;
    }

    public function existePredeterminada(int $tipoComprobante, string $ambiente): bool
    {
        $this->validarAmbiente($ambiente);

        return FelSerie::query()
            ->where('tipo_comprobante', $tipoComprobante)
            ->where('ambiente', $ambiente)
            ->where('activo', true)
            ->where('es_predeterminada', true)
            ->exists();
    }

    private function validarAmbiente(string $ambiente): void
    {
        if (! in_array($ambiente, [FelSerie::AMBIENTE_SANDBOX, FelSerie::AMBIENTE_PRODUCCION], true)) {
            throw new RuntimeException(__('messages.fel.invalid_series_ambiente'));
        }
    }
}
