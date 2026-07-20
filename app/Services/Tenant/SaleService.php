<?php

namespace App\Services\Tenant;

use App\Models\Tenant\CashSession;
use App\Models\Tenant\CfgSetting;
use App\Models\Tenant\Order;
use App\Models\Tenant\Payment;
use App\Models\Tenant\RstTable;
use App\Models\Tenant\Sale;
use App\Models\Tenant\SaleItem;
use App\Models\Tenant\User;
use App\Services\Fel\FelEmisionVentaService;
use App\Models\Tenant\FelSerie;
use App\Support\Fel\ApisunatCredentialResolver;
use App\Support\Fel\FelSeriePresenter;
use App\Support\Fel\FelReceptorResolver;
use App\Support\Fel\FelSerieResolver;
use App\Tenancy\TenantManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleService
{
    public function chargeOrder(
        Order $order,
        CashSession $session,
        User $cajero,
        string $metodo,
        ?string $referencia = null,
        ?float $montoRecibido = null,
        string $tipoComprobante = 'nota_venta',
        ?int $clienteTipoDoc = null,
        ?string $clienteNumDoc = null,
        ?string $clienteNombre = null,
        ?string $clienteDireccion = null,
    ): Sale {
        if (! $session->isOpen()) {
            throw ValidationException::withMessages([
                'session' => __('messages.caja.session_not_open'),
            ]);
        }

        if (! in_array($metodo, ['efectivo', 'tarjeta', 'yape', 'plin'], true)) {
            throw ValidationException::withMessages([
                'metodo' => __('messages.caja.invalid_payment_method'),
            ]);
        }

        if (! in_array($tipoComprobante, Sale::COMPROBANTE_TYPES, true)) {
            throw ValidationException::withMessages([
                'tipo_comprobante' => __('messages.fel.invalid_document_type'),
            ]);
        }

        $settings = CfgSetting::ensureDefaults();

        if (in_array($tipoComprobante, ['boleta', 'factura'], true)) {
            if (! ApisunatCredentialResolver::estaConfigurado($settings)) {
                throw ValidationException::withMessages([
                    'tipo_comprobante' => __('messages.fel.apisunat_not_configured'),
                ]);
            }

            if (! $settings->emite_comprobantes_sunat) {
                throw ValidationException::withMessages([
                    'tipo_comprobante' => __('messages.fel.apisunat_not_configured'),
                ]);
            }

            if (! $settings->issues_electronic_receipts) {
                throw ValidationException::withMessages([
                    'tipo_comprobante' => __('messages.fel.tax_settings_required'),
                ]);
            }

            $this->validarSeriePredeterminada($settings, $tipoComprobante);
        }

        if ($tipoComprobante === 'factura') {
            $digits = preg_replace('/\D+/', '', (string) $clienteNumDoc) ?? '';
            if (strlen($digits) !== 11) {
                throw ValidationException::withMessages([
                    'cliente_num_doc' => __('messages.fel.invoice_requires_ruc'),
                ]);
            }
            if (trim((string) $clienteNombre) === '') {
                throw ValidationException::withMessages([
                    'cliente_nombre' => __('messages.fel.customer_name_required'),
                ]);
            }
        }

        if ($order->status !== 'served') {
            throw ValidationException::withMessages([
                'order' => __('messages.caja.order_not_ready_to_pay'),
            ]);
        }

        if ($order->items()->count() === 0) {
            throw ValidationException::withMessages([
                'order' => __('messages.pedidos.empty_order'),
            ]);
        }

        $total = (float) $order->total;

        if ($metodo === 'efectivo' && $montoRecibido !== null && $montoRecibido < $total) {
            throw ValidationException::withMessages([
                'monto_recibido' => __('messages.caja.insufficient_cash'),
            ]);
        }

        $alreadyPaid = Sale::query()
            ->where('order_id', $order->id)
            ->where('estado', 'pagada')
            ->exists();

        if ($alreadyPaid) {
            throw ValidationException::withMessages([
                'order' => __('messages.caja.order_already_paid'),
            ]);
        }

        $order->loadMissing('items');

        $receptor = FelReceptorResolver::datosDesdeEntrada(
            $clienteTipoDoc ?? FelReceptorResolver::tipoDocSunatDesdeEtiqueta(
                $tipoComprobante === 'factura' ? 'RUC' : 'DNI',
            ),
            $clienteNumDoc,
            $clienteNombre,
            $clienteDireccion,
        );

        if ($tipoComprobante === 'factura') {
            $receptor['tipo_doc'] = 6;
        }

        $resolvedFelSerieId = $this->resolverFelSeriePredeterminadaId(
            $settings,
            $tipoComprobante,
        );

        return DB::transaction(function () use (
            $order,
            $session,
            $cajero,
            $metodo,
            $referencia,
            $montoRecibido,
            $settings,
            $tipoComprobante,
            $receptor,
            $resolvedFelSerieId,
        ): Sale {
            $subtotal = (float) $order->subtotal;
            $descuento = (float) $order->discount;
            $igv = $this->resolveIgv($subtotal, $descuento, $settings);
            $total = (float) $order->total;

            $sale = Sale::query()->create([
                'numero' => $this->nextDailyNumber(),
                'order_id' => $order->id,
                'cash_session_id' => $session->id,
                'cajero_id' => $cajero->id,
                'subtotal' => $subtotal,
                'igv' => $igv,
                'descuento' => $descuento,
                'total' => $total,
                'estado' => 'pagada',
                'tipo_comprobante' => $tipoComprobante,
                'fel_estado' => $tipoComprobante === 'nota_venta' ? 'sin_cpe' : 'sin_cpe',
                'fel_serie_id' => in_array($tipoComprobante, ['boleta', 'factura'], true)
                    ? $resolvedFelSerieId
                    : null,
                'cliente_tipo_doc' => in_array($tipoComprobante, ['boleta', 'factura'], true)
                    ? $receptor['tipo_doc']
                    : null,
                'cliente_num_doc' => in_array($tipoComprobante, ['boleta', 'factura'], true)
                    ? $receptor['num_doc']
                    : null,
                'cliente_nombre' => in_array($tipoComprobante, ['boleta', 'factura'], true)
                    ? $receptor['nombre']
                    : null,
                'cliente_direccion' => in_array($tipoComprobante, ['boleta', 'factura'], true)
                    ? $receptor['direccion']
                    : null,
            ]);

            foreach ($order->items as $item) {
                SaleItem::query()->create([
                    'sale_id' => $sale->id,
                    'nombre_snapshot' => $item->name_snapshot,
                    'precio_snapshot' => $item->price_snapshot,
                    'cantidad' => $item->quantity,
                    'subtotal' => $item->subtotal,
                ]);
            }

            Payment::query()->create([
                'sale_id' => $sale->id,
                'cajero_id' => $cajero->id,
                'metodo' => $metodo,
                'monto' => $total,
                'monto_recibido' => $metodo === 'efectivo' ? $montoRecibido : null,
                'referencia' => $referencia,
                'recibido_en' => now(),
            ]);

            $order->update([
                'status' => 'closed',
                'closed_at' => now(),
            ]);

            if ($order->table_id !== null) {
                $this->syncTableStatus($order->table);
            }

            $summary = app(CashSessionService::class)->summarize($session);
            $session->update(['total_ventas' => $summary['total_ventas']]);

            $summary = app(CashSessionService::class)->summarize($session);
            $session->update(['total_ventas' => $summary['total_ventas']]);

            $sale = $sale->load(['items', 'payments']);

            if ($sale->requiresFel()) {
                try {
                    app(FelEmisionVentaService::class)->emitir($sale);
                    $sale->refresh()->load(['felDocument', 'items', 'payments']);
                } catch (\Throwable) {
                    $sale->refresh()->load(['felDocument', 'items', 'payments']);
                }
            }

            return $sale;
        });
    }

    public function voidSale(Sale $sale, User $user, string $motivo): Sale
    {
        if (! $sale->isPaid()) {
            throw ValidationException::withMessages([
                'sale' => __('messages.ventas.void_not_paid'),
            ]);
        }

        $timezone = app(TenantManager::class)->tenant()?->timezone ?: 'America/Lima';
        $saleDate = $sale->created_at?->timezone($timezone)->toDateString();
        $today = now($timezone)->toDateString();

        if ($saleDate !== $today) {
            throw ValidationException::withMessages([
                'sale' => __('messages.ventas.void_same_day_only'),
            ]);
        }

        return DB::transaction(function () use ($sale, $user, $motivo): Sale {
            $sale->update([
                'estado' => 'anulada',
                'anulada_en' => now(),
                'anulado_por' => $user->id,
                'motivo_anulacion' => $motivo,
            ]);

            if ($sale->cash_session_id !== null) {
                $session = CashSession::query()->find($sale->cash_session_id);

                if ($session !== null) {
                    $summary = app(CashSessionService::class)->summarize($session);
                    $session->update(['total_ventas' => $summary['total_ventas']]);
                }
            }

            return $sale->fresh(['items', 'payments', 'anuladoPor:id,name']);
        });
    }

    private function resolveIgv(float $subtotal, float $descuento, CfgSetting $settings): float
    {
        if (! $settings->issues_electronic_receipts) {
            return 0.0;
        }

        $base = max(0, $subtotal - $descuento);
        $rate = (float) $settings->tax_rate;

        if ($settings->prices_include_tax && $rate > 0) {
            return round($base - ($base / (1 + ($rate / 100))), 2);
        }

        return round($base * ($rate / 100), 2);
    }

    private function syncTableStatus(?RstTable $table): void
    {
        if ($table === null) {
            return;
        }

        $hasActive = Order::query()
            ->where('table_id', $table->id)
            ->whereIn('status', Order::ACTIVE_STATUSES)
            ->exists();

        if (! $hasActive && $table->status === 'occupied') {
            $table->update(['status' => 'free']);
        }
    }

    private function nextDailyNumber(): string
    {
        $timezone = app(TenantManager::class)->tenant()?->timezone ?: 'America/Lima';
        $today = now($timezone)->toDateString();

        $count = Sale::query()
            ->whereDate('created_at', $today)
            ->count();

        return sprintf('V-%03d', $count + 1);
    }

    private function validarSeriePredeterminada(
        CfgSetting $settings,
        string $tipoComprobante,
    ): void {
        $tipoSunat = FelSerie::tipoDesdeComprobante($tipoComprobante);

        if ($tipoSunat === null) {
            return;
        }

        $ambiente = ApisunatCredentialResolver::fromSettings($settings)['mode'];
        $resolver = app(FelSerieResolver::class);

        if (! $resolver->existePredeterminada($tipoSunat, $ambiente)) {
            throw ValidationException::withMessages([
                'tipo_comprobante' => __('messages.fel.no_default_series', [
                    'tipo' => $tipoComprobante,
                    'ambiente' => $ambiente,
                ]),
            ]);
        }
    }

    private function resolverFelSeriePredeterminadaId(
        CfgSetting $settings,
        string $tipoComprobante,
    ): ?string {
        if (! in_array($tipoComprobante, ['boleta', 'factura'], true)) {
            return null;
        }

        $tipoSunat = FelSerie::tipoDesdeComprobante($tipoComprobante);
        $ambiente = ApisunatCredentialResolver::fromSettings($settings)['mode'];

        return app(FelSerieResolver::class)
            ->resolver((int) $tipoSunat, $ambiente)
            ->id;
    }
}
