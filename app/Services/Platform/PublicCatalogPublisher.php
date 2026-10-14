<?php

namespace App\Services\Platform;

use App\Jobs\PublishRestaurantToCatalog;
use App\Models\Tenant;

/** Publica cambios del tenant al catálogo público; la visibilidad la decide el superadmin (tenant.publicado). */
class PublicCatalogPublisher
{
    public function __construct(
        private readonly PublicCatalogSync $sync,
    ) {}

    /**
     * @param  list<string>  $entities
     */
    public function maybePublish(Tenant $tenant, array $entities): void
    {
        PublishRestaurantToCatalog::dispatch($tenant->id, $entities);
    }

    /**
     * @param  list<string>  $entities
     */
    public function publishNow(Tenant $tenant, array $entities = []): void
    {
        $this->sync->syncAll($tenant, $entities);
    }
}
