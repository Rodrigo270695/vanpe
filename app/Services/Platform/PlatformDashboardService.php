<?php

namespace App\Services\Platform;

use App\Models\RefCatalogItem;
use App\Models\RefCatalogProposal;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\Tenant;
use Carbon\Carbon;

/** Métricas agregadas para el panel de la plataforma (dominio central). */
class PlatformDashboardService
{
    /**
     * @return array<string, mixed>
     */
    public function build(): array
    {
        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();
        $prevMonthStart = now()->subMonth()->startOfMonth();
        $prevMonthEnd = now()->subMonth()->endOfMonth();

        $revenueThisMonth = (float) SubscriptionPayment::query()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$monthStart, $monthEnd])
            ->sum('amount');

        $revenuePrevMonth = (float) SubscriptionPayment::query()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$prevMonthStart, $prevMonthEnd])
            ->sum('amount');

        $revenueDelta = $revenuePrevMonth > 0
            ? round((($revenueThisMonth - $revenuePrevMonth) / $revenuePrevMonth) * 100, 1)
            : null;

        $tenantsByStatus = collect(Tenant::STATUSES)
            ->mapWithKeys(fn (string $status): array => [
                $status => Tenant::query()->where('estado', $status)->count(),
            ])
            ->all();

        return [
            'kpis' => [
                'restaurants_active' => $tenantsByStatus['active'] ?? 0,
                'restaurants_trial' => $tenantsByStatus['trial'] ?? 0,
                'catalog_items' => RefCatalogItem::query()->where('active', true)->count(),
                'subscriptions_active' => Subscription::query()
                    ->whereIn('status', ['trial', 'active'])
                    ->count(),
                'revenue_month' => $revenueThisMonth,
                'revenue_delta_percent' => $revenueDelta,
                'pending_proposals' => RefCatalogProposal::query()
                    ->where('status', RefCatalogProposal::STATUS_PENDING)
                    ->count(),
            ],
            'charts' => [
                'tenants_by_month' => $this->tenantsByMonth(),
                'tenants_by_status' => collect(Tenant::STATUSES)
                    ->map(fn (string $status): array => [
                        'status' => $status,
                        'count' => (int) ($tenantsByStatus[$status] ?? 0),
                    ])
                    ->values()
                    ->all(),
            ],
            'pending_proposals' => RefCatalogProposal::query()
                ->with('tenant:id,nombre_comercial,slug')
                ->where('status', RefCatalogProposal::STATUS_PENDING)
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (RefCatalogProposal $p): array => [
                    'id' => $p->id,
                    'type' => $p->type,
                    'suggested_name' => $p->suggested_name,
                    'tenant_name' => $p->tenant?->nombre_comercial,
                    'created_at' => $p->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @return list<array{month: string, label: string, count: int}>
     */
    private function tenantsByMonth(): array
    {
        $from = now()->subMonths(5)->startOfMonth();

        $counts = Tenant::query()
            ->where('created_at', '>=', $from)
            ->selectRaw("to_char(created_at, 'YYYY-MM') as month, count(*) as aggregate")
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('aggregate', 'month');

        $rows = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i)->startOfMonth();
            $key = $date->format('Y-m');
            $rows[] = [
                'month' => $key,
                'label' => $date->isoFormat('MMM YY'),
                'count' => (int) ($counts[$key] ?? 0),
            ];
        }

        return $rows;
    }
}
