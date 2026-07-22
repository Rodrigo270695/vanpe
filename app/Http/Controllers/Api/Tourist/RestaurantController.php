<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Models\PubRestaurant;
use App\Services\Platform\PublicCatalogQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** API de lectura del catálogo público para la app turista. */
class RestaurantController extends Controller
{
    public function __construct(
        private readonly PublicCatalogQuery $catalog,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $departamentoId = $request->integer('departamento_id') ?: null;
        $cuisine = $request->string('cuisine')->toString() ?: null;

        $paginator = $this->catalog->listRestaurants(
            $departamentoId,
            $cuisine,
            min($request->integer('per_page', 20), 50),
        );

        return response()->json([
            'data' => $paginator->getCollection()->map(fn (PubRestaurant $r): array => $this->listItem($r)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $restaurant = $this->catalog->findBySlug($slug);

        abort_if($restaurant === null, 404);

        return response()->json([
            'data' => $this->detail($restaurant),
        ]);
    }

    public function slots(Request $request, string $slug): JsonResponse
    {
        $date = $request->string('date')->toString() ?: null;
        $slots = $this->catalog->availabilityForSlug($slug, $date);

        if ($slots->isEmpty() && PubRestaurant::query()->where('slug', $slug)->where('activo', true)->doesntExist()) {
            abort(404);
        }

        return response()->json([
            'data' => $slots->map(fn ($slot): array => [
                'fecha' => $slot->fecha?->toDateString(),
                'hora' => substr((string) $slot->hora, 0, 5),
                'cupos_total' => $slot->cupos_total,
                'cupos_ocupados' => $slot->cupos_ocupados,
                'cupos_disponibles' => max(0, $slot->cupos_total - $slot->cupos_ocupados),
            ])->values(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function listItem(PubRestaurant $restaurant): array
    {
        return [
            'id' => $restaurant->id,
            'slug' => $restaurant->slug,
            'nombre' => $restaurant->nombre,
            'direccion' => $restaurant->direccion,
            'latitud' => $restaurant->latitud,
            'longitud' => $restaurant->longitud,
            'logo_url' => $restaurant->logo_url,
            'portada_url' => $restaurant->portada_url,
            'tipo_cocina' => $restaurant->tipo_cocina ?? [],
            'rango_precio' => $restaurant->rango_precio,
            'rating_promedio' => (float) $restaurant->rating_promedio,
            'total_resenas' => $restaurant->total_resenas,
            'acepta_reservas' => $restaurant->acepta_reservas,
            'destacado' => $restaurant->destacado,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function detail(PubRestaurant $restaurant): array
    {
        return [
            ...$this->listItem($restaurant),
            'descripcion' => $restaurant->descripcion,
            'telefono' => $restaurant->telefono,
            'whatsapp' => $restaurant->whatsapp,
            'anticipacion_min_horas' => $restaurant->anticipacion_min_horas,
            'capacidad_max_grupo' => $restaurant->capacidad_max_grupo,
            'photos' => $restaurant->photos->map(fn ($p): array => [
                'image_url' => $p->image_url,
                'caption' => $p->caption,
            ])->values(),
            'hours' => $restaurant->hours->map(fn ($h): array => [
                'day_of_week' => $h->day_of_week,
                'opens_at' => substr((string) $h->opens_at, 0, 5),
                'closes_at' => substr((string) $h->closes_at, 0, 5),
            ])->values(),
            'highlights' => $restaurant->highlights->map(fn ($d): array => [
                'dish_ref' => $d->dish_ref,
                'nombre' => $d->nombre,
                'descripcion' => $d->descripcion,
                'precio' => (float) $d->precio,
                'imagen_url' => $d->imagen_url,
                'categoria' => $d->categoria_nombre,
                'featured' => $d->featured,
            ])->values(),
            'catalog' => $restaurant->catalogItems->groupBy('catalog_type')->map(
                fn ($items, $type) => $items->map(fn ($item): array => [
                    'slug' => $item->slug,
                    'name_es' => $item->name_es,
                    'name_en' => $item->name_en,
                ])->values(),
            ),
        ];
    }
}
