<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\TourSpotRequest;
use App\Models\Departamento;
use App\Models\Distrito;
use App\Models\Provincia;
use App\Models\RefCatalogItem;
use App\Models\TourCategory;
use App\Models\TourSpot;
use App\Models\TourSpotHour;
use App\Services\Platform\TourSpotWriter;
use App\Support\RefCatalogTypes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/** Centros / atractivos turísticos (solo plataforma). */
class TourSpotController extends Controller
{
    public function __construct(
        private readonly TourSpotWriter $writer,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('tour_spots.view'), 403);

        $locale = app()->getLocale();

        $spots = TourSpot::query()
            ->with(['departamento', 'provincia', 'distrito', 'categories', 'accessModes', 'hours', 'media'])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (TourSpot $spot): array => $spot->toAdminArray($locale));

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

        $departamentos = Departamento::query()
            ->where('status', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Departamento $row): array => [
                'id' => $row->id,
                'name' => $row->name,
            ]);

        return Inertia::render('tour-spots/index', [
            'spots' => $spots,
            'categories' => $categories,
            'accessModes' => $accessModes,
            'roadTypes' => $roadTypes,
            'departamentos' => $departamentos,
            'defaultHours' => TourSpotHour::defaultRows(),
            'estados' => TourSpot::ESTADOS,
            'dificultades' => TourSpot::DIFICULTADES,
            'estacionamientos' => TourSpot::ESTACIONAMIENTOS,
            'can' => [
                'create' => $request->user()?->can('tour_spots.create'),
                'update' => $request->user()?->can('tour_spots.update'),
                'delete' => $request->user()?->can('tour_spots.delete'),
                'publish' => $request->user()?->can('tour_spots.publish'),
            ],
        ]);
    }

    public function store(TourSpotRequest $request): RedirectResponse
    {
        $this->writer->create($request->validated(), $request->user()?->id);

        return back()->with('success', __('messages.tour_spots.created'));
    }

    public function update(TourSpotRequest $request, TourSpot $tourSpot): RedirectResponse
    {
        if ($request->input('estado') === TourSpot::ESTADO_PUBLICADO) {
            abort_unless((bool) $request->user()?->can('tour_spots.publish'), 403);
        }

        $this->writer->update($tourSpot, $request->validated(), $request->user()?->id);

        return back()->with('success', __('messages.tour_spots.updated'));
    }

    public function destroy(Request $request, TourSpot $tourSpot): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tour_spots.delete'), 403);

        $tourSpot->delete();

        return back()->with('success', __('messages.tour_spots.deleted'));
    }

    public function storeCategory(Request $request): JsonResponse
    {
        abort_unless(
            (bool) $request->user()?->can('tour_spots.create')
            || (bool) $request->user()?->can('tour_spots.update'),
            403,
        );

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
        abort_unless(
            (bool) $request->user()?->can('tour_spots.create')
            || (bool) $request->user()?->can('tour_spots.update'),
            403,
        );

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $name = trim($data['name']);
        $slug = Str::slug($name);
        if ($slug === '') {
            $slug = 'acceso-'.Str::lower(Str::random(6));
        }

        $existing = RefCatalogItem::query()
            ->where('type', RefCatalogTypes::TOUR_ACCESS)
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
                ->where('type', RefCatalogTypes::TOUR_ACCESS)
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $baseSlug.'-'.$i;
            $i++;
        }

        $maxOrder = (int) RefCatalogItem::query()
            ->where('type', RefCatalogTypes::TOUR_ACCESS)
            ->max('sort_order');

        $item = RefCatalogItem::query()->create([
            'type' => RefCatalogTypes::TOUR_ACCESS,
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

    public function provincias(Request $request): JsonResponse
    {
        abort_unless((bool) $request->user()?->can('tour_spots.view'), 403);

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
        abort_unless((bool) $request->user()?->can('tour_spots.view'), 403);

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
}
