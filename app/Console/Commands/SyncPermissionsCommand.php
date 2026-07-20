<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Support\PermissionCatalog;
use App\Support\RoleProvisioner;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class SyncPermissionsCommand extends Command
{
    protected $signature = 'permissions:sync
                            {--scope=all : platform, tenant o all}
                            {--tenant= : Slug del restaurante (solo scope tenant)}';

    protected $description = 'Sincroniza permisos del catálogo (config/permissions.php) con la base de datos';

    public function handle(): int
    {
        $scope = (string) $this->option('scope');

        if (! in_array($scope, ['platform', 'tenant', 'all'], true)) {
            $this->components->error('Scope inválido. Usa: platform, tenant o all.');

            return self::FAILURE;
        }

        if ($scope === 'platform' || $scope === 'all') {
            $this->syncPlatform();
        }

        if ($scope === 'tenant' || $scope === 'all') {
            $slug = $this->option('tenant');

            $query = Tenant::query();

            if ($slug) {
                $query->where('slug', $slug);
            }

            $tenants = $query->orderBy('slug')->get();

            if ($tenants->isEmpty()) {
                $this->components->warn('No hay restaurantes para sincronizar.');

                if ($scope === 'tenant') {
                    return self::FAILURE;
                }
            } else {
                foreach ($tenants as $tenant) {
                    $this->syncTenant($tenant);
                }
            }
        }

        $this->components->info('Sincronización de permisos completada.');

        return self::SUCCESS;
    }

    private function syncPlatform(): void
    {
        Config::set('database.connections.tenant.search_path', 'public');
        DB::purge('tenant');

        $this->components->task('Plataforma (public)', function (): void {
            RoleProvisioner::ensurePermissions('platform');

            foreach (PermissionCatalog::coreRoles('platform') as $roleName) {
                \App\Models\Permission\Role::findOrCreate($roleName, 'web');
            }

            RoleProvisioner::grantCoreMissingPermissions('platform');
        });

        $total = count(PermissionCatalog::names('platform'));
        $this->line("  → {$total} permisos en catálogo platform.");
    }

    private function syncTenant(Tenant $tenant): void
    {
        $schema = (string) $tenant->schema_name;

        $this->components->task("Tenant «{$tenant->slug}»", function () use ($schema): void {
            Config::set('database.connections.tenant.search_path', $schema);
            DB::purge('tenant');

            $previousDefault = Config::get('database.default');
            DB::setDefaultConnection('tenant');
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

            try {
                RoleProvisioner::ensurePermissions('tenant');

                foreach (PermissionCatalog::coreRoles('tenant') as $roleName) {
                    \App\Models\Permission\Role::findOrCreate($roleName, 'web');
                }

                RoleProvisioner::grantCoreMissingPermissions('tenant');
            } finally {
                DB::setDefaultConnection($previousDefault);
                app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
            }
        });

        $total = count(PermissionCatalog::names('tenant'));
        $this->line("  → {$total} permisos en catálogo tenant.");
    }
}
