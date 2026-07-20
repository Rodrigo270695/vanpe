<?php

namespace App\Support\Fel;

use App\Models\Tenant\FelDocument;
use App\Support\DateTime\ApiDateTime;

final class FelDocumentPresenter
{
    /**
     * @return array<string, mixed>
     */
    public static function forList(FelDocument $document, ?string $saleId = null): array
    {
        $pdfTicket = $document->url_pdf;
        $pdfA4 = self::buildA4FromTicket($pdfTicket);

        return [
            'id' => $document->id,
            'numero_completo' => $document->numero_completo,
            'estado' => $document->estado,
            'url_pdf' => $pdfTicket,
            'url_pdf_ticket' => $pdfTicket,
            'url_pdf_a4' => $pdfA4,
            'apisunat_mode' => FelDocumentApisunatModeResolver::resolveAndPersist($document),
            'sunat_estado' => self::resolveSunatEstado($document),
            'tiene_xml' => filled($document->url_xml),
            'tiene_cdr' => filled($document->url_cdr),
            'tiene_json' => is_array($document->apisunat_payload) && $document->apisunat_payload !== [],
            'error_mensaje' => $document->error_mensaje,
            'emitido_at' => ApiDateTime::toUtcIso($document->emitido_at),
            'created_at' => ApiDateTime::toUtcIso($document->created_at),
            'sort_at' => ApiDateTime::toUtcIso($document->emitido_at ?? $document->created_at),
            'sale_id' => $saleId ?? $document->sale_id,
            'download_xml_url' => route('facturacion.documentos.xml', $document),
            'download_cdr_url' => route('facturacion.documentos.cdr', $document),
            'json_url' => route('facturacion.documentos.json', $document),
            'can_reemit' => self::puedeReemitir($document),
        ];
    }

    public static function puedeReemitir(FelDocument $document): bool
    {
        if ($document->estado !== FelDocument::ESTADO_RECHAZADO) {
            return false;
        }

        $sale = $document->relationLoaded('sale')
            ? $document->sale
            : $document->sale()->first();

        return $sale !== null
            && $sale->isPaid()
            && in_array($sale->tipo_comprobante, ['boleta', 'factura'], true);
    }

    public static function resolveSunatEstado(FelDocument $document): ?string
    {
        $ref = strtolower((string) ($document->proveedor_ref ?? ''));
        if (str_starts_with($ref, 'apisunat:')) {
            $estado = strtolower(substr($ref, strlen('apisunat:')));

            return $estado !== '' ? $estado : null;
        }

        $payload = $document->apisunat_payload;
        if (is_array($payload)) {
            $estado = strtoupper((string) (($payload['payload'] ?? [])['estado'] ?? ''));
            if ($estado !== '') {
                return strtolower($estado);
            }
        }

        return null;
    }

    public static function buildA4FromTicket(?string $ticketUrl): ?string
    {
        if ($ticketUrl === null || $ticketUrl === '') {
            return null;
        }

        if (str_contains($ticketUrl, '/pdf/a4/')) {
            return $ticketUrl;
        }

        if (str_contains($ticketUrl, '/pdf/ticket/')) {
            return str_replace('/pdf/ticket/', '/pdf/a4/', $ticketUrl);
        }

        return null;
    }
}
