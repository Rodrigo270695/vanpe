import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    items?: NavItem[];
    /** Permiso de plataforma (dominio central / superadmin). */
    permission?: string;
    /** Permiso del restaurante (subdominio del tenant). */
    tenantPermission?: string;
    /** Cualquiera de estos permisos tenant habilita el ítem. */
    tenantPermissions?: string[];
    /** Visible en subdominio del restaurante sin permiso tenant explícito (ej. Panel). */
    showInTenant?: boolean;
};
