<?php

namespace App\Services\Tenant;

use App\Models\Tenant;
use App\Models\Tenant\CfgCatalogSelection;
use App\Models\Tenant\CfgServiceHour;
use App\Models\Tenant\CfgSetting;
use App\Models\Tenant\MenuCategory;
use App\Models\Tenant\MenuDish;
use App\Models\Tenant\Reservation;
use App\Models\Tenant\RstTable;
use App\Support\RefCatalogTypes;
use App\Tenancy\TenantManager;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/** Métricas agregadas para el panel del restaurante (subdominio tenant). */
class TenantDashboardService
{
    /**
     * @return array<string, mixed>
     */
    public function build(): array
    {
        $today = now()->toDateString();
        $thirtyDaysAgo = now()->subDays(29)->toDateString();

        $todayReservations = Reservation::query()
            ->whereDate('date', $today)
            ->get();

        $activeTables = RstTable::query()->where('active', true);
        $activeTableCount = (clone $activeTables)->count();
        $occupiedTables = (clone $activeTables)->where('status', 'occupied')->count();

        $dishCount = MenuDish::query()->count();
        $dishesWithImage = MenuDish::query()
            ->whereNotNull('image_url')
            ->where('image_url', '!=', '')
            ->count();

        $catalogTypesCovered = CfgCatalogSelection::query()
            ->distinct()
            ->count('catalog_type');

        $activeServiceDays = CfgServiceHour::query()
            ->where('active', true)
            ->count();

        $checklist = $this->buildChecklist(
            $activeTableCount,
            $dishCount,
            $catalogTypesCovered,
            $activeServiceDays,
            $dishCount > 0 ? (int) round(($dishesWithImage / max($dishCount, 1)) * 100) : 0,
            app(TenantManager::class)->tenant(),
        );

        $profilePercent = (int) round(
            $checklist->where('done', true)->count() / max($checklist->count(), 1) * 100,
        );

        $statusCounts = Reservation::query()
            ->where('date', '>=', $thirtyDaysAgo)
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $tableStatusCounts = (clone $activeTables)
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $cartaAvailable = MenuDish::query()->where('available', true)->count();
        $cartaPublished = MenuDish::query()->where('publish_in_app', true)->count();

        $salesSnapshot = app(SalesReportService::class)->buildTodaySnapshot();

        return [
            'kpis' => [
                'reservations_today' => $todayReservations->count(),
                'pending_approval' => Reservation::query()
                    ->where('status', 'pending')
                    ->where('source', 'app')
                    ->count(),
                'dishes' => $dishCount,
                'tables_occupied' => $occupiedTables,
                'tables_total' => $activeTableCount,
                'sales_today' => $salesSnapshot['sales_today'],
                'revenue_today' => $salesSnapshot['revenue_today'],
                'average_ticket_today' => $salesSnapshot['average_ticket_today'],
                'orders_to_pay' => $salesSnapshot['orders_to_pay'],
                'cash_session_open' => $salesSnapshot['cash_session_open'],
            ],
            'charts' => [
                'reservations_by_day' => $this->reservationsByDay(),
                'reservations_by_status' => collect(Reservation::STATUSES)
                    ->map(fn (string $status): array => [
                        'status' => $status,
                        'count' => (int) ($statusCounts[$status] ?? 0),
                    ])
                    ->values()
                    ->all(),
                'tables_by_status' => collect(RstTable::STATUSES)
                    ->map(fn (string $status): array => [
                        'status' => $status,
                        'count' => (int) ($tableStatusCounts[$status] ?? 0),
                    ])
                    ->values()
                    ->all(),
                'carta' => [
                    'categories' => MenuCategory::query()->count(),
                    'dishes' => $dishCount,
                    'available' => $cartaAvailable,
                    'with_image' => $dishesWithImage,
                    'published' => $cartaPublished,
                    'without_image' => max($dishCount - $dishesWithImage, 0),
                    'unpublished' => max($dishCount - $cartaPublished, 0),
                ],
                'sales_by_day' => $salesSnapshot['by_day'],
                'sales_by_payment_method' => $salesSnapshot['by_payment_method'],
            ],
            'profile' => [
                'percent' => $profilePercent,
                'checklist' => $checklist->values()->all(),
            ],
            'upcoming_today' => Reservation::query()
                ->whereDate('date', $today)
                ->whereIn('status', ['pending', 'confirmed'])
                ->orderBy('time')
                ->limit(6)
                ->get()
                ->map(fn (Reservation $r): array => [
                    'id' => $r->id,
                    'code' => $r->code,
                    'customer_name' => $r->customer_name,
                    'time' => substr((string) $r->time, 0, 5),
                    'party_size' => $r->party_size,
                    'status' => $r->status,
                    'source' => $r->source,
                ])
                ->values()
                ->all(),
            'settings' => [
                'reservations_enabled' => CfgSetting::ensureDefaults()->reservations_enabled,
            ],
            'currency' => (string) CfgSetting::ensureDefaults()->currency,
        ];
    }

    /**
     * @return list<array{date: string, label: string, count: int}>
     */
    private function reservationsByDay(): array
    {
        $from = now()->subDays(6)->startOfDay();
        $to = now()->endOfDay();

        $counts = Reservation::query()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('date, count(*) as aggregate')
            ->groupBy('date')
            ->pluck('aggregate', 'date');

        $rows = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $key = $date->toDateString();
            $rows[] = [
                'date' => $key,
                'label' => $date->isoFormat('ddd D'),
                'count' => (int) ($counts[$key] ?? 0),
            ];
        }

        return $rows;
    }

    /**
     * @return Collection<int, array{key: string, done: bool, href: string}>
     */
    private function buildChecklist(
        int $activeTables,
        int $dishCount,
        int $catalogTypesCovered,
        int $activeServiceDays,
        int $imagePercent,
        ?Tenant $tenant,
    ): Collection {
        $hasBranding = $tenant !== null
            && filled($tenant->logo_url)
            && filled($tenant->portada_url);

        return collect([
            [
                'key' => 'tables',
                'done' => $activeTables > 0,
                'href' => '/mesas',
            ],
            [
                'key' => 'branding',
                'done' => $hasBranding,
                'href' => '/configuracion',
            ],
            [
                'key' => 'menu',
                'done' => $dishCount >= 3,
                'href' => '/carta',
            ],
            [
                'key' => 'catalog',
                'done' => $catalogTypesCovered >= count(RefCatalogTypes::RESTAURANT),
                'href' => '/configuracion',
            ],
            [
                'key' => 'hours',
                'done' => $activeServiceDays >= 3,
                'href' => '/configuracion',
            ],
            [
                'key' => 'images',
                'done' => $dishCount === 0 ? false : $imagePercent >= 50,
                'href' => '/carta',
            ],
        ]);
    }
}
