<?php

namespace App\Services\Platform;

use App\Models\RefCatalogItem;
use App\Models\RefCatalogProposal;
use App\Models\Tenant;
use App\Models\Tenant\CfgCatalogSelection;
use App\Models\User;
use App\Support\RefCatalogTypes;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RefCatalogService
{
    public function __construct(
        private readonly PublicCatalogPublisher $publisher,
    ) {}
    /**
     * @return array<string, list<array<string, mixed>>>
     */
    public function activeGrouped(?string $locale = null): array
    {
        $items = RefCatalogItem::query()
            ->where('active', true)
            ->orderBy('type')
            ->orderBy('sort_order')
            ->orderBy('name_es')
            ->get();

        $grouped = [];

        foreach (RefCatalogTypes::ALL as $type) {
            $grouped[$type] = [];
        }

        foreach ($items as $item) {
            $grouped[$item->type][] = $item->toCatalogArray($locale);
        }

        return $grouped;
    }

    /**
     * @return Collection<string, RefCatalogItem>
     */
    public function activeItemsKeyed(): Collection
    {
        return RefCatalogItem::query()
            ->where('active', true)
            ->get()
            ->keyBy('id');
    }

    /**
     * @param  list<string>  $catalogItemIds
     */
    public function syncTenantSelections(Tenant $tenant, array $catalogItemIds): void
    {
        $valid = $this->activeItemsKeyed();

        $typesById = [];

        foreach ($catalogItemIds as $id) {
            if ($valid->has($id)) {
                $typesById[$id] = (string) $valid->get($id)?->type;
            }
        }

        $this->runInTenantSchema($tenant, function () use ($typesById, $catalogItemIds): void {
            CfgCatalogSelection::syncIds($catalogItemIds, $typesById);
        });
    }

    public function propose(Tenant $tenant, string $type, string $suggestedName): RefCatalogProposal
    {
        $normalized = trim($suggestedName);

        $duplicate = RefCatalogProposal::query()
            ->where('tenant_id', $tenant->id)
            ->where('type', $type)
            ->where('status', RefCatalogProposal::STATUS_PENDING)
            ->whereRaw('LOWER(suggested_name) = ?', [Str::lower($normalized)])
            ->exists();

        if ($duplicate) {
            throw new \InvalidArgumentException(__('messages.catalog.proposal_duplicate'));
        }

        return RefCatalogProposal::query()->create([
            'tenant_id' => $tenant->id,
            'type' => $type,
            'suggested_name' => $normalized,
            'status' => RefCatalogProposal::STATUS_PENDING,
        ]);
    }

    public function approveProposal(RefCatalogProposal $proposal, User $reviewer): RefCatalogItem
    {
        if (! $proposal->isPending()) {
            throw new \InvalidArgumentException(__('messages.catalog.proposal_not_pending'));
        }

        return DB::transaction(function () use ($proposal, $reviewer): RefCatalogItem {
            $slug = $this->uniqueSlug($proposal->type, $proposal->suggested_name);

            $item = RefCatalogItem::query()->create([
                'type' => $proposal->type,
                'slug' => $slug,
                'name_es' => $proposal->suggested_name,
                'name_en' => $proposal->suggested_name,
                'sort_order' => (int) RefCatalogItem::query()
                    ->where('type', $proposal->type)
                    ->max('sort_order') + 1,
                'active' => true,
            ]);

            $proposal->update([
                'status' => RefCatalogProposal::STATUS_APPROVED,
                'catalog_item_id' => $item->id,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
                'rejection_reason' => null,
            ]);

            $tenant = $proposal->tenant;

            if ($tenant !== null) {
                $this->runInTenantSchema($tenant, function () use ($item): void {
                    CfgCatalogSelection::query()->firstOrCreate(
                        ['catalog_item_id' => $item->id],
                        ['catalog_type' => $item->type],
                    );
                });

                $this->publisher->maybePublish($tenant, ['catalogo']);
            }

            return $item;
        });
    }

    public function rejectProposal(
        RefCatalogProposal $proposal,
        User $reviewer,
        ?string $reason = null,
    ): void {
        if (! $proposal->isPending()) {
            throw new \InvalidArgumentException(__('messages.catalog.proposal_not_pending'));
        }

        $proposal->update([
            'status' => RefCatalogProposal::STATUS_REJECTED,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    private function uniqueSlug(string $type, string $name): string
    {
        $base = Str::slug(Str::limit($name, 60, '')) ?: 'item';
        $slug = $base;
        $suffix = 2;

        while (RefCatalogItem::query()->where('type', $type)->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    private function runInTenantSchema(Tenant $tenant, callable $callback): void
    {
        $schema = (string) $tenant->schema_name;

        Config::set('database.connections.tenant.search_path', $schema);
        DB::purge('tenant');

        $previous = DB::getDefaultConnection();
        DB::setDefaultConnection('tenant');

        try {
            $callback();
        } finally {
            DB::setDefaultConnection($previous);
        }
    }
}
