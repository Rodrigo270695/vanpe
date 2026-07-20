<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\RoleRequest;
use App\Models\Permission\Permission;
use App\Models\Permission\Role;
use App\Support\PermissionCatalog;
use App\Tenancy\TenantManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Gestión de roles. Misma pantalla para dos ámbitos:
 *
 *  - Plataforma (dominio central): el superadmin gestiona los roles del
 *    schema public. Autorización granular (roles.view/create/update/...).
 *  - Restaurante (subdominio): el dueño gestiona los roles de SU schema
 *    (rst_*). Autorización por la capacidad 'tenant.users.manage'.
 *
 * El scope se resuelve por contexto: si hay tenant resuelto, es 'tenant'.
 */
class RoleController extends Controller
{
    private const GUARD = 'web';

    private function scope(): string
    {
        return app(TenantManager::class)->check() ? 'tenant' : 'platform';
    }

    /**
     * Habilidad (permiso) requerida para cada acción según el scope.
     *
     * @return array<string, string>
     */
    private function abilities(string $scope): array
    {
        if ($scope === 'tenant') {
            $manage = (string) config('permissions.tenant.manage_ability', 'tenant.users.manage');

            return [
                'view' => $manage,
                'create' => $manage,
                'update' => $manage,
                'delete' => $manage,
                'permissions' => $manage,
            ];
        }

        return [
            'view' => 'roles.view',
            'create' => 'roles.create',
            'update' => 'roles.update',
            'delete' => 'roles.delete',
            'permissions' => 'roles.permissions',
        ];
    }

    private function authorize(Request $request, string $scope, string $action): void
    {
        $ability = $this->abilities($scope)[$action];

        abort_unless((bool) $request->user()?->can($ability), 403);
    }

    public function index(Request $request): Response
    {
        $scope = $this->scope();
        $this->authorize($request, $scope, 'view');

        $core = PermissionCatalog::coreRoles($scope);
        $protected = PermissionCatalog::protectedRoles($scope);
        $abilities = $this->abilities($scope);
        $user = $request->user();

        $roles = Role::query()
            ->where('guard_name', self::GUARD)
            ->withCount('permissions')
            ->with('permissions:id,name')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role): array => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions_count' => $role->permissions_count,
                'permissions' => $role->permissions->pluck('name')->all(),
                'is_core' => in_array($role->name, $core, true),
                'is_protected' => in_array($role->name, $protected, true),
                'created_at' => $role->created_at?->toISOString(),
            ])
            ->all();

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'scope' => $scope,
            'permissionsTotal' => Permission::query()
                ->where('guard_name', self::GUARD)
                ->count(),
            'permissionCatalog' => PermissionCatalog::groups($scope),
            'can' => [
                'create' => (bool) $user?->can($abilities['create']),
                'update' => (bool) $user?->can($abilities['update']),
                'delete' => (bool) $user?->can($abilities['delete']),
                'permissions' => (bool) $user?->can($abilities['permissions']),
            ],
        ]);
    }

    public function store(RoleRequest $request): RedirectResponse
    {
        Role::create([
            'name' => $request->validated('name'),
            'guard_name' => self::GUARD,
        ]);

        return back()->with('success', __('messages.roles.created'));
    }

    public function update(RoleRequest $request, Role $role): RedirectResponse
    {
        $this->assertNotProtectedRole($role, __('messages.roles.protected_not_editable'));

        $role->update(['name' => $request->validated('name')]);

        return back()->with('success', __('messages.roles.updated'));
    }

    public function destroy(Request $request, Role $role): RedirectResponse
    {
        $this->authorize($request, $this->scope(), 'delete');

        $this->assertNotProtectedRole($role, __('messages.roles.protected_not_deletable'));

        $role->delete();

        return back()->with('success', __('messages.roles.deleted'));
    }

    /**
     * Guarda los permisos (del catálogo del scope) asignados a un rol.
     */
    public function permissions(Request $request, Role $role): RedirectResponse
    {
        $scope = $this->scope();
        $this->authorize($request, $scope, 'permissions');

        $this->assertNotCoreRole($role, __('messages.roles.core_permissions_locked'));

        $catalog = PermissionCatalog::names($scope);

        $data = $request->validate([
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', Rule::in($catalog)],
        ]);

        $selected = $data['permissions'] ?? [];

        // Conserva cualquier permiso fuera del catálogo (p. ej. de negocio).
        $current = $role->permissions->pluck('name')->all();
        $keep = array_diff($current, $catalog);

        $role->syncPermissions(array_values(array_unique([...$keep, ...$selected])));

        return back()->with('success', __('messages.roles.permissions_saved'));
    }

    /**
     * Los roles protegidos del scope no se eliminan ni renombran.
     */
    private function assertNotProtectedRole(Role $role, string $message): void
    {
        abort_if(
            in_array($role->name, PermissionCatalog::protectedRoles($this->scope()), true),
            403,
            $message,
        );
    }

    /**
     * Los roles núcleo del scope (owner/superadmin) no cambian permisos.
     */
    private function assertNotCoreRole(Role $role, string $message): void
    {
        abort_if(
            in_array($role->name, PermissionCatalog::coreRoles($this->scope()), true),
            403,
            $message,
        );
    }
}
