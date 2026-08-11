<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\TourSpotProfileRequest;
use App\Models\Departamento;
use App\Models\Distrito;
use App\Models\Provincia;
use App\Models\RefCatalogItem;
use App\Models\Tenant;
use App\Models\TourCategory;
use App\Models\TourSpot;
use App\Models\TourSpotHour;
use App\Services\Platform\TourSpotCatalogProvisioner;
use App\Services\Platform\TourSpotWriter;
use App\Support\RefCatalogTypes;
use App\Tenancy\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/** Ficha "Mi centro" (TourSpot) para tenants tipo centro turístico (subdominio). */
class TourSpotProfileController extends Controller
{
    public function __construct(
        private readonly TourSpotWriter $writer,
        private readonly TourSpotCatalogProvisioner $provisioner,
    ) {}

    public function edit(Request $request): Response
    {
        $tenant = $this->currentTenant();
        abort_unless($tenant->isTourSpot(), 404);

        abort_unless(
            (bool) $request->user()?->can('tenant.tour_spot.manage')
            || (bool) $request->user()?->can('tenant.tour_spot.publish'),
            403,
        );

        $spot = $this->resolveSpot($tenant);
        $locale = app()->getLocale();

        $categories = TourCategory::query()
            ->where('active', true)
            ->orderBy('sort_order')
            ->orderBy('name_es')
            ->get()
            ->map(fn (TourCategory $row): array => $row->toAdminArray($locale));

        $accessModes = RefCatalogItem::query()
            ->where('type', RefCatalogTypes::TOUR_ACCESS)
            ->where('active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (RefCatalogItem $item): array => $item->toCatalogArray($locale));

        $roadTypes = RefCatalogItem::query()
            ->where('type', RefCatalogTypes::TOUR_ROAD)
            ->where('active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (RefCatalogItem $item): array => $item->toCatalogArray($locale));

        $inclusions = RefCatalogItem::query()
            ->where('type', RefCatalogTypes::TOUR_INCLUSION)
            ->where('active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (RefCatalogItem $item): array => $item->toCatalogArray($locale));

        $departamentos = Departamento::query()
            ->where('status', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Departamento $row): array => [
                'id' => $row->id,
                'name' => $row->name,
            ]);

        return Inertia::render('mi-centro/index', [
            'spot' => $spot->toAdminArray($locale),
            'categories' => $categories,
            'accessModes' => $accessModes,
            'roadTypes' => $roadTypes,
            'inclusions' => $inclusions,
            'departamentos' => $departamentos,
            'defaultHours' => TourSpotHour::defaultRows(),
            'estados' => TourSpot::ESTADOS,
            'dificultades' => TourSpot::DIFICULTADES,
            'estacionamientos' => TourSpot::ESTACIONAMIENTOS,
            'mapbox_token' => filled(config('services.mapbox.token'))
                ? (string) config('services.mapbox.token')
                : null,
            'can' => [
                'manage' => (bool) $request->user()?->can('tenant.tour_spot.manage'),
                'publish' => (bool) $request->user()?->can('tenant.tour_spot.publish'),
            ],
        ]);
    }

    public function update(TourSpotProfileRequest $request): RedirectResponse
    {
        $tenant = $this->currentTenant();
        abort_unless($tenant->isTourSpot(), 404);

        $spot = $this->resolveSpot($tenant);

        $this->writer->update($spot, $request->validated(), $request->user()?->id);

        return back()->with('success', __('messages.tour_spots.updated'));
    }

    public function provincias(Request $request): JsonResponse
    {
        $tenant = $this->currentTenant();
        abort_unless($tenant->isTourSpot(), 404);
        abort_unless((bool) $request->user()?->can('tenant.tour_spot.manage'), 403);

        $departamentoId = (int) $request->query('departamento_id');

        $rows = Provincia::query()
            ->where('departamento_id', $departamentoId)
            ->where('status', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Provincia $row): array => [
                'id' => $row->id,
                'name' => $row->name,
            ]);

        return response()->json(['data' => $rows]);
    }

    public function distritos(Request $request): JsonResponse
    {
        $tenant = $this->currentTenant();
        abort_unless($tenant->isTourSpot(), 404);
        abort_unless((bool) $request->user()?->can('tenant.tour_spot.manage'), 403);

        $provinciaId = (int) $request->query('provincia_id');

        $rows = Distrito::query()
            ->where('provincia_id', $provinciaId)
            ->where('status', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Distrito $row): array => [
                'id' => $row->id,
                'name' => $row->name,
            ]);

        return response()->json(['data' => $rows]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $this->authorizeManage($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $name = trim($data['name']);
        $slug = Str::slug($name);
        if ($slug === '') {
            $slug = 'categoria-'.Str::lower(Str::random(6));
        }

        $baseSlug = $slug;
        $i = 2;
        while (TourCategory::query()->where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$i;
            $i++;
        }

        $maxOrder = (int) TourCategory::query()->max('sort_order');

        $category = TourCategory::query()->create([
            'slug' => $slug,
            'name_es' => $name,
            'name_en' => $name,
            'icon' => null,
            'color_hex' => null,
            'sort_order' => $maxOrder + 1,
            'active' => true,
        ]);

        return response()->json([
            'data' => $category->toAdminArray(),
        ], 201);
    }

    public function storeAccessMode(Request $request): JsonResponse
    {
        return $this->storeCatalogOption($request, RefCatalogTypes::TOUR_ACCESS, 'acceso');
    }

    public function storeRoadType(Request $request): JsonResponse
    {
        return $this->storeCatalogOption($request, RefCatalogTypes::TOUR_ROAD, 'vialidad');
    }

    public function storeInclusion(Request $request): JsonResponse
    {
        return $this->storeCatalogOption($request, RefCatalogTypes::TOUR_INCLUSION, 'inclusion');
    }

    private function storeCatalogOption(Request $request, string $type, string $fallbackPrefix): JsonResponse
    {
        $this->authorizeManage($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $name = trim($data['name']);
        $slug = Str::slug($name);
        if ($slug === '') {
            $slug = $fallbackPrefix.'-'.Str::lower(Str::random(6));
        }

        $existing = RefCatalogItem::query()
            ->where('type', $type)
            ->where(function ($q) use ($slug, $name) {
                $q->where('slug', $slug)
                    ->orWhere('name_es', $name)
                    ->orWhere('name_en', $name);
            })
            ->first();

        if ($existing) {
            return response()->json([
                'data' => $existing->toCatalogArray(),
            ]);
        }

        $baseSlug = $slug;
        $i = 2;
        while (
            RefCatalogItem::query()
                ->where('type', $type)
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $baseSlug.'-'.$i;
            $i++;
        }

        $maxOrder = (int) RefCatalogItem::query()
            ->where('type', $type)
            ->max('sort_order');

        $item = RefCatalogItem::query()->create([
            'type' => $type,
            'slug' => $slug,
            'name_es' => $name,
            'name_en' => $name,
            'sort_order' => $maxOrder + 1,
            'active' => true,
        ]);

        return response()->json([
            'data' => $item->toCatalogArray(),
        ], 201);
    }

    private function authorizeManage(Request $request): void
    {
        $tenant = $this->currentTenant();
        abort_unless($tenant->isTourSpot(), 404);
        abort_unless((bool) $request->user()?->can('tenant.tour_spot.manage'), 403);
    }

    private function currentTenant(): Tenant
    {
        $tenant = app(TenantManager::class)->tenant();
        abort_if($tenant === null, 404);

        return $tenant;
    }

    private function resolveSpot(Tenant $tenant): TourSpot
    {
        $spot = $tenant->tourSpot ?? $this->provisioner->createStubForTenant($tenant);

        return $spot->fresh([
            'departamento',
            'provincia',
            'distrito',
            'categories',
            'accessModes',
            'inclusions',
            'hours',
            'media',
        ]) ?? $spot;
    }
}
