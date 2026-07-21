import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    ChefHat,
    ClipboardList,
    CreditCard,
    LayoutGrid,
    Layers,
    ListChecks,
    Receipt,
    ScrollText,
    ShieldCheck,
    Store,
    Tags,
    TicketPercent,
    MapPin,
    FileStack,
    UserCog,
    Users,
    Utensils,
    CalendarClock,
} from 'lucide-react';
import { useMemo } from 'react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslations } from '@/hooks/use-translations';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

type NavTemplateItem = Omit<NavItem, 'title' | 'items'> & {
    titleKey: string;
    showInTenant?: boolean;
    tenantPermissions?: string[];
    items?: Array<
        Omit<NavItem, 'title' | 'items'> & {
            titleKey: string;
            showInTenant?: boolean;
            tenantPermissions?: string[];
        }
    >;
};

const mainNavTemplate: NavTemplateItem[] = [
    {
        titleKey: 'nav.dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        permission: 'dashboard.view',
        showInTenant: true,
    },
    {
        titleKey: 'nav.mesas',
        href: '/mesas',
        icon: Utensils,
        tenantPermission: 'tenant.tables.manage',
    },
    {
        titleKey: 'nav.carta',
        href: '/carta',
        icon: BookOpen,
        tenantPermission: 'tenant.menu.manage',
    },
    {
        titleKey: 'nav.pedidos',
        href: '/pedidos',
        icon: ClipboardList,
        tenantPermission: 'tenant.orders.take',
    },
    {
        titleKey: 'nav.cocina',
        href: '/cocina',
        icon: ChefHat,
        tenantPermission: 'tenant.kitchen.manage',
    },
    {
        titleKey: 'nav.caja',
        href: '/caja',
        icon: Receipt,
        tenantPermission: 'tenant.sales.manage',
    },
    {
        titleKey: 'nav.ventas',
        href: '/ventas',
        icon: ScrollText,
        tenantPermission: 'tenant.sales.manage',
    },
    {
        titleKey: 'nav.facturacion',
        href: '#',
        icon: FileStack,
        tenantPermission: 'tenant.invoicing.manage',
        items: [
            {
                titleKey: 'nav.fel_documents',
                href: '/facturacion/documentos',
                icon: FileStack,
                tenantPermission: 'tenant.invoicing.manage',
            },
            {
                titleKey: 'nav.fel_series',
                href: '/facturacion/series',
                icon: Tags,
                tenantPermission: 'tenant.invoicing.manage',
            },
        ],
    },
    {
        titleKey: 'nav.reportes',
        href: '/reportes',
        icon: BarChart3,
        tenantPermission: 'tenant.reports.view',
    },
    {
        titleKey: 'nav.negocio',
        href: '/configuracion',
        icon: Store,
        tenantPermissions: ['tenant.settings.manage', 'tenant.publication.manage'],
    },
    {
        titleKey: 'nav.reservas',
        href: '/reservas',
        icon: CalendarClock,
        tenantPermission: 'tenant.reservations.manage',
    },
    {
        titleKey: 'nav.users',
        href: '#',
        icon: Users,
        items: [
            {
                titleKey: 'nav.users',
                href: '/usuarios',
                icon: UserCog,
                permission: 'users.view',
                tenantPermission: 'tenant.users.manage',
            },
            {
                titleKey: 'nav.roles',
                href: '/roles',
                icon: ShieldCheck,
                permission: 'roles.view',
                tenantPermission: 'tenant.users.manage',
            },
        ],
    },
    {
        titleKey: 'nav.saas',
        href: '#',
        icon: CreditCard,
        items: [
            {
                titleKey: 'nav.tenants',
                href: '/restaurantes',
                icon: Store,
                permission: 'tenants.view',
            },
            {
                titleKey: 'nav.plans',
                href: '/planes',
                icon: Layers,
                permission: 'plans.view',
            },
            {
                titleKey: 'nav.plan_features',
                href: '/plan-features',
                icon: ListChecks,
                permission: 'plan_features.view',
            },
            {
                titleKey: 'nav.subscriptions',
                href: '/subscriptions',
                icon: CreditCard,
                permission: 'subscriptions.view',
            },
            {
                titleKey: 'nav.subscription_payments',
                href: '/subscription-payments',
                icon: Receipt,
                permission: 'subscription_payments.view',
            },
            {
                titleKey: 'nav.promo_codes',
                href: '/promo-codes',
                icon: TicketPercent,
                permission: 'promo_codes.view',
            },
            {
                titleKey: 'nav.catalog',
                href: '/catalogo',
                icon: Tags,
                permission: 'catalog.view',
            },
            {
                titleKey: 'nav.tour_spots',
                href: '/centros-turisticos',
                icon: MapPin,
                permission: 'tour_spots.view',
            },
        ],
    },
];

/**
 * Filtra el menú según ámbito:
 * - Plataforma: ítems con `permission` (nunca los solo-tenant).
 * - Restaurante: ítems con `tenantPermission` o `showInTenant`.
 * - SaaS y demás módulos de plataforma no tienen `tenantPermission` → ocultos.
 */
function filterNav(
    items: NavItem[],
    can: (permission?: string | null) => boolean,
    isTenant: boolean,
): NavItem[] {
    return items.reduce<NavItem[]>((acc, item) => {
        if (item.items && item.items.length > 0) {
            const children = filterNav(item.items, can, isTenant);
            if (children.length > 0) {
                acc.push({ ...item, items: children });
            }
            return acc;
        }

        if (isTenant) {
            if (item.showInTenant) {
                acc.push(item);
                return acc;
            }
            if (item.tenantPermissions?.some((perm) => can(perm))) {
                acc.push(item);
                return acc;
            }
            if (item.tenantPermission && can(item.tenantPermission)) {
                acc.push(item);
            }
            return acc;
        }

        if (!item.permission) {
            return acc;
        }

        if (can(item.permission)) {
            acc.push(item);
        }
        return acc;
    }, []);
}

export function AppSidebar() {
    const { can } = usePermissions();
    const { t } = useTranslations();
    const isTenant = usePage().props.tenant !== null;

    const mainNavItems = useMemo<NavItem[]>(
        () =>
            mainNavTemplate.map((item) => ({
                title: t(item.titleKey),
                href: item.href,
                icon: item.icon,
                permission: item.permission,
                tenantPermission: item.tenantPermission,
                tenantPermissions: item.tenantPermissions,
                showInTenant: item.showInTenant,
                items: item.items?.map((sub) => ({
                    title: t(sub.titleKey),
                    href: sub.href,
                    icon: sub.icon,
                    permission: sub.permission,
                    tenantPermission: sub.tenantPermission,
                    tenantPermissions: sub.tenantPermissions,
                    showInTenant: sub.showInTenant,
                })),
            })),
        [t],
    );

    // Mismo filtrado por permisos en ambos ámbitos; en el restaurante se usan
    // los permisos del tenant (tenantPermission) del usuario autenticado.
    const navItems = filterNav(mainNavItems, can, isTenant);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="border-b border-sidebar-border/50 pb-2">
                <Link
                    href={dashboard()}
                    prefetch
                    className="flex items-center gap-1 px-1.5 py-1 transition-opacity hover:opacity-80 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                >
                    <AppLogo />
                </Link>
            </SidebarHeader>

            <SidebarContent className="pt-1">
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
