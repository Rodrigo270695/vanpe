<?php

namespace App\Services\Platform;

use App\Models\PubAvailabilitySlot;
use App\Models\PubMenuHighlight;
use App\Models\PubRestaurant;
use App\Models\PubRestaurantCatalogItem;
use App\Models\PubRestaurantHour;
use App\Models\PubRestaurantPhoto;
use App\Models\RefCatalogItem;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\Tenant\CfgCatalogSelection;
use App\Models\Tenant\CfgServiceHour;
use App\Models\Tenant\CfgSetting;
use App\Models\Tenant\CfgVenuePhoto;
use App\Models\Tenant\MenuDish;
use App\Models\Tenant\PubSyncState;
use App\Models\Tenant\Reservation;
use App\Models\Tenant\RstTable;
use App\Services\Tenant\TenantProvisioner;
use App\Support\RefCatalogTypes;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Proyecta datos del tenant (rst_*) al catálogo público pub_* para la app turista. */
class PublicCatalogSync
{
    public function __construct(
        private readonly PublicCatalogProvisioner $provisioner,
        private readonly TenantProvisioner $tenantProvisioner,
    ) {}

    /**
     * @param  list<string>  $entities
     */
    public function syncAll(Tenant $tenant, array $entities = []): void
    {
        $entities = $entities === []
            ? PubSyncState::ENTITIES
            : $entities;

        foreach ($entities as $entity) {
            try {
                match ($entity) {
                    'ficha' => $this->syncProfile($tenant),
                    'galeria' => $this->syncGallery($tenant),
                    'horarios' => $this->syncServiceHours($tenant),
                    'catalogo' => $this->syncCatalogTags($tenant),
                    'carta' => $this->syncMenuHighlights($tenant),
                    'disponibilidad' => $this->syncAvailability($tenant),
                    default => null,
                };
            } catch (\Throwable $e) {
                $this->withTenantSchema($tenant, function () use ($entity, $e): void {
                    PubSyncState::markError($entity, $e->getMessage());
                });

                throw $e;
            }
        }
    }

    public function syncProfile(Tenant $tenant): void
    {
        $tenant->refresh();
        $pub = $this->ensurePubRestaurant($tenant);

        $settings = $this->withTenantSchema($tenant, fn (): CfgSetting => CfgSetting::ensureDefaults());

        $isVisible = $this->isPubliclyVisible($tenant);

        $payload = [
            'nombre' => $tenant->nombre_comercial,
            'slug' => $tenant->slug,
            'telefono' => $tenant->telefono,
            'direccion' => $tenant->direccion,
            'departamento_id' => $tenant->departamento_id,
            'provincia_id' => $tenant->provincia_id,
            'distrito_id' => $tenant->distrito_id,
            'latitud' => $tenant->latitud,
            'longitud' => $tenant->longitud,
            'logo_url' => $tenant->logo_url,
            'portada_url' => $tenant->portada_url,
            'acepta_reservas' => $settings->reservations_enabled,
            'anticipacion_min_horas' => $settings->min_booking_hours_ahead,
            'activo' => $isVisible,
        ];

        $pub->update([
            ...$payload,
            'publicado_en' => $isVisible
                ? ($pub->publicado_en ?? now())
                : null,
            'sincronizado_en' => now(),
        ]);

        $this->markEntitySynced($tenant, 'ficha', $payload);
    }

    public function syncVenueImages(Tenant $tenant): void
    {
        $this->syncProfile($tenant);
    }

    public function syncGallery(Tenant $tenant): void
    {
        $this->ensurePubRestaurant($tenant);

        $photos = $this->withTenantSchema($tenant, function (): Collection {
            return CfgVenuePhoto::query()
                ->orderBy('sort_order')
                ->orderBy('created_at')
                ->get();
        });

        PubRestaurantPhoto::query()
            ->where('tenant_id', $tenant->id)
            ->delete();

        $rows = [];
        foreach ($photos as $index => $photo) {
            $rows[] = [
                'tenant_id' => $tenant->id,
                'image_url' => $photo->image_url,
                'caption' => $photo->caption,
                'sort_order' => $photo->sort_order ?: $index,
            ];
        }

        foreach ($rows as $row) {
            PubRestaurantPhoto::query()->create($row);
        }

        $this->markEntitySynced($tenant, 'galeria', $rows);
    }

    public function syncServiceHours(Tenant $tenant): void
    {
        $this->ensurePubRestaurant($tenant);

        $hours = $this->withTenantSchema($tenant, function (): Collection {
            return CfgServiceHour::query()
                ->where('active', true)
                ->orderBy('day_of_week')
                ->get();
        });

        PubRestaurantHour::query()
            ->where('tenant_id', $tenant->id)
            ->delete();

        $rows = [];
        foreach ($hours as $hour) {
            $rows[] = [
                'tenant_id' => $tenant->id,
                'day_of_week' => $hour->day_of_week,
                'opens_at' => $hour->opens_at,
                'closes_at' => $hour->closes_at,
            ];
            PubRestaurantHour::query()->create($rows[count($rows) - 1]);
        }

        $this->markEntitySynced($tenant, 'horarios', $rows);
    }

    public function syncCatalogTags(Tenant $tenant): void
    {
        $pub = $this->ensurePubRestaurant($tenant);

        $selectionIds = $this->withTenantSchema($tenant, fn (): array => CfgCatalogSelection::selectedIds());

        $items = RefCatalogItem::query()
            ->whereIn('id', $selectionIds)
            ->where('active', true)
            ->orderBy('type')
            ->orderBy('sort_order')
            ->get();

        $cuisineSlugs = $items
            ->where('type', RefCatalogTypes::CUISINE)
            ->pluck('slug')
            ->values()
            ->all();

        PubRestaurantCatalogItem::query()
            ->where('tenant_id', $tenant->id)
            ->delete();

        $rows = [];
        foreach ($items as $item) {
            $row = [
                'tenant_id' => $tenant->id,
                'catalog_item_id' => $item->id,
                'catalog_type' => $item->type,
                'slug' => $item->slug,
                'name_es' => $item->name_es,
                'name_en' => $item->name_en,
                'sort_order' => $item->sort_order,
            ];
            $rows[] = $row;
            PubRestaurantCatalogItem::query()->create($row);
        }

        $pub->update([
            'tipo_cocina' => $cuisineSlugs === [] ? null : $cuisineSlugs,
            'sincronizado_en' => now(),
        ]);

        $this->markEntitySynced($tenant, 'catalogo', [
            'items' => $rows,
            'tipo_cocina' => $cuisineSlugs,
        ]);
    }

    public function syncMenuHighlights(Tenant $tenant): void
    {
        $this->ensurePubRestaurant($tenant);

        $dishes = $this->withTenantSchema($tenant, function (): Collection {
            return MenuDish::query()
                ->with('category:id,name')
                ->where('publish_in_app', true)
                ->where('available', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();
        });

        PubMenuHighlight::query()
            ->where('tenant_id', $tenant->id)
            ->delete();

        $rows = [];
        foreach ($dishes as $index => $dish) {
            $row = [
                'tenant_id' => $tenant->id,
                'dish_ref' => $dish->id,
                'nombre' => $dish->name,
                'descripcion' => $dish->description,
                'precio' => $dish->price,
                'imagen_url' => $dish->image_url,
                'categoria_nombre' => $dish->category?->name,
                'featured' => $dish->featured,
                'sort_order' => $dish->sort_order ?: $index,
                'activo' => true,
            ];
            $rows[] = $row;
            PubMenuHighlight::query()->create($row);
        }

        $this->markEntitySynced($tenant, 'carta', $rows);
    }

    public function syncAvailability(Tenant $tenant): void
    {
        $this->ensurePubRestaurant($tenant);

        $plan = $this->withTenantSchema($tenant, function () use ($tenant): array {
            $settings = CfgSetting::ensureDefaults();

            if (! $settings->reservations_enabled) {
                return ['enabled' => false, 'slots' => [], 'from' => null, 'to' => null];
            }

            $cuposTotal = max(
                1,
                (int) RstTable::query()
                    ->where('active', true)
                    ->where('reservable', true)
                    ->sum('capacity'),
            );

            $duration = max(15, (int) $settings->reservation_duration_minutes);
            $maxDays = min(30, max(1, (int) $settings->max_booking_days_ahead));
            $minHours = max(0, (int) $settings->min_booking_hours_ahead);

            $hoursByDay = CfgServiceHour::query()
                ->where('active', true)
                ->get()
                ->keyBy('day_of_week');

            $from = now()->startOfDay();
            $to = now()->addDays($maxDays)->endOfDay();

            $occupancy = Reservation::query()
                ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
                ->whereNotIn('status', [
                    'cancelled_customer',
                    'cancelled_restaurant',
                    'no_show',
                    'completed',
                ])
                ->get()
                ->countBy(fn (Reservation $r): string => $r->date->format('Y-m-d').' '.substr((string) $r->time, 0, 8));

            $slots = [];
            $cursor = Carbon::parse($from);
            $minAllowed = now()->addHours($minHours);
            $now = now();

            while ($cursor->lte($to)) {
                $dayOfWeek = $cursor->dayOfWeekIso - 1;
                $schedule = $hoursByDay->get($dayOfWeek);

                if ($schedule !== null) {
                    $fecha = $cursor->toDateString();
                    $opens = Carbon::parse($fecha.' '.substr((string) $schedule->opens_at, 0, 5));
                    $closes = Carbon::parse($fecha.' '.substr((string) $schedule->closes_at, 0, 5));

                    if ($closes->gt($opens)) {
                        $slot = Carbon::parse($opens);

                        while ($slot->copy()->addMinutes($duration)->lte($closes)) {
                            if ($slot->gte($minAllowed)) {
                                $time = $slot->format('H:i:s');
                                $key = $fecha.' '.$time;
                                $occupied = (int) ($occupancy[$key] ?? 0);

                                $slots[] = [
                                    'id' => (string) Str::uuid(),
                                    'tenant_id' => $tenant->id,
                                    'fecha' => $fecha,
                                    'hora' => $time,
                                    'cupos_total' => $cuposTotal,
                                    'cupos_ocupados' => min($occupied, $cuposTotal),
                                    'cerrado' => false,
                                    'updated_at' => $now,
                                ];
                            }

                            $slot->addMinutes($duration);
                        }
                    }
                }

                $cursor->addDay();
            }

            return [
                'enabled' => true,
                'slots' => collect($slots)
                    ->unique(fn (array $row): string => $row['fecha'].'|'.$row['hora'])
                    ->values()
                    ->all(),
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ];
        });

        if (! ($plan['enabled'] ?? false)) {
            DB::connection('pgsql')->table('pub_availability_slots')
                ->where('tenant_id', $tenant->id)
                ->delete();
        } else {
            foreach (array_chunk($plan['slots'], 100) as $chunk) {
                PubAvailabilitySlot::query()->upsert(
                    $chunk,
                    ['tenant_id', 'fecha', 'hora'],
                    ['cupos_total', 'cupos_ocupados', 'cerrado', 'updated_at'],
                );
            }

            DB::connection('pgsql')->table('pub_availability_slots')
                ->where('tenant_id', $tenant->id)
                ->where(function ($query) use ($plan): void {
                    $query->where('fecha', '<', $plan['from'])
                        ->orWhere('fecha', '>', $plan['to']);
                })
                ->delete();
        }

        $this->markEntitySynced($tenant, 'disponibilidad', [
            'enabled' => $plan['enabled'] ?? false,
            'slots' => count($plan['slots'] ?? []),
        ]);
    }

    public function deactivate(Tenant $tenant): void
    {
        $pub = $this->ensurePubRestaurant($tenant);

        $pub->update([
            'activo' => false,
            'publicado_en' => null,
            'sincronizado_en' => now(),
        ]);
    }

    private function isPubliclyVisible(Tenant $tenant): bool
    {
        if (! $tenant->publicado) {
            return false;
        }

        if (! in_array($tenant->estado, ['trial', 'active'], true)) {
            return false;
        }

        $subscription = Subscription::query()
            ->where('tenant_id', $tenant->id)
            ->first();

        if ($subscription === null) {
            return $tenant->estado === 'trial';
        }

        return in_array($subscription->status, ['trial', 'active'], true);
    }

    private function ensurePubRestaurant(Tenant $tenant): PubRestaurant
    {
        if ($tenant->pubRestaurant()->exists()) {
            return $tenant->pubRestaurant;
        }

        return $this->provisioner->createStubForTenant($tenant);
    }

    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    private function withTenantSchema(Tenant $tenant, callable $callback): mixed
    {
        $previous = DB::getDefaultConnection();
        $previousPath = config('database.connections.tenant.search_path');

        $this->tenantProvisioner->bindSchema($tenant);
        DB::setDefaultConnection('tenant');

        try {
            return $callback();
        } finally {
            DB::setDefaultConnection($previous);
            Config::set('database.connections.tenant.search_path', $previousPath);
            DB::purge('tenant');
        }
    }

    /**
     * @param  array<string, mixed>|list<mixed>  $payload
     */
    private function markEntitySynced(Tenant $tenant, string $entity, array $payload): void
    {
        $hash = hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR));

        $this->withTenantSchema($tenant, function () use ($entity, $hash): void {
            PubSyncState::markSynced($entity, $hash);
        });
    }
}
