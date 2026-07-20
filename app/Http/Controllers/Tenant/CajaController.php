<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\ChargeOrderRequest;
use App\Http\Requests\Tenant\CloseCashSessionRequest;
use App\Http\Requests\Tenant\OpenCashSessionRequest;
use App\Models\Tenant\CashSession;
use App\Models\Tenant\CfgSetting;
use App\Models\Tenant\FelSerie;
use App\Support\Fel\FelSeriePresenter;
use App\Models\Tenant\Order;
use App\Services\Tenant\CashSessionService;
use App\Services\Tenant\SaleService;
use App\Services\Tenant\SaleTicketSerializer;
use App\Support\DateTime\ApiDateTime;
use App\Support\Fel\ApisunatCredentialResolver;
use App\Support\Fel\FelSerieResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CajaController extends Controller
{
    public function __construct(
        private readonly CashSessionService $cashSessions,
        private readonly SaleService $sales,
        private readonly SaleTicketSerializer $tickets,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('tenant.sales.manage'), 403);

        $session = $this->cashSessions->getOpenSession();
        $settings = CfgSetting::ensureDefaults();
        $summary = $session !== null ? $this->cashSessions->summarize($session) : null;

        $pendingOrders = Order::query()
            ->where('status', 'served')
            ->with([
                'table:id,number,area_id',
                'table.area:id,name',
                'waiter:id,name',
                'items:id,order_id,name_snapshot,quantity,subtotal',
            ])
            ->orderBy('opened_at')
            ->get()
            ->map(fn (Order $order): array => $this->serializePendingOrder($order));

        $history = CashSession::query()
            ->where('estado', 'cerrada')
            ->with('cajero:id,name')
            ->orderByDesc('cerrada_en')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (CashSession $closed): array => $this->serializeHistorySession($closed));

        return Inertia::render('caja/index', [
            'session' => $session !== null ? $this->serializeSession($session, $summary) : null,
            'pendingOrders' => $pendingOrders,
            'history' => $history,
            'currency' => (string) $settings->currency,
            'saleTicket' => $request->session()->pull('sale_ticket'),
            'fel' => $this->serializeFelConfig($settings),
            'can' => [
                'manage' => true,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeFelConfig(CfgSetting $settings): array
    {
        $enabled = ApisunatCredentialResolver::estaConfigurado($settings);
        $credenciales = $enabled ? ApisunatCredentialResolver::fromSettings($settings) : null;
        $mode = $credenciales['mode'] ?? 'sandbox';

        $series = FelSerie::query()
            ->where('activo', true)
            ->orderBy('tipo_comprobante')
            ->orderBy('ambiente')
            ->orderBy('serie')
            ->get()
            ->map(fn (FelSerie $row): array => FelSeriePresenter::serialize($row));

        $resolver = app(FelSerieResolver::class);

        return [
            'enabled' => $enabled,
            'issues_electronic_receipts' => (bool) $settings->issues_electronic_receipts,
            'emite_comprobantes_sunat' => (bool) $settings->emite_comprobantes_sunat,
            'apisunat_mode' => $mode,
            'has_boleta_series' => $resolver->existePredeterminada(FelSerie::TIPO_BOLETA, $mode),
            'has_factura_series' => $resolver->existePredeterminada(FelSerie::TIPO_FACTURA, $mode),
            'series' => $series->values()->all(),
        ];
    }

    public function open(OpenCashSessionRequest $request): RedirectResponse
    {
        $this->cashSessions->open(
            $request->user(),
            (float) $request->validated('monto_apertura'),
        );

        return redirect()
            ->route('caja.index')
            ->with('success', __('messages.caja.session_opened'));
    }

    public function close(CloseCashSessionRequest $request): RedirectResponse
    {
        $session = $this->cashSessions->getOpenSession();

        abort_unless($session !== null, 422);

        $closed = $this->cashSessions->close(
            $session,
            (float) $request->validated('monto_cierre'),
            $request->validated('notas_cierre'),
        );

        return redirect()
            ->route('caja.index')
            ->with('success', __('messages.caja.session_closed_success', [
                'diferencia' => number_format((float) $closed->diferencia, 2),
            ]));
    }

    public function charge(ChargeOrderRequest $request, Order $pedido): RedirectResponse
    {
        $session = $this->cashSessions->getOpenSession();

        abort_unless($session !== null, 422);

        $sale = $this->sales->chargeOrder(
            $pedido,
            $session,
            $request->user(),
            (string) $request->validated('metodo'),
            $request->validated('referencia'),
            $request->filled('monto_recibido')
                ? (float) $request->validated('monto_recibido')
                : null,
            (string) ($request->validated('tipo_comprobante') ?? 'nota_venta'),
            $request->filled('cliente_tipo_doc')
                ? (int) $request->validated('cliente_tipo_doc')
                : null,
            $request->validated('cliente_num_doc'),
            $request->validated('cliente_nombre'),
            $request->validated('cliente_direccion'),
        );

        $sale->refresh()->load(['items', 'payments', 'cajero', 'order.table.area', 'order.waiter', 'felDocument']);

        $redirect = redirect()->route('caja.index');

        if ($sale->fel_estado === 'rechazado') {
            $motivo = $sale->felDocument?->error_mensaje;
            $redirect->with(
                'warning',
                filled($motivo)
                    ? __('messages.fel.emission_failed_checkout_reason', ['reason' => $motivo])
                    : __('messages.fel.emission_failed_checkout'),
            );
        } else {
            $redirect->with('success', __('messages.caja.charge_success', [
                'numero' => $sale->numero,
                'total' => number_format((float) $sale->total, 2),
            ]));
        }

        return $redirect->with('sale_ticket', $this->tickets->serialize($sale));
    }

    /**
     * @param  array<string, mixed>|null  $summary
     * @return array<string, mixed>
     */
    private function serializeSession(CashSession $session, ?array $summary): array
    {
        $montoEsperado = $summary !== null
            ? round((float) $session->monto_apertura + $summary['efectivo'], 2)
            : (float) $session->monto_apertura;

        return [
            'id' => $session->id,
            'monto_apertura' => (float) $session->monto_apertura,
            'monto_esperado_efectivo' => $montoEsperado,
            'total_ventas' => $summary['total_ventas'] ?? 0.0,
            'abierta_en' => ApiDateTime::toUtcIso($session->abierta_en),
            'cajero' => $session->cajero?->only(['id', 'name']),
            'summary' => $summary,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializePendingOrder(Order $order): array
    {
        return [
            'id' => $order->id,
            'number' => $order->number,
            'total' => (float) $order->total,
            'subtotal' => (float) $order->subtotal,
            'discount' => (float) $order->discount,
            'opened_at' => ApiDateTime::toUtcIso($order->opened_at),
            'table' => $order->table ? [
                'number' => $order->table->number,
                'area' => $order->table->area?->name,
            ] : null,
            'waiter' => $order->waiter?->only(['id', 'name']),
            'items_count' => $order->items->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeHistorySession(CashSession $session): array
    {
        return [
            'id' => $session->id,
            'monto_apertura' => (float) $session->monto_apertura,
            'monto_cierre' => (float) $session->monto_cierre,
            'monto_esperado_efectivo' => (float) $session->monto_esperado_efectivo,
            'diferencia' => (float) $session->diferencia,
            'total_ventas' => (float) $session->total_ventas,
            'abierta_en' => ApiDateTime::toUtcIso($session->abierta_en),
            'cerrada_en' => ApiDateTime::toUtcIso($session->cerrada_en),
            'notas_cierre' => $session->notas_cierre,
            'cajero' => $session->cajero?->only(['id', 'name']),
            'summary' => $this->cashSessions->summarize($session),
        ];
    }
}
