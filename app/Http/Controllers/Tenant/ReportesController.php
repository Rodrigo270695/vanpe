<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\CfgSetting;
use App\Models\Tenant\Sale;
use App\Services\Tenant\SalesReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportesController extends Controller
{
    public function __construct(
        private readonly SalesReportService $reports,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('tenant.reports.view'), 403);

        $settings = CfgSetting::ensureDefaults();
        $filters = $this->reports->resolveFilters(
            $request->string('date_from')->toString() ?: null,
            $request->string('date_to')->toString() ?: null,
        );

        $report = $this->reports->build(
            $filters['start'],
            $filters['end'],
            $filters['from'],
            $filters['to'],
            $filters['timezone'],
        );

        $sales = Sale::query()
            ->where('estado', 'pagada')
            ->whereBetween('created_at', [$filters['start'], $filters['end']])
            ->with([
                'cajero:id,name',
                'payments:sale_id,metodo,monto',
                'order:id,number,table_id',
                'order.table:id,number',
            ])
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Sale $sale): array => $this->serializeRow($sale));

        return Inertia::render('reportes/index', [
            'report' => $report,
            'sales' => $sales,
            'filters' => [
                'date_from' => $filters['from'],
                'date_to' => $filters['to'],
            ],
            'currency' => (string) $settings->currency,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeRow(Sale $sale): array
    {
        $payment = $sale->payments->first();

        return [
            'id' => $sale->id,
            'numero' => $sale->numero,
            'total' => (float) $sale->total,
            'created_at' => $sale->created_at?->toIso8601String(),
            'cajero' => $sale->cajero?->only(['id', 'name']),
            'metodo' => $payment?->metodo,
            'order_number' => $sale->order?->number,
            'table' => $sale->order?->table ? [
                'number' => $sale->order->table->number,
            ] : null,
        ];
    }
}
