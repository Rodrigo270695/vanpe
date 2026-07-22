<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Models\PubRestaurant;
use App\Models\TourSpot;
use App\Services\Platform\TourSpotCatalogQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function __construct(
        private readonly TourSpotCatalogQuery $tourSpots,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $limit = min(max($request->integer('limit', 8), 1), 20);

        $recommendedRestaurants = PubRestaurant::query()
            ->where('activo', true)
            ->orderByDesc('score_ranking')
            ->orderByDesc('destacado')
            ->limit($limit)
            ->get();

        $recommendedSpots = TourSpot::query()
            ->where('estado', TourSpot::ESTADO_PUBLICADO)
            ->with(['categories', 'departamento:id,name', 'distrito:id,name'])
            ->orderByDesc('score_ranking')
            ->orderByDesc('destacado')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => [
                'restaurants' => $recommendedRestaurants->map(function (PubRestaurant $restaurant): array {
                    return [
                        'id' => $restaurant->id,
                        'slug' => $restaurant->slug,
                        'nombre' => $restaurant->nombre,
                        'direccion' => $restaurant->direccion,
                        'portada_url' => $restaurant->portada_url,
                        'logo_url' => $restaurant->logo_url,
                        'tipo_cocina' => $restaurant->tipo_cocina ?? [],
                        'rango_precio' => $restaurant->rango_precio,
                        'rating_promedio' => (float) $restaurant->rating_promedio,
                        'total_resenas' => (int) $restaurant->total_resenas,
                        'destacado' => (bool) $restaurant->destacado,
                        'latitud' => $restaurant->latitud !== null ? (float) $restaurant->latitud : null,
                        'longitud' => $restaurant->longitud !== null ? (float) $restaurant->longitud : null,
                    ];
                })->values(),
                'tour_spots' => $recommendedSpots
                    ->map(fn (TourSpot $spot): array => $this->tourSpots->toListItem($spot))
                    ->values(),
            ],
        ]);
    }
}
