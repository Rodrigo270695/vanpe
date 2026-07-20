<?php

namespace App\Services\Tenant;

use App\Models\Tenant\Order;
use App\Models\Tenant\Payment;
use App\Models\Tenant\Sale;
use App\Models\Tenant\User;
use App\Tenancy\TenantManager;
use Carbon\Carbon;

class SalesReportService
{
    /**
     * @return array{
     *     timezone: string,
     *     from: string,
     *     to: string,
     *     start: Carbon,
     *     end: Carbon
     * }
     */
    public function resolveFilters(?string $dateFrom, ?string $dateTo): array
    {
        $timezone = app(TenantManager::class)->tenant()?->timezone ?: 'America/Lima';
        $from = $dateFrom ?: now($timezone)->toDateString();
        $to = $dateTo ?: $from;

        if ($from > $to) {
            [$from, $to] = [$to, $from];
        }

        return [
            'timezone' => $timezone,
            'from' => $from,
            'to' => $to,
            'start' => Carbon::parse($from, $timezone)->startOfDay()->utc(),
            'end' => Carbon::parse($to, $timezone)->endOfDay()->utc(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function build(Carbon $start, Carbon $end, string $from, string $to, string $timezone): array
    {
        $paidQuery = Sale::query()
            ->where('estado', 'pagada')
            ->whereBetween('created_at', [$start, $end]);

        $voidedQuery = Sale::query()
            ->where('estado', 'anulada')
            ->whereBetween('created_at', [$start, $end]);

        $salesCount = (clone $paidQuery)->count();
        $totalRevenue = (float) (clone $paidQuery)->sum('total');
        $voidedCount = (clone $voidedQuery)->count();
        $voidedTotal = (float) (clone $voidedQuery)->sum('total');

        return [
            'summary' => [
                'sales_count' => $salesCount,
                'total_revenue' => round($totalRevenue, 2),
                'average_ticket' => $salesCount > 0
                    ? round($totalRevenue / $salesCount, 2)
                    : 0.0,
                'voided_count' => $voidedCount,
                'voided_total' => round($voidedTotal, 2),
            ],
            'by_payment_method' => $this->paymentMethodBreakdown($start, $end),
            'by_day' => $this->salesByDay($from, $to, $start, $end, $timezone),
            'by_cashier' => $this->cashierBreakdown($start, $end),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function buildTodaySnapshot(): array
    {
        $filters = $this->resolveFilters(null, null);
        $report = $this->build(
            $filters['start'],
            $filters['end'],
            $filters['from'],
            $filters['to'],
            $filters['timezone'],
        );

        $openSession = app(CashSessionService::class)->getOpenSession();

        return [
            'sales_today' => $report['summary']['sales_count'],
            'revenue_today' => $report['summary']['total_revenue'],
            'average_ticket_today' => $report['summary']['average_ticket'],
            'voided_today' => $report['summary']['voided_count'],
            'orders_to_pay' => Order::query()->where('status', 'served')->count(),
            'cash_session_open' => $openSession !== null,
            'by_day' => $this->salesLast7Days($filters['timezone']),
            'by_payment_method' => $report['by_payment_method'],
        ];
    }

    /**
     * @return list<array{method: string, total: float, count: int}>
     */
    private function paymentMethodBreakdown(Carbon $start, Carbon $end): array
    {
        $aggregates = Payment::query()
            ->whereHas('sale', fn ($query) => $query
                ->where('estado', 'pagada')
                ->whereBetween('created_at', [$start, $end]))
            ->selectRaw('metodo, sum(monto) as total, count(*) as count')
            ->groupBy('metodo')
            ->get()
            ->keyBy('metodo');

        return collect(Payment::METHODS)
            ->map(fn (string $method): array => [
                'method' => $method,
                'total' => round((float) ($aggregates[$method]->total ?? 0), 2),
                'count' => (int) ($aggregates[$method]->count ?? 0),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{date: string, label: string, count: int, amount: float}>
     */
    private function salesByDay(
        string $from,
        string $to,
        Carbon $start,
        Carbon $end,
        string $timezone,
    ): array {
        $sales = Sale::query()
            ->where('estado', 'pagada')
            ->whereBetween('created_at', [$start, $end])
            ->get(['created_at', 'total']);

        /** @var array<string, array{count: int, amount: float}> $byDate */
        $byDate = [];

        foreach ($sales as $sale) {
            $key = $sale->created_at?->timezone($timezone)->toDateString();

            if ($key === null) {
                continue;
            }

            if (! array_key_exists($key, $byDate)) {
                $byDate[$key] = ['count' => 0, 'amount' => 0.0];
            }

            $byDate[$key]['count']++;
            $byDate[$key]['amount'] += (float) $sale->total;
        }

        $result = [];
        $cursor = Carbon::parse($from, $timezone)->startOfDay();
        $last = Carbon::parse($to, $timezone)->startOfDay();

        while ($cursor->lte($last)) {
            $key = $cursor->toDateString();
            $result[] = [
                'date' => $key,
                'label' => $cursor->isoFormat('ddd D'),
                'count' => $byDate[$key]['count'] ?? 0,
                'amount' => round($byDate[$key]['amount'] ?? 0, 2),
            ];
            $cursor->addDay();
        }

        return $result;
    }

    /**
     * @return list<array{date: string, label: string, count: int, amount: float}>
     */
    private function salesLast7Days(string $timezone): array
    {
        $to = now($timezone)->toDateString();
        $from = now($timezone)->subDays(6)->toDateString();
        $start = Carbon::parse($from, $timezone)->startOfDay()->utc();
        $end = Carbon::parse($to, $timezone)->endOfDay()->utc();

        return $this->salesByDay($from, $to, $start, $end, $timezone);
    }

    /**
     * @return list<array{cajero: array{id: int, name: string}|null, sales_count: int, total: float}>
     */
    private function cashierBreakdown(Carbon $start, Carbon $end): array
    {
        $rows = Sale::query()
            ->where('estado', 'pagada')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('cajero_id, count(*) as sales_count, sum(total) as total')
            ->groupBy('cajero_id')
            ->orderByDesc('total')
            ->get();

        $cajeros = User::query()
            ->whereIn('id', $rows->pluck('cajero_id')->filter()->all())
            ->get(['id', 'name'])
            ->keyBy('id');

        return $rows->map(function (Sale $row) use ($cajeros): array {
            $cajero = $row->cajero_id !== null
                ? $cajeros->get($row->cajero_id)?->only(['id', 'name'])
                : null;

            return [
                'cajero' => $cajero,
                'sales_count' => (int) $row->sales_count,
                'total' => round((float) $row->total, 2),
            ];
        })->values()->all();
    }
}
