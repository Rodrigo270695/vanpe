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
    PartyPopper,
    FileStack,
    Sparkles,
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
    /** Si se define, solo visible para ese tipo de tenant. */
    tenantTipos?: Array<'restaurant' | 'tour_spot'>;
    tenantPermissions?: string[];
    items?: Array<
        Omit<NavItem, 'title' | 'items'> & {
            titleKey: string;
            showInTenant?: boolean;
            tenantTipos?: Array<'restaurant' | 'tour_spot'>;
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
        tenantTipos: ['restaurant'],
    },
    {
        titleKey: 'nav.carta',
        href: '/carta',
        icon: BookOpen,
        tenantPermission: 'tenant.menu.manage',
        tenantTipos: ['restaurant'],
    },
    {
        titleKey: 'nav.pedidos',
        href: '/pedidos',
        icon: ClipboardList,
        tenantPermission: 'tenant.orders.take',
        tenantTipos: ['restaurant'],
    },
    {
        titleKey: 'nav.cocina',
        href: '/cocina',
        icon: ChefHat,
        tenantPermission: 'tenant.kitchen.manage',
        tenantTipos: ['restaurant'],
    },
    {
        titleKey: 'nav.caja',
        href: '/caja',
        icon: Receipt,
        tenantPermission: 'tenant.sales.manage',
        tenantTipos: ['restaurant'],
    },
    {
        titleKey: 'nav.ventas',
        href: '/ventas',
        icon: ScrollText,
        tenantPermission: 'tenant.sales.manage',
        tenantTipos: ['restaurant'],
    },
    {
        titleKey: 'nav.facturacion',
        href: '#',
        icon: FileStack,
        tenantPermission: 'tenant.invoicing.manage',
        tenantTipos: ['restaurant'],
        items: [
            {
                titleKey: 'nav.fel_documents',
                href: '/facturacion/documentos',
                icon: FileStack,
                tenantPermission: 'tenant.invoicing.manage',
                tenantTipos: ['restaurant'],
            },
            {
                titleKey: 'nav.fel_series',
                href: '/facturacion/series',
                icon: Tags,
                tenantPermission: 'tenant.invoicing.manage',
                tenantTipos: ['restaurant'],
            },
        ],
    },
    {
        titleKey: 'nav.reportes',
        href: '/reportes',
        icon: BarChart3,
        tenantPermission: 'tenant.reports.view',
        tenantTipos: ['restaurant'],
    },
    {
        titleKey: 'nav.negocio',
        href: '/configuracion',
        icon: Store,
        tenantTipos: ['restaurant'],
        tenantPermissions: [
            'tenant.settings.manage',
            'tenant.publication.manage',
        ],
    },
    {
        titleKey: 'nav.mi_centro',
        href: '/mi-centro',
        icon: MapPin,
        tenantTipos: ['tour_spot'],
        tenantPermissions: [
            'tenant.tour_spot.manage',
            'tenant.tour_spot.publish',
        ],
    },
    {
        titleKey: 'nav.reservas',
        href: '/reservas',
        icon: CalendarClock,
        tenantPermission: 'tenant.reservations.manage',
        tenantTipos: ['restaurant'],
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
            {
                titleKey: 'nav.events',
                href: '/festividades',
                icon: PartyPopper,
                permission: 'events.view',
            },
            {
                titleKey: 'nav.extraordinary_events',
                href: '/eventos-extraordinarios',
                icon: Sparkles,
                permission: 'events.view',
            },
        ],
    },
];

/**
 * Filtra el menú según ámbito:
 * - Plataforma: ítems con `permission` (nunca los solo-tenant).
 * - Tenant: ítems con `tenantPermission`/`showInTenant`, filtrados por `tenantTipos`.
 */
function filterNav(
    items: NavItem[],
    can: (permission?: string | null) => boolean,
    isTenant: boolean,
    tenantTipo: 'restaurant' | 'tour_spot' | null = null,
): NavItem[] {
    return items.reduce<NavItem[]>((acc, item) => {
        if (
            isTenant &&
            item.tenantTipos &&
            tenantTipo &&
            !item.tenantTipos.includes(tenantTipo)
        ) {
            return acc;
        }

        if (item.items && item.items.length > 0) {
            const children = filterNav(item.items, can, isTenant, tenantTipo);

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
    const page = usePage();
    const tenant = page.props.tenant;
    const isTenant = tenant !== null;
    const tenantTipo =
        (tenant?.tipo as 'restaurant' | 'tour_spot' | undefined) ??
        (isTenant ? 'restaurant' : null);

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
                tenantTipos: item.tenantTipos,
                items: item.items?.map((sub) => ({
                    title: t(sub.titleKey),
                    href: sub.href,
                    icon: sub.icon,
                    permission: sub.permission,
                    tenantPermission: sub.tenantPermission,
                    tenantPermissions: sub.tenantPermissions,
                    showInTenant: sub.showInTenant,
                    tenantTipos: sub.tenantTipos,
                })),
            })),
        [t],
    );

    const navItems = filterNav(mainNavItems, can, isTenant, tenantTipo);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="border-b border-sidebar-border/50 pb-2">
                <Link
                    href={dashboard()}
                    prefetch
                    className="flex items-center gap-1 px-1.5 py-1 transition-opacity group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 hover:opacity-80"
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
