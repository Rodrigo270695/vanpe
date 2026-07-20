<?php

namespace Database\Seeders;

use App\Support\PermissionCatalog;
use App\Support\RoleProvisioner;
use Illuminate\Database\Seeder;

/**
 * Sincroniza permisos de plataforma y los asigna al rol superadmin.
 *
 * Ejecutar: php artisan db:seed --class=PermissionSeeder
 */
class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        RoleProvisioner::ensurePermissions('platform');
        RoleProvisioner::grantCoreMissingPermissions('platform');

        $total = count(PermissionCatalog::names('platform'));

        $this->command?->info(
            "Permisos de plataforma sincronizados ({$total}) y asignados a superadmin.",
        );
    }
}
