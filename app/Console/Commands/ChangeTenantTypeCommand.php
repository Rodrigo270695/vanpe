<?php

namespace App\Console\Commands;

use App\Models\Permission\Role;
use App\Models\Tenant;
use App\Services\Platform\CraftCatalogProvisioner;
use App\Services\Platform\HotelCatalogProvisioner;
use App\Services\Platform\PublicCatalogProvisioner;
use App\Services\Platform\TourSpotCatalogProvisioner;
use App\Support\PermissionCatalog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

class ChangeTenantTypeCommand extends Command
{
    protected $signature = 'tenants:change-type
                            {tenant : Slug o correo del dueño}
                            {tipo? : restaurant, tour_spot, hotel o craft (vacío = solo mostrar)}';

    protected $description = 'Muestra o cambia el tipo de negocio de un tenant (crea su ficha y sincroniza roles)';

    public function handle(): int
    {
        $key = mb_strtolower(trim((string) $this->argument('tenant')));

        $tenant = Tenant::query()
            ->where('slug', $key)
            ->orWhereRaw('lower(email_admin) = ?', [$key])
            ->first();

        if ($tenant === null) {
            $this->components->error("No existe un tenant con slug o correo «{$key}».");

            return self::FAILURE;
        }

        $tipo = $this->argument('tipo');

        $this->components->twoColumnDetail('Tenant', "{$tenant->nombre_comercial} ({$tenant->slug})");
        $this->components->twoColumnDetail('Tipo actual', $tenant->tipo ?: Tenant::TYPE_RESTAURANT);

        if ($tipo === null) {
            return self::SUCCESS;
        }

        if (! in_array($tipo, Tenant::TYPES, true)) {
            $this->components->error('Tipo inválido. Usa: '.implode(', ', Tenant::TYPES).'.');

            return self::FAILURE;
        }

        $tenant->update(['tipo' => $tipo]);

        match ($tipo) {
            Tenant::TYPE_TOUR_SPOT => app(TourSpotCatalogProvisioner::class)->createStubForTenant($tenant),
            Tenant::TYPE_HOTEL => app(HotelCatalogProvisioner::class)->createStubForTenant($tenant),
            Tenant::TYPE_CRAFT => app(CraftCatalogProvisioner::class)->createStubForTenant($tenant),
            default => app(PublicCatalogProvisioner::class)->createStubForTenant($tenant),
        };

        $this->call('permissions:sync', ['--scope' => 'tenant', '--tenant' => $tenant->slug]);

        $this->resetTemplateRoles($tenant, $tipo);

        $this->components->info("Tipo cambiado a «{$tipo}». El usuario debe recargar la página.");

        return self::SUCCESS;
    }

    /**
     * Ajusta las plantillas de roles al nuevo tipo: los roles de la plantilla quedan
     * con exactamente sus permisos y se borran los de otros tipos que no tengan usuarios.
     */
    private function resetTemplateRoles(Tenant $tenant, string $tipo): void
    {
        $templates = [
            Tenant::TYPE_RESTAURANT => (array) Config::get('roles.tenant.roles', []),
            Tenant::TYPE_TOUR_SPOT => (array) Config::get('roles.tenant.roles_tour_spot', []),
            Tenant::TYPE_HOTEL => (array) Config::get('roles.tenant.roles_hotel', []),
            Tenant::TYPE_CRAFT => (array) Config::get('roles.tenant.roles_craft', []),
        ];
        $current = $templates[$tipo] ?? [];
        $core = PermissionCatalog::coreRoles('tenant');
        $foreign = array_diff(
            array_keys(array_merge(...array_values($templates))),
            array_keys($current),
            $core,
        );

        Config::set('database.connections.tenant.search_path', (string) $tenant->schema_name);
        DB::purge('tenant');
        $previousDefault = Config::get('database.default');
        DB::setDefaultConnection('tenant');
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        try {
            foreach ($current as $roleName => $permissions) {
                if (in_array($roleName, $core, true) || $permissions === ['*']) {
                    continue;
                }

                Role::findOrCreate((string) $roleName, 'web')->syncPermissions(array_values($permissions));
            }

            $pivot = (string) config('permission.table_names.model_has_roles', 'model_has_roles');

            foreach (Role::query()->whereIn('name', $foreign)->where('guard_name', 'web')->get() as $role) {
                if (DB::table($pivot)->where('role_id', $role->id)->exists()) {
                    $this->components->warn("Rol «{$role->name}» conservado: tiene usuarios asignados.");

                    continue;
                }

                $role->delete();
                $this->components->twoColumnDetail('Rol eliminado', $role->name);
            }
        } finally {
            DB::setDefaultConnection($previousDefault);
            app(PermissionRegistrar::class)->forgetCachedPermissions();
        }
    }
}
