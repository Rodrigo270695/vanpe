<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\PubRestaurant;
use App\Models\TourSpot;
use App\Services\Platform\TourSpotCatalogQuery;
use App\Services\Tourist\CustomerPreferenceService;
use App\Support\PublicMediaUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function __construct(
        private readonly TourSpotCatalogQuery $tourSpots,
        private readonly CustomerPreferenceService $preferences,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $limit = min(max($request->integer('limit', 8), 1), 20);
        $personalized = $request->boolean('personalized');

        /** @var Customer|null $customer */
        $customer = $request->user('sanctum');

        if (
            ! $customer instanceof Customer
            && $personalized
            && filled($request->bearerToken())
        ) {
            // Sanctum sin middleware: resuelve el bearer token del turista.
            $customer = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken())
                ?->tokenable;
            if (! $customer instanceof Customer) {
                $customer = null;
            }
        }

        $mode = 'ranking';
        $recommendedRestaurants = null;
        $recommendedSpots = null;

        if (
            $personalized
            && $customer instanceof Customer
            && $this->preferences->hasPreferences($customer)
        ) {
            $recommendedRestaurants = $this->preferences->recommendRestaurants($customer, $limit);
            $recommendedSpots = $this->preferences->recommendTourSpots($customer, $limit)
                ->load(['categories', 'departamento:id,name', 'distrito:id,name']);
            $mode = 'ai_preferences';
        }

        if ($recommendedRestaurants === null) {
            $recommendedRestaurants = PubRestaurant::query()
                ->visibleInApp()
                ->orderByDesc('score_ranking')
                ->orderByDesc('destacado')
                ->limit($limit)
                ->get();
        }

        if ($recommendedSpots === null) {
            $recommendedSpots = TourSpot::query()
                ->where('estado', TourSpot::ESTADO_PUBLICADO)
                ->with(['categories', 'departamento:id,name', 'distrito:id,name'])
                ->orderByDesc('score_ranking')
                ->orderByDesc('destacado')
                ->limit($limit)
                ->get();
        }

        return response()->json([
            'data' => [
                'mode' => $mode,
                'restaurants' => $recommendedRestaurants->map(function (PubRestaurant $restaurant): array {
                    return $this->serializeRestaurant($restaurant);
                })->values(),
                'tour_spots' => $recommendedSpots
                    ->map(fn (TourSpot $spot): array => $this->tourSpots->toListItem($spot))
                    ->values(),
                'featured' => [
                    'restaurants' => $this->featuredRestaurants($limit)
                        ->map(fn (PubRestaurant $r): array => $this->serializeRestaurant($r))
                        ->values(),
                    'tour_spots' => $this->featuredTourSpots($limit)
                        ->map(fn (TourSpot $spot): array => $this->tourSpots->toListItem($spot))
                        ->values(),
                ],
                'recent' => [
                    'restaurants' => $this->recentRestaurants($limit)
                        ->map(fn (PubRestaurant $r): array => $this->serializeRestaurant($r))
                        ->values(),
                    'tour_spots' => $this->recentTourSpots($limit)
                        ->map(fn (TourSpot $spot): array => $this->tourSpots->toListItem($spot))
                        ->values(),
                ],
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeRestaurant(PubRestaurant $restaurant): array
    {
        return [
            'id' => $restaurant->id,
            'slug' => $restaurant->slug,
            'nombre' => $restaurant->nombre,
            'direccion' => $restaurant->direccion,
            'portada_url' => PublicMediaUrl::make($restaurant->portada_url),
            'logo_url' => PublicMediaUrl::make($restaurant->logo_url),
            'tipo_cocina' => $restaurant->tipo_cocina ?? [],
            'rango_precio' => $restaurant->rango_precio,
            'rating_promedio' => (float) $restaurant->rating_promedio,
            'total_resenas' => (int) $restaurant->total_resenas,
            'destacado' => (bool) $restaurant->destacado,
            'latitud' => $restaurant->latitud !== null ? (float) $restaurant->latitud : null,
            'longitud' => $restaurant->longitud !== null ? (float) $restaurant->longitud : null,
            'created_at' => $restaurant->created_at?->toIso8601String(),
        ];
    }

    /** @return \Illuminate\Support\Collection<int, PubRestaurant> */
    private function featuredRestaurants(int $limit)
    {
        return PubRestaurant::query()
            ->visibleInApp()
            ->where('destacado', true)
            ->where(function ($q): void {
                $q->whereNull('destacado_hasta')
                    ->orWhere('destacado_hasta', '>=', now());
            })
            ->orderByDesc('score_ranking')
            ->limit($limit)
            ->get();
    }

    /** @return \Illuminate\Support\Collection<int, TourSpot> */
    private function featuredTourSpots(int $limit)
    {
        return TourSpot::query()
            ->where('estado', TourSpot::ESTADO_PUBLICADO)
            ->where('destacado', true)
            ->where(function ($q): void {
                $q->whereNull('destacado_hasta')
                    ->orWhere('destacado_hasta', '>=', now());
            })
            ->with(['categories', 'departamento:id,name', 'distrito:id,name'])
            ->orderByDesc('score_ranking')
            ->limit($limit)
            ->get();
    }

    /** @return \Illuminate\Support\Collection<int, PubRestaurant> */
    private function recentRestaurants(int $limit)
    {
        return PubRestaurant::query()
            ->visibleInApp()
            ->where('created_at', '>=', now()->subDays(7))
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    /** @return \Illuminate\Support\Collection<int, TourSpot> */
    private function recentTourSpots(int $limit)
    {
        return TourSpot::query()
            ->where('estado', TourSpot::ESTADO_PUBLICADO)
            ->where('created_at', '>=', now()->subDays(7))
            ->with(['categories', 'departamento:id,name', 'distrito:id,name'])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }
}
