<?php

namespace App\Services\Tourist;

use App\Models\Customer;
use App\Models\CustomerCatalogPreference;
use App\Models\PubRestaurant;
use App\Models\PubRestaurantCatalogItem;
use App\Models\RefCatalogItem;
use App\Support\RefCatalogTypes;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CustomerPreferenceService
{
    /** Tipos que el turista elige en onboarding. */
    public const PREFERENCE_TYPES = [
        RefCatalogTypes::CUISINE,
        RefCatalogTypes::SERVICE,
        RefCatalogTypes::AMBIANCE,
    ];

    /**
     * @return array<string, list<array<string, mixed>>>
     */
    public function catalogOptions(?string $locale = null): array
    {
        $items = RefCatalogItem::query()
            ->where('active', true)
            ->whereIn('type', self::PREFERENCE_TYPES)
            ->orderBy('type')
            ->orderBy('sort_order')
            ->orderBy('name_es')
            ->get();

        $grouped = [];
        foreach (self::PREFERENCE_TYPES as $type) {
            $grouped[$type] = [];
        }

        foreach ($items as $item) {
            $grouped[$item->type][] = $item->toCatalogArray($locale);
        }

        return $grouped;
    }

    /**
     * @return array{cuisine: list<string>, service: list<string>, ambiance: list<string>, ids: list<string>}
     */
    public function preferencePayload(Customer $customer): array
    {
        $rows = $customer->catalogPreferences()
            ->get(['catalog_item_id', 'catalog_type']);

        $grouped = [
            RefCatalogTypes::CUISINE => [],
            RefCatalogTypes::SERVICE => [],
            RefCatalogTypes::AMBIANCE => [],
        ];

        foreach ($rows as $row) {
            if (! isset($grouped[$row->catalog_type])) {
                continue;
            }
            $grouped[$row->catalog_type][] = $row->catalog_item_id;
        }

        return [
            'cuisine' => $grouped[RefCatalogTypes::CUISINE],
            'service' => $grouped[RefCatalogTypes::SERVICE],
            'ambiance' => $grouped[RefCatalogTypes::AMBIANCE],
            'ids' => $rows->pluck('catalog_item_id')->values()->all(),
        ];
    }

    public function hasPreferences(Customer $customer): bool
    {
        return $customer->catalogPreferences()->exists();
    }

    /**
     * @param  list<string>  $catalogItemIds
     */
    public function sync(Customer $customer, array $catalogItemIds): void
    {
        $valid = RefCatalogItem::query()
            ->where('active', true)
            ->whereIn('type', self::PREFERENCE_TYPES)
            ->whereIn('id', $catalogItemIds)
            ->get(['id', 'type'])
            ->keyBy('id');

        $rows = [];

        foreach ($catalogItemIds as $id) {
            $item = $valid->get($id);
            if ($item === null) {
                continue;
            }
            $rows[$id] = [
                'customer_id' => $customer->id,
                'catalog_item_id' => $item->id,
                'catalog_type' => $item->type,
            ];
        }

        DB::transaction(function () use ($customer, $rows): void {
            CustomerCatalogPreference::query()
                ->where('customer_id', $customer->id)
                ->delete();

            if ($rows === []) {
                return;
            }

            foreach ($rows as $row) {
                CustomerCatalogPreference::query()->create($row);
            }
        });
    }

    /**
     * Restaurants ordenados por overlap de preferencias + tops (score_ranking).
     *
     * @return Collection<int, PubRestaurant>
     */
    public function recommendRestaurants(Customer $customer, int $limit = 10): Collection
    {
        $prefIds = $customer->catalogPreferences()
            ->pluck('catalog_item_id')
            ->unique()
            ->values()
            ->all();

        if ($prefIds === []) {
            return PubRestaurant::query()
                ->where('activo', true)
                ->orderByDesc('score_ranking')
                ->orderByDesc('destacado')
                ->orderByDesc('rating_promedio')
                ->limit($limit)
                ->get();
        }

        /** @var Collection<string, int> $matchCounts */
        $matchCounts = PubRestaurantCatalogItem::query()
            ->whereIn('catalog_item_id', $prefIds)
            ->whereIn('catalog_type', self::PREFERENCE_TYPES)
            ->selectRaw('tenant_id, COUNT(*) as match_count')
            ->groupBy('tenant_id')
            ->pluck('match_count', 'tenant_id');

        $restaurants = PubRestaurant::query()
            ->where('activo', true)
            ->get();

        return $restaurants
            ->map(function (PubRestaurant $restaurant) use ($matchCounts): array {
                $matches = (int) ($matchCounts[$restaurant->tenant_id] ?? 0);
                $score = ($matches * 100)
                    + ((float) $restaurant->score_ranking * 10)
                    + ((float) $restaurant->rating_promedio)
                    + ($restaurant->destacado ? 5 : 0);

                return ['restaurant' => $restaurant, 'score' => $score, 'matches' => $matches];
            })
            ->sortByDesc('score')
            ->take($limit)
            ->values()
            ->map(fn (array $row): PubRestaurant => $row['restaurant']);
    }
}
