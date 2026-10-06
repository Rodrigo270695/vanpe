<?php

namespace App\Services\Tourist;

use App\Models\Hotel;
use App\Models\PubRestaurant;
use App\Models\PubRestaurantCatalogItem;
use App\Models\TourSpot;
use App\Services\Platform\HotelCatalogQuery;
use App\Services\Platform\TourSpotCatalogQuery;
use App\Support\PublicMediaUrl;
use Illuminate\Support\Collection;

class SimilarPlacesService
{
    public function __construct(
        private readonly TourSpotCatalogQuery $tourSpots,
        private readonly HotelCatalogQuery $hotels,
    ) {}

    /**
     * Desde un restaurante: primero restos similares, luego centros cercanos.
     *
     * @return array{items: list<array<string, mixed>>}
     */
    public function forRestaurant(PubRestaurant $restaurant): array
    {
        $lat = $restaurant->latitud !== null ? (float) $restaurant->latitud : null;
        $lng = $restaurant->longitud !== null ? (float) $restaurant->longitud : null;

        $similar = $this->similarRestaurants($restaurant, 7)
            ->map(fn (PubRestaurant $r) => $this->mapRestaurant($r))
            ->all();

        $nearbySpots = $this->nearbyTourSpots($lat, $lng, excludeId: null, limit: 5)
            ->map(fn (TourSpot $s) => $this->mapTourSpot($s))
            ->all();

        return ['items' => $this->concatUnique($similar, $nearbySpots, 10)];
    }

    /**
     * Desde un centro: primero otros centros similares, luego restaurantes cercanos.
     *
     * @return array{items: list<array<string, mixed>>}
     */
    public function forTourSpot(TourSpot $spot): array
    {
        $lat = $spot->latitud !== null ? (float) $spot->latitud : null;
        $lng = $spot->longitud !== null ? (float) $spot->longitud : null;

        $similarSpots = $this->similarTourSpots($spot, 7)
            ->map(fn (TourSpot $s) => $this->mapTourSpot($s))
            ->all();

        $nearbyRestaurants = $this->nearbyRestaurants($lat, $lng, excludeId: null, limit: 5)
            ->map(fn (PubRestaurant $r) => $this->mapRestaurant($r))
            ->all();

        // Orden fijo: centros primero, comida después.
        return ['items' => $this->concatUnique($similarSpots, $nearbyRestaurants, 10)];
    }

    /**
     * Desde un hotel: primero hoteles parecidos (categoría, servicios y cercanía),
     * luego centros y restaurantes cercanos para armar el plan.
     *
     * @return array{items: list<array<string, mixed>>}
     */
    public function forHotel(Hotel $hotel): array
    {
        $lat = $hotel->latitud !== null ? (float) $hotel->latitud : null;
        $lng = $hotel->longitud !== null ? (float) $hotel->longitud : null;

        $similarHotels = $this->similarHotels($hotel, 7)
            ->map(fn (Hotel $h) => $this->mapHotel($h))
            ->all();

        $nearby = array_merge(
            $this->nearbyTourSpots($lat, $lng, excludeId: null, limit: 3)
                ->map(fn (TourSpot $s) => $this->mapTourSpot($s))
                ->all(),
            $this->nearbyRestaurants($lat, $lng, excludeId: null, limit: 3)
                ->map(fn (PubRestaurant $r) => $this->mapRestaurant($r))
                ->all(),
        );

        return ['items' => $this->concatUnique($similarHotels, $nearby, 10)];
    }

    /**
     * @return Collection<int, Hotel>
     */
    private function similarHotels(Hotel $hotel, int $limit): Collection
    {
        $lat = $hotel->latitud !== null ? (float) $hotel->latitud : null;
        $lng = $hotel->longitud !== null ? (float) $hotel->longitud : null;
        $services = $hotel->servicios ?? [];

        return Hotel::query()
            ->where('estado', Hotel::ESTADO_PUBLICADO)
            ->whereKeyNot($hotel->id)
            ->with(['departamento:id,name', 'provincia:id,name', 'distrito:id,name'])
            ->get()
            ->map(function (Hotel $row) use ($hotel, $lat, $lng, $services): array {
                $sharedServices = count(array_intersect($services, $row->servicios ?? []));
                $rowLat = $row->latitud !== null ? (float) $row->latitud : null;
                $rowLng = $row->longitud !== null ? (float) $row->longitud : null;
                $score = ($row->clasificacion === $hotel->clasificacion ? 40 : 0)
                    + ($sharedServices * 6)
                    + ($row->distrito_id !== null && $row->distrito_id === $hotel->distrito_id ? 15 : 0)
                    + $this->proximityBoost($lat, $lng, $rowLat, $rowLng)
                    + ((float) $row->rating_promedio * 4)
                    + ($row->destacado ? 5 : 0);

                return ['hotel' => $row, 'score' => $score];
            })
            ->sortByDesc('score')
            ->take($limit)
            ->map(fn (array $row): Hotel => $row['hotel'])
            ->values();
    }

    /**
     * @param  list<array<string, mixed>>  $first
     * @param  list<array<string, mixed>>  $second
     * @return list<array<string, mixed>>
     */
    private function concatUnique(array $first, array $second, int $limit): array
    {
        $out = [];
        $seen = [];
        foreach (array_merge($first, $second) as $item) {
            $key = ($item['kind'] ?? '').':'.($item['id'] ?? '');
            if ($key === ':' || isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $out[] = $item;
            if (count($out) >= $limit) {
                break;
            }
        }

        return array_values($out);
    }

    /**
     * @return Collection<int, PubRestaurant>
     */
    private function nearbyRestaurants(?float $lat, ?float $lng, ?string $excludeId, int $limit): Collection
    {
        $query = PubRestaurant::query()
            ->where('activo', true)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId));

        $rows = $query->get();

        if ($lat === null || $lng === null) {
            return $rows
                ->sortByDesc(fn (PubRestaurant $r) => ((float) $r->rating_promedio * 10) + (int) $r->total_resenas)
                ->take($limit)
                ->values();
        }

        return $rows
            ->filter(fn (PubRestaurant $r) => $r->latitud !== null && $r->longitud !== null)
            ->sortBy(function (PubRestaurant $row) use ($lat, $lng): float {
                return $this->haversineKm(
                    $lat,
                    $lng,
                    (float) $row->latitud,
                    (float) $row->longitud,
                );
            })
            ->take($limit)
            ->values();
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

        $cuisine = collect($restaurant->tipo_cocina ?? [])
            ->filter()
            ->map(fn ($c) => strtolower((string) $c))
            ->values()
            ->all();

        /** @var Collection<string, int> $matchCounts */
        $matchCounts = $prefIds === []
            ? collect()
            : PubRestaurantCatalogItem::query()
                ->whereIn('catalog_item_id', $prefIds)
                ->where('tenant_id', '!=', $restaurant->tenant_id)
                ->selectRaw('tenant_id, COUNT(*) as match_count')
                ->groupBy('tenant_id')
                ->pluck('match_count', 'tenant_id');

        $originLat = $restaurant->latitud !== null ? (float) $restaurant->latitud : null;
        $originLng = $restaurant->longitud !== null ? (float) $restaurant->longitud : null;

        $candidates = PubRestaurant::query()
            ->where('activo', true)
            ->where('id', '!=', $restaurant->id)
            ->get();

        $scored = $candidates
            ->map(function (PubRestaurant $row) use ($matchCounts, $cuisine, $originLat, $originLng): array {
                $rowCuisine = collect($row->tipo_cocina ?? [])
                    ->filter()
                    ->map(fn ($c) => strtolower((string) $c))
                    ->values()
                    ->all();

                $matches = (int) ($matchCounts[$row->tenant_id] ?? 0);
                $sharedCuisine = count(array_intersect($cuisine, $rowCuisine));
                $samePrimary = $cuisine !== [] && $rowCuisine !== [] && $cuisine[0] === $rowCuisine[0];

                $distanceScore = $this->proximityBoost(
                    $originLat,
                    $originLng,
                    $row->latitud !== null ? (float) $row->latitud : null,
                    $row->longitud !== null ? (float) $row->longitud : null,
                );

                // Prioridad: misma cocina / mismos tags de catálogo; cercanía refuerza.
                $score = ($sharedCuisine * 55)
                    + ($samePrimary ? 40 : 0)
                    + ($matches * 45)
                    + $distanceScore
                    + ((float) $row->rating_promedio * 5)
                    + ((int) $row->total_resenas * 0.25)
                    + ((float) $row->score_ranking * 2)
                    + ($row->destacado ? 5 : 0);

                $hasAffinity = $sharedCuisine > 0 || $matches > 0;
                if (! $hasAffinity && $distanceScore < 18) {
                    $score -= 80;
                }

                return ['restaurant' => $row, 'score' => $score, 'hasAffinity' => $hasAffinity];
            })
            ->sortByDesc('score')
            ->values();

        $hasAnyAffinity = $scored->contains(fn (array $r) => $r['hasAffinity']);
        if ($hasAnyAffinity) {
            $scored = $scored
                ->filter(fn (array $r) => $r['hasAffinity'] || $r['score'] > 20)
                ->values();
        }

        return $scored
            ->take($limit)
            ->map(fn (array $row): PubRestaurant => $row['restaurant'])
            ->values();
    }

    /**
     * @return Collection<int, TourSpot>
     */
    private function similarTourSpots(TourSpot $spot, int $limit): Collection
    {
        if (! $spot->relationLoaded('categories')) {
            $spot->load('categories');
        }

        $categorySlugs = $spot->categories->pluck('slug')->filter()->map(fn ($s) => (string) $s)->values()->all();
        $primarySlug = (string) ($spot->categories->firstWhere('pivot.is_primary', true)?->slug
            ?? $spot->categories->first()?->slug
            ?? '');

        $originLat = $spot->latitud !== null ? (float) $spot->latitud : null;
        $originLng = $spot->longitud !== null ? (float) $spot->longitud : null;

        $candidates = TourSpot::query()
            ->where('estado', TourSpot::ESTADO_PUBLICADO)
            ->where('id', '!=', $spot->id)
            ->with(['categories', 'departamento:id,name', 'distrito:id,name'])
            ->get();

        $scored = $candidates
            ->map(function (TourSpot $near) use ($categorySlugs, $primarySlug, $originLat, $originLng): array {
                $nearSlugs = $near->categories->pluck('slug')->filter()->map(fn ($s) => (string) $s)->values()->all();
                $nearPrimary = (string) ($near->categories->firstWhere('pivot.is_primary', true)?->slug
                    ?? $near->categories->first()?->slug
                    ?? '');

                $sharedCats = count(array_intersect($categorySlugs, $nearSlugs));
                $samePrimary = $primarySlug !== '' && $nearPrimary === $primarySlug;

                $distanceScore = $this->proximityBoost(
                    $originLat,
                    $originLng,
                    $near->latitud !== null ? (float) $near->latitud : null,
                    $near->longitud !== null ? (float) $near->longitud : null,
                );

                $score = ($samePrimary ? 60 : 0)
                    + ($sharedCats * 45)
                    + $distanceScore
                    + ((float) ($near->rating_promedio ?? 0) * 5)
                    + ((float) ($near->score_ranking ?? 0) * 2)
                    + (! empty($near->destacado) ? 5 : 0);

                $hasAffinity = $samePrimary || $sharedCats > 0;
                // Sin misma categoría: igual puede salir si está cerca (otros centros).
                if (! $hasAffinity && $distanceScore < 8) {
                    $score -= 25;
                }

                return ['spot' => $near, 'score' => $score, 'hasAffinity' => $hasAffinity];
            })
            ->sortByDesc('score')
            ->values();

        // No filtrar agresivo: queremos centros primero siempre (categoría o cercanos).
        return $scored
            ->take($limit)
            ->map(fn (array $row): TourSpot => $row['spot'])
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

    /**
     * @return array<string, mixed>
     */
    private function mapHotel(Hotel $hotel): array
    {
        $item = $this->hotels->toListItem($hotel);

        return [
            'kind' => 'hotel',
            'id' => $item['id'],
            'slug' => $item['slug'],
            'nombre' => $item['nombre'],
            'direccion' => $item['direccion'] ?? null,
            'portada_url' => $item['imagen_portada_url'] ?? null,
            'logo_url' => null,
            'categoria' => $item['estrellas'] ? $item['estrellas'].' estrellas' : 'Hotel',
            'estrellas' => $item['estrellas'],
            'precio_desde' => $item['precio_desde'],
            'rating_promedio' => (float) ($item['rating_promedio'] ?? 0),
            'total_resenas' => (int) ($item['total_resenas'] ?? 0),
            'latitud' => $item['latitud'] ?? null,
            'longitud' => $item['longitud'] ?? null,
            'distrito' => $item['distrito'] ?? null,
        ];
    }
}
