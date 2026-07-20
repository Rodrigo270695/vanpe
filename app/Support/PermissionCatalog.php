<?php

namespace App\Support;

use Illuminate\Support\Facades\Config;

/**
 * Acceso al catálogo de permisos por scope (config/permissions.php).
 *
 * Scopes:
 *  - 'platform' → permisos de la plataforma (schema public).
 *  - 'tenant'   → capacidades del restaurante (schema rst_*).
 */
class PermissionCatalog
{
    /**
     * Todos los nombres de permiso del scope, aplanados.
     *
     * @return array<int, string>
     */
    public static function names(string $scope = 'platform'): array
    {
        $names = [];

        foreach (self::modules($scope) as $module) {
            foreach (array_keys((array) ($module['permissions'] ?? [])) as $name) {
                $names[] = $name;
            }
        }

        return $names;
    }

    /**
     * Catálogo agrupado por módulo, listo para el frontend.
     *
     * @return array<int, array{key: string, label: string, permissions: array<int, array{name: string, label: string}>}>
     */
    public static function groups(string $scope = 'platform'): array
    {
        $groups = [];
        $moduleLabels = (array) trans("messages.permissions.$scope.modules");
        $itemLabels = (array) trans("messages.permissions.$scope.items");

        foreach (self::modules($scope) as $key => $module) {
            $permissions = [];

            foreach ((array) ($module['permissions'] ?? []) as $name => $label) {
                $permissions[] = [
                    'name' => $name,
                    'label' => (string) ($itemLabels[$name] ?? $label),
                ];
            }

            $groups[] = [
                'key' => $key,
                'label' => (string) ($moduleLabels[$key] ?? ($module['label'] ?? $key)),
                'permissions' => $permissions,
            ];
        }

        return $groups;
    }

    /**
     * Roles del sistema del scope (no editables desde la UI).
     *
     * @return array<int, string>
     */
    public static function coreRoles(string $scope = 'platform'): array
    {
        return array_values((array) Config::get("permissions.$scope.core_roles", []));
    }

    /**
     * Roles protegidos del scope: no se eliminan ni renombran.
     *
     * @return array<int, string>
     */
    public static function protectedRoles(string $scope = 'platform'): array
    {
        if ($scope === 'tenant') {
            return array_values((array) Config::get("roles.$scope.protected_roles", []));
        }

        return self::coreRoles($scope);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private static function modules(string $scope): array
    {
        return (array) Config::get("permissions.$scope.modules", []);
    }
}
