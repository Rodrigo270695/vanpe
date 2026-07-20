<?php

namespace App\Support\Fel;

use App\Models\Tenant\FelDocument;
use App\Models\Tenant\FelSerie;

final class FelSeriePresenter
{
    public static function ultimoCorrelativoEmitido(FelSerie $serie): int
    {
        if ($serie->esSandbox()) {
            return (int) $serie->ultimo_correlativo;
        }

        return (int) ($serie->documentos()
            ->where('estado', FelDocument::ESTADO_EMITIDO)
            ->where(function ($query): void {
                $query->where('apisunat_mode', FelSerie::AMBIENTE_PRODUCCION)
                    ->orWhereNull('apisunat_mode');
            })
            ->max('correlativo') ?? 0);
    }

    public static function ultimoCorrelativoEfectivo(FelSerie $serie): int
    {
        if ($serie->esSandbox()) {
            return (int) $serie->ultimo_correlativo;
        }

        return max((int) $serie->ultimo_correlativo, self::ultimoCorrelativoEmitido($serie));
    }

    public static function proximoCorrelativo(FelSerie $serie): int
    {
        if ($serie->esSandbox()) {
            return self::proximoCorrelativoSandbox($serie);
        }

        return self::ultimoCorrelativoEfectivo($serie) + 1;
    }

    public static function proximoCorrelativoSandbox(FelSerie $serie): int
    {
        $maxEmitido = (int) ($serie->documentos()
            ->whereIn('estado', [
                FelDocument::ESTADO_EMITIDO,
                FelDocument::ESTADO_PENDIENTE,
                FelDocument::ESTADO_RECHAZADO,
            ])
            ->where('apisunat_mode', FelSerie::AMBIENTE_SANDBOX)
            ->max('correlativo') ?? 0);

        return max((int) $serie->ultimo_correlativo, $maxEmitido) + 1;
    }

    public static function numeroCompleto(FelSerie $serie, int $correlativo): string
    {
        return $serie->serie.'-'.str_pad((string) $correlativo, 8, '0', STR_PAD_LEFT);
    }

    public static function sincronizarUltimoCorrelativo(FelSerie $serie): FelSerie
    {
        if ($serie->esSandbox()) {
            return $serie;
        }

        $emitido = self::ultimoCorrelativoEmitido($serie);

        if ($emitido > (int) $serie->ultimo_correlativo) {
            $serie->update(['ultimo_correlativo' => $emitido]);
            $serie->refresh();
        }

        return $serie;
    }

    public static function tieneDocumentosProduccion(FelSerie $serie): bool
    {
        if ($serie->esSandbox()) {
            return false;
        }

        return $serie->documentos()
            ->where('estado', FelDocument::ESTADO_EMITIDO)
            ->where(function ($query): void {
                $query->where('apisunat_mode', FelSerie::AMBIENTE_PRODUCCION)
                    ->orWhereNull('apisunat_mode');
            })
            ->exists();
    }

    public static function soloDocumentosSandbox(FelSerie $serie): bool
    {
        if (! $serie->documentos()->exists()) {
            return false;
        }

        return ! self::tieneDocumentosProduccion($serie);
    }

    /**
     * @return array<string, mixed>
     */
    public static function serialize(FelSerie $serie): array
    {
        $serie = self::sincronizarUltimoCorrelativo($serie);

        $ultimo = self::ultimoCorrelativoEfectivo($serie);
        $proximo = self::proximoCorrelativo($serie);
        $ultimoEmitidoSandbox = $serie->esSandbox()
            ? (int) ($serie->documentos()
                ->where('estado', FelDocument::ESTADO_EMITIDO)
                ->where('apisunat_mode', FelSerie::AMBIENTE_SANDBOX)
                ->max('correlativo') ?? 0)
            : null;

        return [
            'id' => $serie->id,
            'tipo_comprobante' => $serie->tipo_comprobante,
            'tipo_label' => FelSerie::labelTipo($serie->tipo_comprobante),
            'serie' => $serie->serie,
            'ambiente' => $serie->ambiente,
            'ultimo_correlativo' => $ultimo,
            'proximo_correlativo' => $proximo,
            'proximo_numero_completo' => self::numeroCompleto($serie, $proximo),
            'ultimo_emitido_sandbox' => $ultimoEmitidoSandbox,
            'avance_correlativo' => true,
            'activo' => $serie->activo,
            'es_predeterminada' => (bool) $serie->es_predeterminada,
            'tiene_documentos' => $serie->documentos()->exists(),
            'tiene_documentos_produccion' => self::tieneDocumentosProduccion($serie),
            'puede_eliminar' => $serie->esSandbox()
                ? true
                : ! self::tieneDocumentosProduccion($serie),
        ];
    }
}
