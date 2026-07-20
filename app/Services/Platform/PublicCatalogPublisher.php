<?php

namespace App\Services\Platform;

use App\Jobs\PublishRestaurantToCatalog;
use App\Models\Tenant;
use App\Models\Tenant\CfgSetting;
use App\Models\Tenant\PubSyncState;
use App\Services\Tenant\TenantProvisioner;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/** Decide cuándo publicar cambios del tenant al catálogo público. */
class PublicCatalogPublisher
{
    public function __construct(
        private readonly PublicCatalogSync $sync,
        private readonly TenantProvisioner $tenantProvisioner,
    ) {}

    /**
     * @param  list<string>  $entities
     */
    public function maybePublish(Tenant $tenant, array $entities): void
    {
        if ($this->autoPublishEnabled($tenant)) {
            PublishRestaurantToCatalog::dispatch($tenant->id, $entities);

            return;
        }

        $this->markPending($tenant, $entities);
    }

    /**
     * @param  list<string>  $entities
     */
    public function publishNow(Tenant $tenant, array $entities = []): void
    {
        $this->sync->syncAll($tenant, $entities);
    }

    /**
     * @param  list<string>  $entities
     */
    private function markPending(Tenant $tenant, array $entities): void
    {
        $previous = DB::getDefaultConnection();
        $previousPath = config('database.connections.tenant.search_path');

        $this->tenantProvisioner->bindSchema($tenant);
        DB::setDefaultConnection('tenant');

        try {
            foreach ($entities as $entity) {
                PubSyncState::markPending($entity);
            }
        } finally {
            DB::setDefaultConnection($previous);
            Config::set('database.connections.tenant.search_path', $previousPath);
            DB::purge('tenant');
        }
    }

    private function autoPublishEnabled(Tenant $tenant): bool
    {
        $previous = DB::getDefaultConnection();
        $previousPath = config('database.connections.tenant.search_path');

        $this->tenantProvisioner->bindSchema($tenant);
        DB::setDefaultConnection('tenant');

        try {
            return CfgSetting::ensureDefaults()->auto_publish;
        } finally {
            DB::setDefaultConnection($previous);
            Config::set('database.connections.tenant.search_path', $previousPath);
            DB::purge('tenant');
        }
    }
}
