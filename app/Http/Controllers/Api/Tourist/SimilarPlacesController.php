<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Services\Platform\PublicCatalogQuery;
use App\Services\Platform\TourSpotCatalogQuery;
use App\Services\Tourist\SimilarPlacesService;
use Illuminate\Http\JsonResponse;

class SimilarPlacesController extends Controller
{
    public function __construct(
        private readonly SimilarPlacesService $similar,
        private readonly PublicCatalogQuery $restaurants,
        private readonly TourSpotCatalogQuery $tourSpots,
    ) {}

    public function restaurant(string $slug): JsonResponse
    {
        $restaurant = $this->restaurants->findBySlug($slug);

        if ($restaurant === null) {
            return response()->json(['message' => 'Restaurante no encontrado.'], 404);
        }

        return response()->json([
            'data' => $this->similar->forRestaurant($restaurant),
        ]);
    }

    public function tourSpot(string $slug): JsonResponse
    {
        $spot = $this->tourSpots->findBySlug($slug);

        if ($spot === null) {
            return response()->json(['message' => 'Centro turístico no encontrado.'], 404);
        }

        return response()->json([
            'data' => $this->similar->forTourSpot($spot),
        ]);
    }
}
