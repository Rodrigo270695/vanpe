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
     * Dashboard simplificado para tenants tipo centro turístico.
     *
     * @return array<string, mixed>
     */
    public function buildTourSpot(): array
    {
        $tenant = app(TenantManager::class)->tenant();
        $spot = $tenant?->tourSpot()?->with(['categories', 'accessModes', 'media', 'hours'])->first();

        $checklist = collect([
            [
                'key' => 'identity',
                'done' => $spot !== null && filled($spot->nombre) && filled($spot->resumen),
                'href' => '/mi-centro?tab=identity',
            ],
            [
                'key' => 'photos',
                'done' => $spot !== null && filled($spot->imagen_portada_url),
                'href' => '/mi-centro?tab=photos',
            ],
            [
                'key' => 'location',
                'done' => $spot !== null
                    && $spot->latitud !== null
                    && $spot->longitud !== null
                    && $spot->departamento_id !== null,
                'href' => '/mi-centro?tab=location',
            ],
            [
                'key' => 'access',
                'done' => $spot !== null
                    && $spot->categories->isNotEmpty()
                    && $spot->accessModes->isNotEmpty(),
                'href' => '/mi-centro?tab=access',
            ],
            [
                'key' => 'hours',
                'done' => $spot !== null && $spot->hours->where('active', true)->isNotEmpty(),
                'href' => '/mi-centro?tab=hours',
            ],
            [
                'key' => 'publish',
                'done' => $spot?->estado === \App\Models\TourSpot::ESTADO_PUBLICADO,
                'href' => '/mi-centro?tab=publication',
            ],
        ]);

        $percent = (int) round(
            $checklist->where('done', true)->count() / max($checklist->count(), 1) * 100,
        );

        return [
            'spot' => $spot === null ? null : [
                'id' => $spot->id,
                'nombre' => $spot->nombre,
                'estado' => $spot->estado,
                'publicado_en' => $spot->publicado_en?->toIso8601String(),
                'imagen_portada_url' => $spot->imagen_portada_url,
            ],
            'profile' => [
                'percent' => $percent,
                'checklist' => $checklist->values()->all(),
            ],
        ];
    }

    /**
     * Dashboard simplificado para tenants tipo hotel.
     *
     * @return array<string, mixed>
     */
    public function buildHotel(): array
    {
        $tenant = app(TenantManager::class)->tenant();
        $hotel = $tenant?->hotel()->withCount('media')->first();
        $minPhotos = \App\Http\Requests\Platform\HotelRequest::MIN_PHOTOS_TO_PUBLISH;
        $photos = $hotel === null
            ? 0
            : (filled($hotel->imagen_portada_url) ? 1 : 0) + (int) $hotel->media_count;

        $checklist = collect([
            [
                'key' => 'general',
                'done' => $hotel !== null
                    && filled($hotel->ruc)
                    && filled($hotel->direccion)
                    && filled($hotel->telefono_reservas),
                'href' => '/mi-hotel?tab=general',
            ],
            [
                'key' => 'rooms',
                'done' => $hotel !== null && ! empty($hotel->tipos_habitacion),
                'href' => '/mi-hotel?tab=rooms',
            ],
            [
                'key' => 'services',
                'done' => $hotel !== null && ! empty($hotel->servicios) && ! empty($hotel->medios_pago),
                'href' => '/mi-hotel?tab=rooms',
            ],
            [
                'key' => 'photos',
                'done' => $photos >= $minPhotos,
                'href' => '/mi-hotel?tab=photos',
            ],
            [
                'key' => 'location',
                'done' => $hotel !== null
                    && $hotel->latitud !== null
                    && $hotel->longitud !== null
                    && $hotel->distrito_id !== null,
                'href' => '/mi-hotel?tab=location',
            ],
            [
                'key' => 'diagnosis',
                'done' => $hotel !== null
                    && filled($hotel->sistema_reservas)
                    && filled($hotel->interes_whatsapp)
                    && ! empty($hotel->redes_sociales),
                'href' => '/mi-hotel?tab=diagnosis',
            ],
            [
                'key' => 'published',
                'done' => $hotel?->estado === \App\Models\Hotel::ESTADO_PUBLICADO,
                'href' => '/mi-hotel?tab=publication',
            ],
        ]);

        $percent = (int) round(
            $checklist->where('done', true)->count() / max($checklist->count(), 1) * 100,
        );

        return [
            'hotel' => $hotel === null ? null : [
                'id' => $hotel->id,
                'nombre' => $hotel->nombre,
                'estado' => $hotel->estado,
                'publicado_en' => $hotel->publicado_en?->toIso8601String(),
                'imagen_portada_url' => $hotel->imagen_portada_url,
                'photos' => $photos,
            ],
            'min_photos' => $minPhotos,
            'profile' => [
                'percent' => $percent,
                'checklist' => $checklist->values()->all(),
            ],
        ];
    }

    /**
     * Dashboard simplificado para tenants de artesanía y talentos.
     *
     * @return array<string, mixed>
     */
    public function buildCraft(): array
    {
        $tenant = app(TenantManager::class)->tenant();
        $craft = $tenant?->craft()->withCount('media')->first();
        $minPhotos = \App\Http\Requests\Platform\CraftRequest::MIN_PHOTOS_TO_PUBLISH;
        $photos = (int) ($craft?->media_count ?? 0);
        $pricedPhotos = $craft === null ? 0 : $craft->media()->whereNotNull('precio')->count();

        $checklist = collect([
            [
                'key' => 'general',
                'done' => $craft !== null && filled($craft->nombre) && filled($craft->descripcion),
                'href' => '/mi-artesania?tab=general',
            ],
            [
                'key' => 'contact',
                'done' => $craft !== null && filled($craft->telefono_contacto),
                'href' => '/mi-artesania?tab=general',
            ],
            [
                'key' => 'photos',
                'done' => $photos >= $minPhotos,
                'href' => '/mi-artesania?tab=photos',
            ],
            [
                'key' => 'prices',
                'done' => $pricedPhotos > 0,
                'href' => '/mi-artesania?tab=photos',
            ],
            [
                'key' => 'social',
                'done' => $craft !== null && ! empty($craft->redes_sociales),
                'href' => '/mi-artesania?tab=social',
            ],
            [
                'key' => 'location',
                'done' => $craft !== null && $craft->latitud !== null && $craft->longitud !== null,
                'href' => '/mi-artesania?tab=location',
            ],
            [
                'key' => 'published',
                'done' => $craft?->estado === \App\Models\Craft::ESTADO_PUBLICADO,
                'href' => '/mi-artesania?tab=publication',
            ],
        ]);

        $percent = (int) round(
            $checklist->where('done', true)->count() / max($checklist->count(), 1) * 100,
        );

        return [
            'craft' => $craft === null ? null : [
                'id' => $craft->id,
                'nombre' => $craft->nombre,
                'estado' => $craft->estado,
                'publicado_en' => $craft->publicado_en?->toIso8601String(),
                'imagen_portada_url' => $craft->imagen_portada_url,
                'photos' => $photos,
            ],
            'min_photos' => $minPhotos,
            'profile' => [
                'percent' => $percent,
                'checklist' => $checklist->values()->all(),
            ],
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
