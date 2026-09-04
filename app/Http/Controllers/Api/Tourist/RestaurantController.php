<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Models\PubRestaurant;
use App\Services\Platform\PublicCatalogQuery;
use App\Support\PublicMediaUrl;
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
        $paginator = $this->catalog->listRestaurants(
            $request->integer('departamento_id') ?: null,
            $request->string('cuisine')->toString() ?: null,
            min($request->integer('per_page', 12), 30),
            $request->string('q')->toString() ?: null,
            $request->integer('provincia_id') ?: null,
            $request->integer('distrito_id') ?: null,
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
                'id' => $slot->id,
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
            'latitud' => $restaurant->latitud !== null ? (float) $restaurant->latitud : null,
            'longitud' => $restaurant->longitud !== null ? (float) $restaurant->longitud : null,
            'logo_url' => PublicMediaUrl::make($restaurant->logo_url),
            'portada_url' => PublicMediaUrl::make($restaurant->portada_url),
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
        $catalogGrouped = $restaurant->catalogItems
            ->groupBy('catalog_type')
            ->map(fn ($items) => $items->map(fn ($item): array => [
                'slug' => $item->slug,
                'name_es' => $item->name_es,
                'name_en' => $item->name_en,
                'name' => $item->name_es ?? $item->name_en ?? $item->slug,
            ])->values());

        return [
            ...$this->listItem($restaurant),
            'descripcion' => $restaurant->descripcion,
            'telefono' => $restaurant->telefono,
            'whatsapp' => $restaurant->whatsapp,
            'anticipacion_min_horas' => $restaurant->anticipacion_min_horas,
            'capacidad_max_grupo' => $restaurant->capacidad_max_grupo,
            'photos' => $restaurant->photos->map(fn ($p): array => [
                'image_url' => PublicMediaUrl::make($p->image_url),
                'caption' => $p->caption,
            ])->values(),
            'hours' => $this->serializeHours($restaurant),
            'highlights' => $restaurant->highlights->map(fn ($d): array => [
                'dish_ref' => $d->dish_ref,
                'nombre' => $d->nombre,
                'descripcion' => $d->descripcion,
                'precio' => $d->precio !== null ? (float) $d->precio : null,
                'imagen_url' => PublicMediaUrl::make($d->imagen_url),
                'categoria' => $d->categoria_nombre,
                'featured' => (bool) $d->featured,
            ])->values(),
            // Objeto vacío {} (no []) para que la app no rompa al leer catalog.ambiance, etc.
            'catalog' => $catalogGrouped->isEmpty() ? new \stdClass() : $catalogGrouped,
        ];
    }

    /**
     * Semana completa Lun(0)–Dom(6), alineada con cfg_service_hours del tenant.
     *
     * @return list<array{day_of_week: int, opens_at: string|null, closes_at: string|null, closed: bool}>
     */
    private function serializeHours(PubRestaurant $restaurant): array
    {
        if ($restaurant->hours->isEmpty()) {
            return [];
        }

        $byDay = $restaurant->hours->keyBy(fn ($h): int => (int) $h->day_of_week);

        $rows = [];
        for ($day = 0; $day < 7; $day++) {
            $hour = $byDay->get($day);
            if ($hour === null) {
                $rows[] = [
                    'day_of_week' => $day,
                    'opens_at' => null,
                    'closes_at' => null,
                    'closed' => true,
                ];
                continue;
            }

            $closed = (bool) ($hour->cerrado ?? false);
            $rows[] = [
                'day_of_week' => $day,
                'opens_at' => $closed ? null : substr((string) $hour->opens_at, 0, 5),
                'closes_at' => $closed ? null : substr((string) $hour->closes_at, 0, 5),
                'closed' => $closed,
            ];
        }

        return $rows;
    }
}
