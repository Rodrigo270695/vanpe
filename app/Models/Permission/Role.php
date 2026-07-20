<?php

namespace App\Models\Permission;

use App\Tenancy\TenantManager;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * Rol de Spatie consciente del tenant.
 *
 * Cuando hay un restaurante resuelto (subdominio), usa la conexión `tenant`
 * (cuyo search_path apunta al schema rst_*), de modo que los roles se leen y
 * escriben en el schema del restaurante. En el dominio central usa la conexión
 * por defecto (schema public → roles de plataforma).
 */
class Role extends SpatieRole
{
    public function getConnectionName()
    {
        if (app(TenantManager::class)->check()) {
            return 'tenant';
        }

        return parent::getConnectionName();
    }
}
