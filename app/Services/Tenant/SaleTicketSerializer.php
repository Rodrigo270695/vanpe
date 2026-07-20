<?php

namespace App\Services\Tenant;

use App\Models\Tenant\CfgSetting;
use App\Models\Tenant\Sale;
use App\Models\Tenant;
use App\Support\DateTime\ApiDateTime;
use App\Support\Fel\FelDocumentPresenter;
use App\Tenancy\TenantManager;

class SaleTicketSerializer
{
    /**
     * @return array<string, mixed>
     */
    public function serialize(Sale $sale): array
    {
        $sale->loadMissing([
            'items',
            'payments',
            'cajero:id,name',
            'order.table.area:id,name',
            'order.waiter:id,name',
            'felDocument',
        ]);

        $settings = CfgSetting::ensureDefaults();
        $tenant = app(TenantManager::class)->tenant();

        $payment = $sale->payments->first();
        $montoRecibido = $payment?->monto_recibido !== null
            ? (float) $payment->monto_recibido
            : null;
        $vuelto = $payment?->isCash() && $montoRecibido !== null
            ? round(max(0, $montoRecibido - (float) $sale->total), 2)
            : null;

        return [
            'id' => $sale->id,
            'numero' => $sale->numero,
            'document_type' => $sale->tipo_comprobante ?? 'nota_venta',
            'fel_estado' => $sale->fel_estado ?? 'sin_cpe',
            'estado' => $sale->estado,
            'created_at' => ApiDateTime::toUtcIso($sale->created_at),
            'currency' => (string) $settings->currency,
            'tax_rate' => (float) $settings->tax_rate,
            'subtotal' => (float) $sale->subtotal,
            'subtotal_sin_igv' => $this->resolveSubtotalSinIgv(
                (float) $sale->subtotal,
                (float) $sale->descuento,
                (float) $sale->igv,
                $settings,
            ),
            'igv' => (float) $sale->igv,
            'descuento' => (float) $sale->descuento,
            'total' => (float) $sale->total,
            'prices_include_tax' => (bool) $settings->prices_include_tax,
            'business' => $this->serializeBusiness($tenant),
            'cajero' => $sale->cajero?->only(['id', 'name']),
            'customer' => $sale->cliente_nombre ? [
                'tipo_doc' => $sale->cliente_tipo_doc,
                'num_doc' => $sale->cliente_num_doc,
                'nombre' => $sale->cliente_nombre,
                'direccion' => $sale->cliente_direccion,
            ] : null,
            'fel' => $sale->felDocument
                ? FelDocumentPresenter::forList($sale->felDocument, $sale->id)
                : null,
            'order' => $sale->order ? [
                'number' => $sale->order->number,
                'table' => $sale->order->table ? [
                    'number' => $sale->order->table->number,
                    'area' => $sale->order->table->area?->name,
                ] : null,
                'waiter' => $sale->order->waiter?->only(['id', 'name']),
            ] : null,
            'items' => $sale->items->map(fn ($item): array => [
                'nombre' => $item->nombre_snapshot,
                'cantidad' => (float) $item->cantidad,
                'precio' => (float) $item->precio_snapshot,
                'subtotal' => (float) $item->subtotal,
            ])->values()->all(),
            'payment' => $payment ? [
                'metodo' => $payment->metodo,
                'monto' => (float) $payment->monto,
                'referencia' => $payment->referencia,
                'monto_recibido' => $montoRecibido,
                'vuelto' => $vuelto,
                'recibido_en' => ApiDateTime::toUtcIso($payment->recibido_en),
            ] : null,
            'can_emit_fel' => auth()->user()?->can('tenant.invoicing.manage')
                && in_array($sale->tipo_comprobante, ['boleta', 'factura'], true)
                && in_array($sale->fel_estado ?? 'sin_cpe', ['sin_cpe', 'rechazado', 'pendiente_emision'], true),
        ];
    }

    private function resolveSubtotalSinIgv(
        float $subtotal,
        float $descuento,
        float $igv,
        CfgSetting $settings,
    ): float {
        $base = max(0, $subtotal - $descuento);

        if ($settings->prices_include_tax && $igv > 0) {
            return round($base - $igv, 2);
        }

        return round($base, 2);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeBusiness(?Tenant $tenant): array
    {
        if ($tenant === null) {
            return [
                'name' => config('app.name'),
                'legal_name' => null,
                'ruc' => null,
                'address' => null,
                'logo_url' => null,
            ];
        }

        return [
            'name' => $tenant->nombre_comercial ?: $tenant->razon_social,
            'legal_name' => $tenant->razon_social,
            'ruc' => $tenant->ruc,
            'address' => $tenant->direccion,
            'logo_url' => $tenant->logo_url,
        ];
    }
}
