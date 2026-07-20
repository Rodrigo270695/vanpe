<?php

namespace App\Jobs;

use App\Models\Tenant;
use App\Services\Platform\PublicCatalogSync;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class PublishRestaurantToCatalog implements ShouldQueue
{
    use Queueable;

    /**
     * @param  list<string>  $entities
     */
    public function __construct(
        public readonly string $tenantId,
        public readonly array $entities = [],
    ) {}

    public function handle(PublicCatalogSync $sync): void
    {
        $tenant = Tenant::query()->find($this->tenantId);

        if ($tenant === null) {
            return;
        }

        $sync->syncAll($tenant, $this->entities);
    }
}
