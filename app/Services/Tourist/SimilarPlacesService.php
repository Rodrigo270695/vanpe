<?php

namespace App\Services\Tourist;

use App\Models\PubRestaurant;
use App\Models\PubRestaurantCatalogItem;
use App\Models\TourSpot;
use App\Services\Platform\TourSpotCatalogQuery;
use App\Support\PublicMediaUrl;
use Illuminate\Support\Collection;

class SimilarPlacesService
{
    public function __construct(
        private readonly TourSpotCatalogQuery $tourSpots,
    ) {}

    /**
     * Desde un restaurante: 4 similares (+ 1 centro cercano si hay; si no, 5 restaurantes).
     *
     * @return array{items: list<array<string, mixed>>}
     */
    public function forRestaurant(PubRestaurant $restaurant): array
    {
        $similarRestaurants = $this->similarRestaurants($restaurant, 5);
        $nearbySpot = $this->nearbyTourSpot(
            $restaurant->latitud !== null ? (float) $restaurant->latitud : null,
            $restaurant->longitud !== null ? (float) $restaurant->longitud : null,
            excludeId: null,
        );

        $items = [];

        if ($nearbySpot !== null) {
            foreach ($similarRestaurants->take(4) as $row) {
                $items[] = $this->mapRestaurant($row);
            }
            $items[] = $this->mapTourSpot($nearbySpot);
        } else {
            foreach ($similarRestaurants->take(5) as $row) {
                $items[] = $this->mapRestaurant($row);
            }
        }

        return ['items' => $items];
    }

    /**
     * Desde un centro: 3 restaurantes top en reseñas + 2 centros cercanos.
     *
     * @return array{items: list<array<string, mixed>>}
     */
    public function forTourSpot(TourSpot $spot): array
    {
        $lat = $spot->latitud !== null ? (float) $spot->latitud : null;
        $lng = $spot->longitud !== null ? (float) $spot->longitud : null;

        $topRestaurants = $this->topRestaurantsNear($lat, $lng, 3);
        $nearbySpots = $this->nearbyTourSpots($lat, $lng, excludeId: $spot->id, limit: 2);

        $items = [];
        $usedRestaurantIds = [];

        foreach ($topRestaurants as $row) {
            $items[] = $this->mapRestaurant($row);
            $usedRestaurantIds[$row->id] = true;
        }
        foreach ($nearbySpots as $near) {
            $items[] = $this->mapTourSpot($near);
        }

        if (count($items) < 5) {
            $needed = 5 - count($items);
            $extra = $this->topRestaurantsNear($lat, $lng, $needed + 6)
                ->reject(fn (PubRestaurant $r) => isset($usedRestaurantIds[$r->id]))
                ->take($needed);

            foreach ($extra as $row) {
                $items[] = $this->mapRestaurant($row);
            }
        }

        return ['items' => array_values(array_slice($items, 0, 5))];
    }

    /**
     * @return Collection<int, PubRestaurant>
     */
    private function similarRestaurants(PubRestaurant $restaurant, int $limit): Collection
    {
        $prefIds = PubRestaurantCatalogItem::query()
            ->where('tenant_id', $restaurant->tenant_id)
            ->pluck('catalog_item_id')
            ->unique()
            ->values()
            ->all();

        $cuisine = collect($restaurant->tipo_cocina ?? [])->filter()->values()->all();

        /** @var Collection<string, int> $matchCounts */
        $matchCounts = $prefIds === []
            ? collect()
            : PubRestaurantCatalogItem::query()
                ->whereIn('catalog_item_id', $prefIds)
                ->where('tenant_id', '!=', $restaurant->tenant_id)
                ->selectRaw('tenant_id, COUNT(*) as match_count')
                ->groupBy('tenant_id')
                ->pluck('match_count', 'tenant_id');

        $candidates = PubRestaurant::query()
            ->where('activo', true)
            ->where('id', '!=', $restaurant->id)
            ->get();

        return $candidates
            ->map(function (PubRestaurant $row) use ($matchCounts, $cuisine, $restaurant): array {
                $matches = (int) ($matchCounts[$row->tenant_id] ?? 0);
                $sharedCuisine = count(array_intersect($cuisine, $row->tipo_cocina ?? []));
                $distanceScore = $this->proximityBoost(
                    $restaurant->latitud !== null ? (float) $restaurant->latitud : null,
                    $restaurant->longitud !== null ? (float) $restaurant->longitud : null,
                    $row->latitud !== null ? (float) $row->latitud : null,
                    $row->longitud !== null ? (float) $row->longitud : null,
                );

                $score = ($matches * 40)
                    + ($sharedCuisine * 25)
                    + ((float) $row->rating_promedio * 8)
                    + ((int) $row->total_resenas * 0.5)
                    + ((float) $row->score_ranking * 5)
                    + $distanceScore
                    + ($row->destacado ? 8 : 0);

                return ['restaurant' => $row, 'score' => $score];
            })
            ->sortByDesc('score')
            ->take($limit)
            ->values()
            ->map(fn (array $row): PubRestaurant => $row['restaurant']);
    }

    /**
     * @return Collection<int, PubRestaurant>
     */
    private function topRestaurantsNear(?float $lat, ?float $lng, int $limit): Collection
    {
        $rows = PubRestaurant::query()
            ->where('activo', true)
            ->orderByDesc('total_resenas')
            ->orderByDesc('rating_promedio')
            ->orderByDesc('score_ranking')
            ->limit(max($limit * 4, 12))
            ->get();

        if ($lat === null || $lng === null) {
            return $rows->take($limit)->values();
        }

        return $rows
            ->sortByDesc(function (PubRestaurant $row) use ($lat, $lng): float {
                $boost = $this->proximityBoost(
                    $lat,
                    $lng,
                    $row->latitud !== null ? (float) $row->latitud : null,
                    $row->longitud !== null ? (float) $row->longitud : null,
                );

                return ((int) $row->total_resenas * 2)
                    + ((float) $row->rating_promedio * 10)
                    + $boost;
            })
            ->take($limit)
            ->values();
    }

    private function nearbyTourSpot(?float $lat, ?float $lng, ?string $excludeId): ?TourSpot
    {
        return $this->nearbyTourSpots($lat, $lng, $excludeId, 1)->first();
    }

    /**
     * @return Collection<int, TourSpot>
     */
    private function nearbyTourSpots(?float $lat, ?float $lng, ?string $excludeId, int $limit): Collection
    {
        $query = TourSpot::query()
            ->where('estado', TourSpot::ESTADO_PUBLICADO)
            ->with(['categories', 'departamento:id,name', 'distrito:id,name'])
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId));

        if ($lat === null || $lng === null) {
            return $query
                ->orderByDesc('score_ranking')
                ->orderByDesc('destacado')
                ->limit($limit)
                ->get();
        }

        return $query
            ->whereNotNull('latitud')
            ->whereNotNull('longitud')
            ->get()
            ->sortBy(function (TourSpot $spot) use ($lat, $lng): float {
                return $this->haversineKm(
                    $lat,
                    $lng,
                    (float) $spot->latitud,
                    (float) $spot->longitud,
                );
            })
            ->take($limit)
            ->values();
    }

    private function proximityBoost(?float $lat1, ?float $lng1, ?float $lat2, ?float $lng2): float
    {
        if ($lat1 === null || $lng1 === null || $lat2 === null || $lng2 === null) {
            return 0.0;
        }

        $km = $this->haversineKm($lat1, $lng1, $lat2, $lng2);

        if ($km <= 2) {
            return 30.0;
        }
        if ($km <= 8) {
            return 18.0;
        }
        if ($km <= 20) {
            return 8.0;
        }

        return max(0.0, 4.0 - ($km / 50));
    }

    private function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earth = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return 2 * $earth * asin(min(1, sqrt($a)));
    }

    /**
     * @return array<string, mixed>
     */
    private function mapRestaurant(PubRestaurant $restaurant): array
    {
        return [
            'kind' => 'restaurant',
            'id' => $restaurant->id,
            'slug' => $restaurant->slug,
            'nombre' => $restaurant->nombre,
            'direccion' => $restaurant->direccion,
            'portada_url' => PublicMediaUrl::make($restaurant->portada_url),
            'logo_url' => PublicMediaUrl::make($restaurant->logo_url),
            'tipo_cocina' => $restaurant->tipo_cocina ?? [],
            'rating_promedio' => (float) $restaurant->rating_promedio,
            'total_resenas' => (int) $restaurant->total_resenas,
            'latitud' => $restaurant->latitud !== null ? (float) $restaurant->latitud : null,
            'longitud' => $restaurant->longitud !== null ? (float) $restaurant->longitud : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapTourSpot(TourSpot $spot): array
    {
        $item = $this->tourSpots->toListItem($spot);

        return [
            'kind' => 'tour_spot',
            'id' => $item['id'],
            'slug' => $item['slug'],
            'nombre' => $item['nombre'],
            'direccion' => $item['direccion'] ?? null,
            'portada_url' => $item['imagen_portada_url'] ?? null,
            'logo_url' => null,
            'categoria' => $item['categoria'] ?? null,
            'rating_promedio' => (float) ($item['rating_promedio'] ?? 0),
            'total_resenas' => (int) ($item['total_resenas'] ?? 0),
            'latitud' => $item['latitud'] ?? null,
            'longitud' => $item['longitud'] ?? null,
            'distrito' => $item['distrito'] ?? null,
        ];
    }
}
