<?php

namespace App\Services\Fel;

use App\Models\Tenant\CfgSetting;
use App\Models\Tenant\FelDocument;
use App\Models\Tenant\FelSerie;
use App\Models\Tenant\Sale;
use App\Support\Fel\ApisunatCredentialResolver;
use App\Support\Fel\FelSeriePresenter;
use App\Support\Fel\FelSerieResolver;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class FelEmisionVentaService
{
    public function __construct(
        private readonly ApisunatClient $apisunat,
        private readonly FelSerieResolver $felSeries,
    ) {}

    public function puedeEmitir(CfgSetting $settings, Sale $sale): bool
    {
        if (! $sale->isPaid()) {
            return false;
        }

        if (! in_array($sale->tipo_comprobante, ['boleta', 'factura'], true)) {
            return false;
        }

        if (! $this->estadoPermiteEmision($sale)) {
            return false;
        }

        return ApisunatCredentialResolver::estaConfigurado($settings);
    }

    public function emitir(Sale $sale): FelDocument
    {
        $settings = CfgSetting::ensureDefaults();

        if (! $this->puedeEmitir($settings, $sale)) {
            throw new RuntimeException(__('messages.fel.not_emitible'));
        }

        $credenciales = ApisunatCredentialResolver::fromSettings($settings);
        $emisionModo = $credenciales['mode'];
        $tipoComprobante = FelSerie::tipoDesdeComprobante($sale->tipo_comprobante);

        if ($tipoComprobante === null) {
            throw new RuntimeException(__('messages.fel.not_emitible'));
        }

        if ($tipoComprobante === FelSerie::TIPO_FACTURA && (int) $sale->cliente_tipo_doc !== 6) {
            throw new RuntimeException(__('messages.fel.invoice_requires_ruc'));
        }

        $receptor = [
            'tipo_doc' => (int) ($sale->cliente_tipo_doc ?? 1),
            'num_doc' => (string) ($sale->cliente_num_doc ?? '00000000'),
            'nombre' => (string) ($sale->cliente_nombre ?? 'CLIENTES VARIOS'),
            'direccion' => (string) ($sale->cliente_direccion ?? '-'),
        ];

        return DB::transaction(function () use ($sale, $settings, $credenciales, $tipoComprobante, $emisionModo, $receptor): FelDocument {
            $sale = Sale::query()->whereKey($sale->id)->lockForUpdate()->firstOrFail();

            if (! $this->estadoPermiteEmision($sale)) {
                throw new RuntimeException(__('messages.fel.already_processed'));
            }

            $serie = $this->felSeries->resolver($tipoComprobante, $emisionModo, true);

            if ($serie->esProduccion()) {
                $serie = FelSeriePresenter::sincronizarUltimoCorrelativo($serie);
            }

            $documentoPrevio = FelDocument::query()->where('sale_id', $sale->id)->first();
            $esReemision = $documentoPrevio !== null
                && $documentoPrevio->estado === FelDocument::ESTADO_RECHAZADO;

            $correlativo = $esReemision
                ? FelSeriePresenter::proximoCorrelativo($serie)
                : ($documentoPrevio?->correlativo ?? FelSeriePresenter::proximoCorrelativo($serie));
            $numeroCompleto = FelSeriePresenter::numeroCompleto($serie, $correlativo);

            $documento = FelDocument::query()->updateOrCreate(
                ['sale_id' => $sale->id],
                [
                    'fel_serie_id' => $serie->id,
                    'tipo_comprobante' => $tipoComprobante,
                    'serie' => $serie->serie,
                    'correlativo' => $correlativo,
                    'numero_completo' => $numeroCompleto,
                    'receptor_tipo_doc' => $receptor['tipo_doc'],
                    'receptor_num_doc' => $receptor['num_doc'],
                    'receptor_nombre' => $receptor['nombre'],
                    'subtotal' => $sale->subtotal,
                    'igv_monto' => $sale->igv,
                    'total' => $sale->total,
                    'moneda' => $settings->currency === 'USD' ? 'USD' : 'PEN',
                    'estado' => FelDocument::ESTADO_PENDIENTE,
                    'error_mensaje' => null,
                    'emitido_at' => null,
                    'apisunat_mode' => $emisionModo,
                ],
            );

            $sale->update([
                'fel_document_id' => $documento->id,
                'fel_estado' => 'pendiente_emision',
            ]);

            $payload = $this->apisunat->construirPayload(
                $sale,
                $settings,
                $tipoComprobante,
                $serie->serie,
                $correlativo,
                $receptor,
            );

            try {
                $respuesta = $this->apisunat->generarComprobante($credenciales, $payload);
            } catch (RuntimeException $e) {
                $this->marcarRechazado($documento, $sale, $e->getMessage(), $emisionModo);

                throw $e;
            }

            if (! $this->apisunat->respuestaExitosa($respuesta)) {
                $mensaje = $this->apisunat->extraerMensajeError($respuesta);
                $this->marcarRechazado($documento, $sale, $mensaje, $emisionModo);

                throw new RuntimeException($mensaje);
            }

            $enlaces = $this->apisunat->extraerEnlaces($respuesta);
            $estadoApisunat = strtoupper((string) (($respuesta['payload'] ?? [])['estado'] ?? ''));

            if (
                ($serie->esSandbox() && $emisionModo === FelSerie::AMBIENTE_SANDBOX)
                || ($serie->esProduccion() && $emisionModo === FelSerie::AMBIENTE_PRODUCCION)
            ) {
                $serie->update(['ultimo_correlativo' => $correlativo]);
            }

            $documento->update([
                'estado' => FelDocument::ESTADO_EMITIDO,
                'proveedor_ref' => $estadoApisunat !== '' ? 'apisunat:'.$estadoApisunat : null,
                'url_pdf' => $enlaces['pdf'],
                'url_xml' => $enlaces['xml'],
                'url_cdr' => $enlaces['cdr'],
                'enlace_consulta' => $enlaces['consulta'],
                'apisunat_payload' => $respuesta,
                'apisunat_mode' => $emisionModo,
                'error_mensaje' => null,
                'emitido_at' => now(),
            ]);

            $sale->update(['fel_estado' => 'emitido']);

            return $documento->fresh();
        });
    }

    private function estadoPermiteEmision(Sale $sale): bool
    {
        if (in_array($sale->fel_estado, ['pendiente_emision', 'rechazado'], true)) {
            return true;
        }

        return $sale->fel_estado === 'sin_cpe'
            && in_array($sale->tipo_comprobante, ['boleta', 'factura'], true);
    }

    private function marcarRechazado(
        FelDocument $documento,
        Sale $sale,
        string $mensaje,
        ?string $emisionModo = null,
    ): void {
        $documento->update([
            'estado' => FelDocument::ESTADO_RECHAZADO,
            'error_mensaje' => mb_substr($mensaje, 0, 2000),
            'apisunat_mode' => in_array($emisionModo, ['sandbox', 'produccion'], true)
                ? $emisionModo
                : $documento->apisunat_mode,
        ]);

        $sale->update(['fel_estado' => 'rechazado']);
    }
}
