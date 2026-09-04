<?php

namespace App\Services\Tourist;

use App\Models\Customer;
use App\Models\CustomerCatalogPreference;
use App\Models\PubRestaurant;
use App\Models\RefCatalogItem;
use App\Support\RefCatalogTypes;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CustomerPreferenceService
{
    public function __construct(
        private readonly TouristInterestService $interests,
    ) {}

    /** Tipos que el turista elige en onboarding (legacy). */
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
     * @return array{
     *     interest_group_ids: list<string>,
     *     cuisine: list<string>,
     *     service: list<string>,
     *     ambiance: list<string>,
     *     ids: list<string>
     * }
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
            ...$this->interests->preferencePayload($customer),
            'cuisine' => $grouped[RefCatalogTypes::CUISINE],
            'service' => $grouped[RefCatalogTypes::SERVICE],
            'ambiance' => $grouped[RefCatalogTypes::AMBIANCE],
            'ids' => $rows->pluck('catalog_item_id')->values()->all(),
        ];
    }

    public function hasPreferences(Customer $customer): bool
    {
        return $this->interests->hasInterestPreferences($customer)
            || $customer->catalogPreferences()->exists();
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
     * @param  list<string>  $groupIds
     */
    public function syncInterestGroups(Customer $customer, array $groupIds): void
    {
        $this->interests->syncGroups($customer, $groupIds);
    }

    /**
     * @return Collection<int, PubRestaurant>
     */
    public function recommendRestaurants(Customer $customer, int $limit = 10): Collection
    {
        return $this->interests->recommendRestaurants($customer, $limit);
    }

    /**
     * @return Collection<int, \App\Models\TourSpot>
     */
    public function recommendTourSpots(Customer $customer, int $limit = 10): Collection
    {
        return $this->interests->recommendTourSpots($customer, $limit);
    }

    public function hasRestaurantInterestGroups(Customer $customer): bool
    {
        return $this->interests->hasRestaurantInterestGroups($customer);
    }

    public function hasTourSpotInterestGroups(Customer $customer): bool
    {
        return $this->interests->hasTourSpotInterestGroups($customer);
    }
}
