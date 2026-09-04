<?php

namespace App\Services\Tourist;

use App\Models\AppFavorite;
use App\Models\Customer;
use App\Models\CustomerInterestGroupPreference;
use App\Models\PubRestaurant;
use App\Models\PubRestaurantCatalogItem;
use App\Models\RefCatalogItem;
use App\Models\TourSpot;
use App\Models\TouristInterestCategory;
use App\Models\TouristInterestGroup;
use App\Models\TouristRoute;
use App\Models\TouristRouteStop;
use App\Support\RefCatalogTypes;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TouristInterestService
{
    /** @return list<array<string, mixed>> */
    public function interestOptions(?string $locale = null): array
    {
        return TouristInterestGroup::query()
            ->where('active', true)
            ->orderBy('sort_order')
            ->orderBy('name_es')
            ->get()
            ->map(fn (TouristInterestGroup $group): array => $group->toOptionArray($locale))
            ->values()
            ->all();
    }

    /**
     * @return array{interest_group_ids: list<string>}
     */
    public function preferencePayload(Customer $customer): array
    {
        return [
            'interest_group_ids' => $customer->interestGroupPreferences()
                ->pluck('interest_group_id')
                ->values()
                ->all(),
        ];
    }

    public function hasInterestPreferences(Customer $customer): bool
    {
        return $customer->interestGroupPreferences()->exists();
    }

    /**
     * @param  list<string>  $groupIds
     */
    public function syncGroups(Customer $customer, array $groupIds): void
    {
        $validIds = TouristInterestGroup::query()
            ->where('active', true)
            ->whereIn('id', $groupIds)
            ->pluck('id')
            ->all();

        DB::transaction(function () use ($customer, $validIds): void {
            CustomerInterestGroupPreference::query()
                ->where('customer_id', $customer->id)
                ->delete();

            foreach ($validIds as $groupId) {
                CustomerInterestGroupPreference::query()->create([
                    'customer_id' => $customer->id,
                    'interest_group_id' => $groupId,
                ]);
            }
        });
    }

    /**
     * IDs de catálogo tenant resueltos desde los grupos de interés del turista.
     *
     * @return list<string>
     */
    public function resolvedCatalogItemIds(Customer $customer): array
    {
        $groupIds = $customer->interestGroupPreferences()->pluck('interest_group_id')->all();

        if ($groupIds === []) {
            return [];
        }

        $restaurantGroupIds = TouristInterestGroup::query()
            ->whereIn('id', $groupIds)
            ->where('target_entity', TouristInterestGroup::TARGET_RESTAURANT)
            ->pluck('id')
            ->all();

        if ($restaurantGroupIds === []) {
            return [];
        }

        return TouristInterestCategory::query()
            ->whereIn('group_id', $restaurantGroupIds)
            ->where('active', true)
            ->with('catalogItems:id')
            ->get()
            ->flatMap(fn (TouristInterestCategory $category) => $category->catalogItems->pluck('id'))
            ->unique()
            ->values()
            ->all();
    }

    /**
     * IDs de categorías de centros turísticos resueltos desde los grupos elegidos.
     *
     * @return list<string>
     */
    public function resolvedTourCategoryIds(Customer $customer): array
    {
        $groupIds = $customer->interestGroupPreferences()->pluck('interest_group_id')->all();

        if ($groupIds === []) {
            return [];
        }

        $tourGroupIds = TouristInterestGroup::query()
            ->whereIn('id', $groupIds)
            ->where('target_entity', TouristInterestGroup::TARGET_TOUR_SPOT)
            ->pluck('id')
            ->all();

        if ($tourGroupIds === []) {
            return [];
        }

        return TouristInterestCategory::query()
            ->whereIn('group_id', $tourGroupIds)
            ->where('active', true)
            ->with('tourCategories:id')
            ->get()
            ->flatMap(fn (TouristInterestCategory $category) => $category->tourCategories->pluck('id'))
            ->unique()
            ->values()
            ->all();
    }

    public function hasRestaurantInterestGroups(Customer $customer): bool
    {
        $groupIds = $customer->interestGroupPreferences()->pluck('interest_group_id')->all();
        if ($groupIds === []) {
            return false;
        }

        return TouristInterestGroup::query()
            ->whereIn('id', $groupIds)
            ->where('target_entity', TouristInterestGroup::TARGET_RESTAURANT)
            ->exists();
    }

    public function hasTourSpotInterestGroups(Customer $customer): bool
    {
        $groupIds = $customer->interestGroupPreferences()->pluck('interest_group_id')->all();
        if ($groupIds === []) {
            return false;
        }

        return TouristInterestGroup::query()
            ->whereIn('id', $groupIds)
            ->where('target_entity', TouristInterestGroup::TARGET_TOUR_SPOT)
            ->exists();
    }

    /**
     * @return array{favorite_ids: list<string>, route_ids: list<string>}
     */
    private function behaviorSignals(Customer $customer, string $targetType): array
    {
        $favoriteIds = AppFavorite::query()
            ->where('customer_id', $customer->id)
            ->where('target_type', $targetType)
            ->pluck('target_id')
            ->map(fn ($id): string => (string) $id)
            ->all();

        $routeIds = TouristRouteStop::query()
            ->where('target_type', $targetType)
            ->whereIn(
                'tourist_route_id',
                TouristRoute::query()
                    ->where('customer_id', $customer->id)
                    ->whereNotIn('status', [
                        TouristRoute::STATUS_CANCELLED,
                    ])
                    ->select('id'),
            )
            ->pluck('target_id')
            ->map(fn ($id): string => (string) $id)
            ->unique()
            ->values()
            ->all();

        return [
            'favorite_ids' => $favoriteIds,
            'route_ids' => $routeIds,
        ];
    }

    /**
     * @return Collection<int, PubRestaurant>
     */
    public function recommendRestaurants(Customer $customer, int $limit = 10): Collection
    {
        $prefIds = $this->resolvedCatalogItemIds($customer);
        $hasInterestGroups = $this->hasInterestPreferences($customer);
        $hasRestaurantGroups = $this->hasRestaurantInterestGroups($customer);

        if ($prefIds === []) {
            $prefIds = $customer->catalogPreferences()
                ->pluck('catalog_item_id')
                ->unique()
                ->values()
                ->all();
        }

        // Solo eligió Turismo/Naturaleza: no rellenar con restaurantes genéricos.
        if ($prefIds === [] && $hasInterestGroups && ! $hasRestaurantGroups) {
            return collect();
        }

        $signals = $this->behaviorSignals($customer, AppFavorite::TARGET_RESTAURANT);
        $favoriteSet = array_fill_keys($signals['favorite_ids'], true);
        $routeSet = array_fill_keys($signals['route_ids'], true);
        $hasBehavior = $favoriteSet !== [] || $routeSet !== [];

        if ($prefIds === [] && ! $hasBehavior) {
            return PubRestaurant::query()
                ->where('activo', true)
                ->orderByDesc('score_ranking')
                ->orderByDesc('destacado')
                ->orderByDesc('rating_promedio')
                ->limit($limit)
                ->get();
        }

        /** @var Collection<string, int> $matchCounts */
        $matchCounts = $prefIds === []
            ? collect()
            : PubRestaurantCatalogItem::query()
                ->whereIn('catalog_item_id', $prefIds)
                ->whereIn('catalog_type', CustomerPreferenceService::PREFERENCE_TYPES)
                ->selectRaw('tenant_id, COUNT(*) as match_count')
                ->groupBy('tenant_id')
                ->pluck('match_count', 'tenant_id');

        $scored = PubRestaurant::query()
            ->where('activo', true)
            ->get()
            ->map(function (PubRestaurant $restaurant) use ($matchCounts, $favoriteSet, $routeSet): array {
                $id = (string) $restaurant->id;
                $matches = (int) ($matchCounts[$restaurant->tenant_id] ?? 0);
                $favBoost = isset($favoriteSet[$id]) ? 80 : 0;
                $routeBoost = isset($routeSet[$id]) ? 45 : 0;
                $score = ($matches * 100)
                    + $favBoost
                    + $routeBoost
                    + ((float) $restaurant->score_ranking * 10)
                    + ((float) $restaurant->rating_promedio)
                    + ($restaurant->destacado ? 5 : 0);

                return [
                    'restaurant' => $restaurant,
                    'score' => $score,
                    'matches' => $matches,
                    'behavior' => $favBoost > 0 || $routeBoost > 0,
                ];
            });

        // Primera vez (solo intereses): exigir match de preferencia.
        // Con historial: permitir también favoritos/rutas aunque el match sea 0.
        if ($prefIds !== []) {
            $scored = $scored->filter(
                fn (array $row): bool => $row['matches'] > 0 || ($hasBehavior && $row['behavior']),
            );
        } elseif ($hasBehavior) {
            $scored = $scored->filter(fn (array $row): bool => $row['behavior']);
        }

        return $scored
            ->sortByDesc('score')
            ->take($limit)
            ->values()
            ->map(fn (array $row): PubRestaurant => $row['restaurant']);
    }

    /**
     * @return Collection<int, TourSpot>
     */
    public function recommendTourSpots(Customer $customer, int $limit = 10): Collection
    {
        $categoryIds = $this->resolvedTourCategoryIds($customer);
        $hasInterestGroups = $this->hasInterestPreferences($customer);
        $hasTourGroups = $this->hasTourSpotInterestGroups($customer);

        // Solo eligió Gastronomía: no devolver museos/centros genéricos.
        if ($categoryIds === [] && $hasInterestGroups && ! $hasTourGroups) {
            return collect();
        }

        $signals = $this->behaviorSignals($customer, AppFavorite::TARGET_TOUR_SPOT);
        $favoriteSet = array_fill_keys($signals['favorite_ids'], true);
        $routeSet = array_fill_keys($signals['route_ids'], true);
        $hasBehavior = $favoriteSet !== [] || $routeSet !== [];

        if ($categoryIds === [] && ! $hasBehavior) {
            // Sin intereses de turismo ni historial: vacío en modo personalizado.
            return collect();
        }

        $query = TourSpot::query()->where('estado', TourSpot::ESTADO_PUBLICADO);

        if ($categoryIds !== []) {
            $query
                ->where(function ($q) use ($categoryIds, $signals): void {
                    $q->whereHas(
                        'categories',
                        fn ($cq) => $cq->whereIn('tour_categories.id', $categoryIds),
                    );
                    if ($signals['favorite_ids'] !== [] || $signals['route_ids'] !== []) {
                        $behaviorIds = array_values(array_unique([
                            ...$signals['favorite_ids'],
                            ...$signals['route_ids'],
                        ]));
                        $q->orWhereIn('id', $behaviorIds);
                    }
                })
                ->withCount([
                    'categories as interest_matches' => fn ($q) => $q->whereIn('tour_categories.id', $categoryIds),
                ]);
        } else {
            $behaviorIds = array_values(array_unique([
                ...$signals['favorite_ids'],
                ...$signals['route_ids'],
            ]));
            $query->whereIn('id', $behaviorIds);
        }

        return $query
            ->get()
            ->map(function (TourSpot $spot) use ($favoriteSet, $routeSet): array {
                $id = (string) $spot->id;
                $matches = (int) ($spot->interest_matches ?? 0);
                $favBoost = isset($favoriteSet[$id]) ? 80 : 0;
                $routeBoost = isset($routeSet[$id]) ? 45 : 0;
                $score = ($matches * 100)
                    + $favBoost
                    + $routeBoost
                    + ((float) $spot->score_ranking * 10)
                    + ($spot->destacado ? 5 : 0);

                return ['spot' => $spot, 'score' => $score];
            })
            ->sortByDesc('score')
            ->take($limit)
            ->values()
            ->map(fn (array $row): TourSpot => $row['spot']);
    }

    /**
     * @return array<string, mixed>
     */
    public function adminIndexPayload(): array
    {
        $catalogItems = RefCatalogItem::query()
            ->where('active', true)
            ->whereIn('type', [
                RefCatalogTypes::CUISINE,
                RefCatalogTypes::SERVICE,
                RefCatalogTypes::AMBIANCE,
            ])
            ->orderBy('type')
            ->orderBy('sort_order')
            ->get(['id', 'type', 'slug', 'name_es'])
            ->map(fn (RefCatalogItem $item): array => [
                'id' => $item->id,
                'type' => $item->type,
                'slug' => $item->slug,
                'name_es' => $item->name_es,
            ]);

        $tourCategories = \App\Models\TourCategory::query()
            ->where('active', true)
            ->orderBy('sort_order')
            ->get(['id', 'slug', 'name_es'])
            ->map(fn ($cat): array => [
                'id' => $cat->id,
                'slug' => $cat->slug,
                'name_es' => $cat->name_es,
            ]);

        $groups = TouristInterestGroup::query()
            ->with([
                'categories' => fn ($q) => $q->orderBy('sort_order')->with([
                    'catalogItems:id',
                    'tourCategories:id',
                ]),
            ])
            ->orderBy('sort_order')
            ->get()
            ->map(fn (TouristInterestGroup $group): array => [
                'id' => $group->id,
                'slug' => $group->slug,
                'name_es' => $group->name_es,
                'target_entity' => $group->target_entity,
                'categories' => $group->categories->map(fn (TouristInterestCategory $cat): array => [
                    'id' => $cat->id,
                    'slug' => $cat->slug,
                    'name_es' => $cat->name_es,
                    'catalog_item_ids' => $cat->catalogItems->pluck('id')->values()->all(),
                    'tour_category_ids' => $cat->tourCategories->pluck('id')->values()->all(),
                ])->values()->all(),
            ]);

        return [
            'groups' => $groups,
            'catalog_items' => $catalogItems,
            'tour_categories' => $tourCategories,
        ];
    }

    /**
     * @param  list<string>  $catalogItemIds
     */
    public function syncCategoryCatalogItems(TouristInterestCategory $category, array $catalogItemIds): void
    {
        $valid = RefCatalogItem::query()
            ->where('active', true)
            ->whereIn('type', CustomerPreferenceService::PREFERENCE_TYPES)
            ->whereIn('id', $catalogItemIds)
            ->pluck('id')
            ->all();

        $category->catalogItems()->sync($valid);
    }

    /**
     * @param  list<string>  $tourCategoryIds
     */
    public function syncCategoryTourCategories(TouristInterestCategory $category, array $tourCategoryIds): void
    {
        $valid = \App\Models\TourCategory::query()
            ->where('active', true)
            ->whereIn('id', $tourCategoryIds)
            ->pluck('id')
            ->all();

        $category->tourCategories()->sync($valid);
    }
}
