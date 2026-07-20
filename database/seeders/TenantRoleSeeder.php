<?php

namespace Database\Seeders;

use App\Support\RoleProvisioner;
use Illuminate\Database\Seeder;

/**
 * Siembra los roles de un TENANT (restaurante) en el schema activo (rst_*).
 *
 * Debe llamarse DESPUÉS de fijar el search_path al schema del tenant,
 * normalmente durante el onboarding al crear su schema. Ejemplo:
 *
 *   DB::statement('SET search_path TO "'.$schema.'", public');
 *   (new TenantRoleSeeder())->run();
 */
class TenantRoleSeeder extends Seeder
{
    public function run(): void
    {
        RoleProvisioner::provision('tenant');
    }
}
