<?php

namespace App\Services\Tourist;

use App\Models\PubRestaurant;
use App\Models\TourSpot;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Recomendación híbrida:
 * 1) Recuperación por contenido (ranking, tags, tipo).
 * 2) Reordenamiento con OpenAI (gpt-4o-mini) según la consulta en lenguaje natural.
 * 3) Fallback a ranking puro si no hay API key o falla OpenAI.
 */
class HybridRecommendationService
{
    /**
     * @return array{
     *     mode: string,
     *     query: string,
     *     answer: string|null,
     *     restaurants: list<array<string, mixed>>,
     *     tour_spots: list<array<string, mixed>>
     * }
     */
    public function recommend(string $query, int $limit = 6): array
    {
        $query = trim($query);
        $limit = min(max($limit, 1), 12);

        $restaurants = $this->candidateRestaurants($query, max($limit * 3, 12));
        $spots = $this->candidateTourSpots($query, max($limit * 3, 12));

        $apiKey = (string) config('services.openai.key');

        if ($apiKey === '' || $query === '') {
            return $this->contentOnly($query, $restaurants, $spots, $limit);
        }

        try {
            return $this->hybridWithOpenAi($query, $restaurants, $spots, $limit, $apiKey);
        } catch (Throwable $e) {
            Log::warning('VanPe IA: fallback a ranking por contenido', [
                'error' => $e->getMessage(),
            ]);

            return $this->contentOnly($query, $restaurants, $spots, $limit);
        }
    }

    /**
     * @param  Collection<int, PubRestaurant>  $restaurants
     * @param  Collection<int, TourSpot>  $spots
     * @return array{mode: string, query: string, answer: string|null, restaurants: list<array<string, mixed>>, tour_spots: list<array<string, mixed>>}
     */
    private function hybridWithOpenAi(
        string $query,
        Collection $restaurants,
        Collection $spots,
        int $limit,
        string $apiKey,
    ): array {
        $catalog = [
            'restaurants' => $restaurants->map(fn (PubRestaurant $r): array => [
                'id' => $r->id,
                'nombre' => $r->nombre,
                'tipo_cocina' => $r->tipo_cocina ?? [],
                'rango_precio' => $r->rango_precio,
                'rating' => (float) $r->rating_promedio,
                'resenas' => (int) $r->total_resenas,
                'direccion' => $r->direccion,
                'descripcion' => mb_substr((string) $r->descripcion, 0, 180),
            ])->values()->all(),
            'tour_spots' => $spots->map(fn (TourSpot $s): array => [
                'id' => $s->id,
                'nombre' => $s->nombre,
                'categoria' => $s->categories->first()?->slug,
                'rating' => (float) $s->rating_promedio,
                'resenas' => (int) $s->total_resenas,
                'gratuito' => (bool) $s->es_gratuito,
                'resumen' => mb_substr((string) $s->resumen, 0, 180),
                'distrito' => $s->distrito?->name,
            ])->values()->all(),
        ];

        $model = (string) config('services.openai.model', 'gpt-4o-mini');
        $baseUrl = rtrim((string) config('services.openai.base_url', 'https://api.openai.com/v1'), '/');

        $response = Http::withToken($apiKey)
            ->timeout((int) config('services.openai.timeout', 25))
            ->acceptJson()
            ->post("{$baseUrl}/chat/completions", [
                'model' => $model,
                'temperature' => 0.2,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Eres VanPe IA, asistente turístico de Lambayeque/Chiclayo (Perú). '
                            .'Solo puedes recomendar ítems del catálogo JSON. '
                            .'Responde SOLO JSON válido con esta forma: '
                            .'{"answer":"texto corto en español","restaurant_ids":["uuid"...],"tour_spot_ids":["uuid"...]} '
                            .'Máximo '.$limit.' ids por lista. Ordena de más a menos relevante. '
                            .'No inventes ids ni lugares fuera del catálogo.',
                    ],
                    [
                        'role' => 'user',
                        'content' => json_encode([
                            'consulta' => $query,
                            'catalogo' => $catalog,
                        ], JSON_UNESCAPED_UNICODE) ?: '{}',
                    ],
                ],
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException('OpenAI HTTP '.$response->status().': '.$response->body());
        }

        $content = (string) data_get($response->json(), 'choices.0.message.content', '');
        $parsed = json_decode($content, true);

        if (! is_array($parsed)) {
            throw new \RuntimeException('OpenAI devolvió JSON inválido.');
        }

        $restaurantIds = array_values(array_filter(
            array_map('strval', $parsed['restaurant_ids'] ?? []),
            fn (string $id): bool => $restaurants->contains(fn (PubRestaurant $r): bool => $r->id === $id),
        ));
        $spotIds = array_values(array_filter(
            array_map('strval', $parsed['tour_spot_ids'] ?? []),
            fn (string $id): bool => $spots->contains(fn (TourSpot $s): bool => $s->id === $id),
        ));

        if ($restaurantIds === [] && $spotIds === []) {
            return $this->contentOnly($query, $restaurants, $spots, $limit);
        }

        $orderedRestaurants = collect($restaurantIds)
            ->map(fn (string $id) => $restaurants->firstWhere('id', $id))
            ->filter()
            ->take($limit)
            ->values();

        $orderedSpots = collect($spotIds)
            ->map(fn (string $id) => $spots->firstWhere('id', $id))
            ->filter()
            ->take($limit)
            ->values();

        return [
            'mode' => 'hybrid',
            'query' => $query,
            'answer' => is_string($parsed['answer'] ?? null) ? $parsed['answer'] : null,
            'restaurants' => $orderedRestaurants->map(fn (PubRestaurant $r): array => $this->serializeRestaurant($r))->all(),
            'tour_spots' => $orderedSpots->map(fn (TourSpot $s): array => $this->serializeSpot($s))->all(),
        ];
    }

    /**
     * @param  Collection<int, PubRestaurant>  $restaurants
     * @param  Collection<int, TourSpot>  $spots
     * @return array{mode: string, query: string, answer: string|null, restaurants: list<array<string, mixed>>, tour_spots: list<array<string, mixed>>}
     */
    private function contentOnly(string $query, Collection $restaurants, Collection $spots, int $limit): array
    {
        return [
            'mode' => 'content',
            'query' => $query,
            'answer' => $query !== ''
                ? 'Estas son las mejores opciones según ranking y afinidad con tu búsqueda.'
                : 'Recomendados según valoración y popularidad en VanPe.',
            'restaurants' => $restaurants->take($limit)->map(fn (PubRestaurant $r): array => $this->serializeRestaurant($r))->values()->all(),
            'tour_spots' => $spots->take($limit)->map(fn (TourSpot $s): array => $this->serializeSpot($s))->values()->all(),
        ];
    }

    /**
     * @return Collection<int, PubRestaurant>
     */
    private function candidateRestaurants(string $query, int $limit): Collection
    {
        $q = mb_strtolower($query);

        return PubRestaurant::query()
            ->where('activo', true)
            ->when($q !== '', function ($builder) use ($q): void {
                $builder->where(function ($inner) use ($q): void {
                    $inner->whereRaw('lower(nombre) like ?', ['%'.$q.'%'])
                        ->orWhereRaw('lower(coalesce(descripcion, \'\')) like ?', ['%'.$q.'%'])
                        ->orWhereRaw('lower(coalesce(direccion, \'\')) like ?', ['%'.$q.'%']);

                    foreach ($this->cuisineHints($q) as $slug) {
                        $inner->orWhereJsonContains('tipo_cocina', $slug);
                    }
                });
            })
            ->orderByDesc('score_ranking')
            ->orderByDesc('destacado')
            ->limit($limit)
            ->get();
    }

    /**
     * @return Collection<int, TourSpot>
     */
    private function candidateTourSpots(string $query, int $limit): Collection
    {
        $q = mb_strtolower($query);

        return TourSpot::query()
            ->where('estado', TourSpot::ESTADO_PUBLICADO)
            ->with(['categories', 'distrito:id,name', 'departamento:id,name'])
            ->when($q !== '', function ($builder) use ($q): void {
                $builder->where(function ($inner) use ($q): void {
                    $inner->whereRaw('lower(nombre) like ?', ['%'.$q.'%'])
                        ->orWhereRaw('lower(coalesce(resumen, \'\')) like ?', ['%'.$q.'%'])
                        ->orWhereRaw('lower(coalesce(descripcion, \'\')) like ?', ['%'.$q.'%']);

                    foreach ($this->spotCategoryHints($q) as $slug) {
                        $inner->orWhereHas('categories', fn ($cq) => $cq->where('slug', $slug));
                    }
                });
            })
            ->orderByDesc('score_ranking')
            ->orderByDesc('destacado')
            ->limit($limit)
            ->get();
    }

    /**
     * @return list<string>
     */
    private function cuisineHints(string $q): array
    {
        $map = [
            'ceviche' => 'cebicheria',
            'cebiche' => 'cebicheria',
            'marina' => 'mariscos',
            'marisco' => 'mariscos',
            'parrilla' => 'parrilla',
            'carne' => 'parrilla',
            'criollo' => 'criollo',
            'norteñ' => 'criollo',
            'cabrito' => 'criollo',
            'pato' => 'criollo',
            'pizza' => 'pizza-y-pasta',
            'café' => 'cafeteria',
            'cafe' => 'cafeteria',
            'niñ' => 'criollo',
        ];

        $hits = [];
        foreach ($map as $needle => $slug) {
            if (str_contains($q, $needle)) {
                $hits[] = $slug;
            }
        }

        return array_values(array_unique($hits));
    }

    /**
     * @return list<string>
     */
    private function spotCategoryHints(string $q): array
    {
        $map = [
            'museo' => 'museo',
            'sipán' => 'arqueologico',
            'sipan' => 'arqueologico',
            'huaca' => 'arqueologico',
            'pirámide' => 'arqueologico',
            'piramide' => 'arqueologico',
            'playa' => 'playa',
            'pimentel' => 'playa',
            'iglesia' => 'religioso',
            'catedral' => 'religioso',
            'niñ' => 'cultural-vivo',
            'familia' => 'cultural-vivo',
            'naturaleza' => 'naturaleza',
            'bosque' => 'naturaleza',
        ];

        $hits = [];
        foreach ($map as $needle => $slug) {
            if (str_contains($q, $needle)) {
                $hits[] = $slug;
            }
        }

        return array_values(array_unique($hits));
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
            'portada_url' => $restaurant->portada_url,
            'logo_url' => $restaurant->logo_url,
            'tipo_cocina' => $restaurant->tipo_cocina ?? [],
            'rango_precio' => $restaurant->rango_precio,
            'rating_promedio' => (float) $restaurant->rating_promedio,
            'total_resenas' => (int) $restaurant->total_resenas,
            'destacado' => (bool) $restaurant->destacado,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeSpot(TourSpot $spot): array
    {
        $primary = $spot->categories->firstWhere('pivot.is_primary', true)
            ?? $spot->categories->first();

        return [
            'id' => $spot->id,
            'slug' => $spot->slug,
            'nombre' => $spot->nombre,
            'resumen' => $spot->resumen,
            'direccion' => $spot->direccion,
            'imagen_portada_url' => $spot->imagen_portada_url,
            'rating_promedio' => (float) $spot->rating_promedio,
            'total_resenas' => (int) $spot->total_resenas,
            'destacado' => (bool) $spot->destacado,
            'categoria' => $primary?->labelForLocale('es'),
            'categoria_slug' => $primary?->slug,
            'distrito' => $spot->distrito?->name,
        ];
    }
}
