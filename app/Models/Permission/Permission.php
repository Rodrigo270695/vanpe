<?php

namespace App\Models\Permission;

use App\Tenancy\TenantManager;
use Spatie\Permission\Models\Permission as SpatiePermission;

/**
 * Permiso de Spatie consciente del tenant. Ver App\Models\Permission\Role.
 */
class Permission extends SpatiePermission
{
    public function getConnectionName()
    {
        if (app(TenantManager::class)->check()) {
            return 'tenant';
        }

        return parent::getConnectionName();
    }
}
