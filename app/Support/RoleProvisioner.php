<?php

namespace App\Support;

use App\Models\Permission\Permission;
use App\Models\Permission\Role;
use Illuminate\Support\Facades\Config;
use Spatie\Permission\PermissionRegistrar;

/**
 * Aprovisiona roles y permisos (Spatie) para un scope dado.
 *
 * Es agnóstico al schema: opera sobre la conexión/schema activo, por lo que
 * sirve tanto para el schema `public` (plataforma) como para el schema de
 * un restaurante (`rst_*`) una vez fijado el search_path del tenant.
 *
 * Los permisos (capacidades) se leen del catálogo (config/permissions.php) y
 * las plantillas de roles de config/roles.php.
 */
class RoleProvisioner
{
    /**
     * @param  'platform'|'tenant'  $scope
     */
    public static function provision(string $scope, string $guard = 'web'): void
    {
        $permissions = self::ensurePermissions($scope, $guard);
        $roles = (array) Config::get("roles.$scope.roles", []);

        if ($permissions === [] && $roles === []) {
            throw new \InvalidArgumentException("Scope de roles desconocido o vacío: {$scope}");
        }

        // Roles plantilla + asignación de permisos.
        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::findOrCreate($roleName, $guard);

            $toSync = $rolePermissions === ['*']
                ? $permissions
                : $rolePermissions;

            $role->syncPermissions($toSync);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Crea permisos faltantes del catálogo sin tocar roles existentes.
     *
     * @return array<int, string> Nombres recién creados.
     */
    public static function ensurePermissions(string $scope, string $guard = 'web'): array
    {
        $catalog = PermissionCatalog::names($scope);

        foreach ($catalog as $name) {
            Permission::query()->firstOrCreate([
                'name' => $name,
                'guard_name' => $guard,
            ]);
        }

        if ($catalog !== []) {
            app(PermissionRegistrar::class)->forgetCachedPermissions();
        }

        return $catalog;
    }

    /**
     * Asigna al rol núcleo los permisos del catálogo que aún no tenga.
     */
    public static function grantCoreMissingPermissions(string $scope, string $guard = 'web'): void
    {
        $coreRoles = PermissionCatalog::coreRoles($scope);

        if ($coreRoles === []) {
            return;
        }

        $catalog = PermissionCatalog::names($scope);

        foreach ($coreRoles as $roleName) {
            $role = Role::query()
                ->where('name', $roleName)
                ->where('guard_name', $guard)
                ->first();

            if ($role === null) {
                continue;
            }

            $role->givePermissionTo($catalog);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
