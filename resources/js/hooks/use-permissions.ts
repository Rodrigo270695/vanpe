import { usePage } from '@inertiajs/react';
import type { Auth } from '@/types/auth';

/**
 * Permisos del usuario autenticado (compartidos por Inertia).
 *
 * - `can(permiso)`  → true si no se pasa permiso, si es superadmin, o si lo tiene.
 * - `canAny([...])` → true si tiene al menos uno.
 * - `canAll([...])` → true si los tiene todos.
 */
export function usePermissions() {
    const auth = usePage().props.auth as Auth | undefined;
    const roles = auth?.roles ?? [];
    const permissions = auth?.permissions ?? [];
    const isSuperadmin = roles.includes('superadmin');

    const can = (permission?: string | null): boolean =>
        !permission || isSuperadmin || permissions.includes(permission);

    const canAny = (list: string[]): boolean =>
        isSuperadmin || list.some((p) => permissions.includes(p));

    const canAll = (list: string[]): boolean =>
        isSuperadmin || list.every((p) => permissions.includes(p));

    return { can, canAny, canAll, isSuperadmin, roles, permissions };
}
