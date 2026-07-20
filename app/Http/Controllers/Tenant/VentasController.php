<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\VoidSaleRequest;
use App\Models\Tenant\CfgSetting;
use App\Models\Tenant\Sale;
use App\Support\DateTime\ApiDateTime;
use App\Support\Fel\FelDocumentPresenter;
use App\Services\Fel\FelEmisionVentaService;
use App\Services\Tenant\SaleService;
use App\Services\Tenant\SaleTicketSerializer;
use App\Services\Tenant\SalesReportService;
use App\Tenancy\TenantManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VentasController extends Controller
{
    public function __construct(
        private readonly SaleTicketSerializer $tickets,
        private readonly SaleService $sales,
        private readonly SalesReportService $reports,
        private readonly FelEmisionVentaService $felEmision,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('tenant.sales.manage'), 403);

        $settings = CfgSetting::ensureDefaults();
        $filters = $this->reports->resolveFilters(
            $request->string('date_from')->toString() ?: null,
            $request->string('date_to')->toString() ?: null,
        );

        $estado = $request->string('estado')->toString() ?: 'pagada';
        if (! in_array($estado, ['pagada', 'anulada', 'all'], true)) {
            $estado = 'pagada';
        }

        $metodo = $request->string('metodo')->toString() ?: 'all';
        $chargeMethods = ['efectivo', 'tarjeta', 'yape', 'plin'];
        if ($metodo !== 'all' && ! in_array($metodo, $chargeMethods, true)) {
            $metodo = 'all';
        }

        $salesQuery = Sale::query()
            ->whereBetween('created_at', [$filters['start'], $filters['end']])
            ->when($estado !== 'all', fn ($query) => $query->where('estado', $estado))
            ->when($metodo !== 'all', fn ($query) => $query->whereHas(
                'payments',
                fn ($paymentQuery) => $paymentQuery->where('metodo', $metodo),
            ))
            ->with([
                'cajero:id,name',
                'payments:sale_id,metodo,monto',
                'order:id,number,table_id',
                'order.table:id,number',
                'anuladoPor:id,name',
                'felDocument:id,sale_id,numero_completo,estado,url_pdf,url_xml,url_cdr,proveedor_ref,apisunat_mode,apisunat_payload,error_mensaje,emitido_at',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        $filteredTotal = (float) (clone $salesQuery)->sum('total');

        $sales = (clone $salesQuery)
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Sale $sale): array => $this->serializeListRow($sale, $filters['timezone']));

        return Inertia::render('ventas/index', [
            'sales' => $sales,
            'filters' => [
                'date_from' => $filters['from'],
                'date_to' => $filters['to'],
                'estado' => $estado,
                'metodo' => $metodo,
            ],
            'stats' => [
                'filtered_total' => round($filteredTotal, 2),
            ],
            'payment_methods' => $chargeMethods,
            'currency' => (string) $settings->currency,
            'can' => [
                'manage' => true,
                'void' => true,
                'emit_fel' => (bool) $request->user()?->can('tenant.invoicing.manage'),
            ],
        ]);
    }

    public function show(Request $request, Sale $venta): Response
    {
        abort_unless((bool) $request->user()?->can('tenant.sales.manage'), 403);
        abort_if($venta->estado === 'pendiente', 404);

        $venta->loadMissing('felDocument');

        $timezone = app(TenantManager::class)->tenant()?->timezone ?: 'America/Lima';
        $canVoid = $venta->isPaid()
            && $venta->created_at?->timezone($timezone)->isToday();
        $canEmitFel = (bool) $request->user()?->can('tenant.invoicing.manage')
            && in_array($venta->tipo_comprobante, ['boleta', 'factura'], true)
            && in_array($venta->fel_estado, ['sin_cpe', 'rechazado', 'pendiente_emision'], true);

        return Inertia::render('ventas/show', [
            'ticket' => $this->tickets->serialize($venta),
            'can' => [
                'void' => $canVoid,
                'emit_fel' => $canEmitFel,
            ],
        ]);
    }

    public function void(VoidSaleRequest $request, Sale $venta): RedirectResponse
    {
        $this->sales->voidSale(
            $venta,
            $request->user(),
            (string) $request->validated('motivo'),
        );

        return redirect()
            ->route('ventas.index')
            ->with('success', __('messages.ventas.void_success'));
    }

    public function emitFel(Request $request, Sale $venta): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.invoicing.manage'), 403);

        try {
            $this->felEmision->emitir($venta);
        } catch (\Throwable $e) {
            $venta->refresh()->load(['felDocument', 'items', 'payments', 'cajero', 'order.table.area', 'order.waiter']);

            return $this->redirectAfterFelEmission($request, $venta, false, $e->getMessage());
        }

        $venta->refresh()->load(['felDocument', 'items', 'payments', 'cajero', 'order.table.area', 'order.waiter']);

        return $this->redirectAfterFelEmission($request, $venta, true);
    }

    private function redirectAfterFelEmission(
        Request $request,
        Sale $venta,
        bool $success,
        ?string $errorMessage = null,
    ): RedirectResponse {
        $returnTo = $request->string('return_to')->toString();

        if ($returnTo === 'caja') {
            $redirect = redirect()->route('caja.index')
                ->with('sale_ticket', $this->tickets->serialize($venta));

            if ($success && $venta->fel_estado === 'emitido') {
                return $redirect->with('success', __('messages.fel.emission_success'));
            }

            $motivo = $venta->felDocument?->error_mensaje ?? $errorMessage;

            return $redirect->with(
                'warning',
                filled($motivo)
                    ? __('messages.fel.emission_failed_checkout_reason', ['reason' => $motivo])
                    : __('messages.fel.emission_failed_checkout'),
            );
        }

        if (! $success) {
            return back()->withErrors(['fel' => $errorMessage ?? __('messages.fel.not_emitible')]);
        }

        return back()->with('success', __('messages.fel.emission_success'));
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeListRow(Sale $sale, string $timezone): array
    {
        $payment = $sale->payments->first();
        $canVoid = $sale->isPaid()
            && $sale->created_at?->timezone($timezone)->isToday();

        return [
            'id' => $sale->id,
            'numero' => $sale->numero,
            'estado' => $sale->estado,
            'tipo_comprobante' => $sale->tipo_comprobante ?? 'nota_venta',
            'fel_estado' => $sale->fel_estado ?? 'sin_cpe',
            'total' => (float) $sale->total,
            'created_at' => ApiDateTime::toUtcIso($sale->created_at),
            'anulada_en' => ApiDateTime::toUtcIso($sale->anulada_en),
            'motivo_anulacion' => $sale->motivo_anulacion,
            'cajero' => $sale->cajero?->only(['id', 'name']),
            'anulado_por' => $sale->anuladoPor?->only(['id', 'name']),
            'metodo' => $payment?->metodo,
            'order_number' => $sale->order?->number,
            'table' => $sale->order?->table ? [
                'number' => $sale->order->table->number,
            ] : null,
            'fel' => $sale->felDocument
                ? FelDocumentPresenter::forList($sale->felDocument, $sale->id)
                : null,
            'can_void' => $canVoid,
            'can_emit_fel' => in_array($sale->tipo_comprobante, ['boleta', 'factura'], true)
                && in_array($sale->fel_estado, ['sin_cpe', 'rechazado', 'pendiente_emision'], true),
        ];
    }
}
