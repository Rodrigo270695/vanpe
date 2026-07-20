import { Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Building2,
    CreditCard,
    LayoutGrid,
    Users,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import {
    StatusDonutChart,
    TENANT_STATUS_COLORS,
    TenantsMonthChart,
} from '@/components/dashboard/dashboard-charts';
import { QuickLinks } from '@/components/dashboard/quick-links';
import { StatCard } from '@/components/dashboard/stat-card';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/hooks/use-translations';
import { translate, type TranslationTree } from '@/lib/i18n';
import { dashboard } from '@/routes';
import type { SharedData } from '@/types';
import type { PlatformDashboardProps } from '@/types/dashboard';

function formatMoney(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        maximumFractionDigits: 0,
    }).format(amount);
}

export default function PlatformDashboard({
    kpis,
    charts,
    pending_proposals,
}: PlatformDashboardProps) {
    const { t } = useTranslations();
    const { auth } = usePage<SharedData>().props;
    const userName = auth.user?.name?.split(' ')[0] ?? '';

    const tenantStatusLabel = (status: string) =>
        t(`dashboard.tenant_status_${status}` as 'dashboard.tenant_status_active');

    const catalogTypeLabel = (type: string) =>
        t(`catalog.type_${type}` as 'catalog.type_cuisine');

    const revenueHint =
        kpis.revenue_delta_percent === null
            ? t('dashboard.kpi_revenue_hint')
            : t('dashboard.vs_last_month') +
              ` ${kpis.revenue_delta_percent > 0 ? '+' : ''}${kpis.revenue_delta_percent}%`;

    return (
        <>
            <Head title={t('nav.dashboard')} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title={t('dashboard.greeting', { name: userName })}
                    description={t('dashboard.subtitle')}
                    badges={[
                        {
                            label: t('dashboard.kpi_restaurants'),
                            value: kpis.restaurants_active,
                            color: 'green',
                            icon: Building2,
                        },
                        {
                            label: t('dashboard.kpi_proposals_pending'),
                            value: kpis.pending_proposals,
                            color: 'amber',
                        },
                    ]}
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title={t('dashboard.kpi_restaurants')}
                        value={kpis.restaurants_active}
                        hint={t('dashboard.kpi_restaurants_hint')}
                        icon={Building2}
                        accent="green"
                    />
                    <StatCard
                        title={t('dashboard.kpi_trials')}
                        value={kpis.restaurants_trial}
                        hint={t('dashboard.kpi_trials_hint')}
                        icon={Users}
                        accent="amber"
                    />
                    <StatCard
                        title={t('dashboard.kpi_catalog')}
                        value={kpis.catalog_items}
                        hint={t('dashboard.kpi_catalog_hint')}
                        icon={BookOpen}
                        accent="purple"
                    />
                    <StatCard
                        title={t('dashboard.kpi_revenue')}
                        value={formatMoney(kpis.revenue_month)}
                        hint={revenueHint}
                        icon={CreditCard}
                        accent="blue"
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <TenantsMonthChart
                        data={charts.tenants_by_month}
                        title={t('dashboard.activity_title')}
                        description={t('dashboard.activity_subtitle')}
                        seriesLabel={t('dashboard.restaurants')}
                    />
                    <StatusDonutChart
                        data={charts.tenants_by_status}
                        title={t('dashboard.chart_tenants_status')}
                        description={t('dashboard.chart_tenants_status_hint')}
                        colorMap={TENANT_STATUS_COLORS}
                        labelForStatus={tenantStatusLabel}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-xl border bg-card shadow-sm">
                        <div className="border-b border-border/60 px-5 py-4">
                            <h2 className="text-base font-semibold">
                                {t('dashboard.pending_title')}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.pending_catalog_subtitle')}
                            </p>
                        </div>
                        <div className="divide-y divide-border/60">
                            {pending_proposals.length === 0 ? (
                                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                                    {t('dashboard.pending_empty')}
                                </p>
                            ) : (
                                pending_proposals.map((proposal) => (
                                    <div
                                        key={proposal.id}
                                        className="flex items-center justify-between gap-3 px-5 py-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">
                                                {proposal.suggested_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {proposal.tenant_name} ·{' '}
                                                {catalogTypeLabel(proposal.type)}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">
                                            {t('dashboard.status_pending')}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                        {pending_proposals.length > 0 ? (
                            <div className="border-t border-border/60 px-5 py-3">
                                <Link
                                    href="/catalogo"
                                    className="text-sm font-medium text-brand-blue hover:underline dark:text-brand-blue-light"
                                >
                                    {t('dashboard.view_all')}
                                </Link>
                            </div>
                        ) : null}
                    </section>

                    <QuickLinks
                        title={t('dashboard.quick_title')}
                        links={[
                            {
                                href: '/restaurantes',
                                label: t('dashboard.quick_tenants'),
                                icon: Building2,
                                color: 'bg-[#eef3fc] text-[#0744a9] dark:bg-brand-blue/20 dark:text-brand-blue-light',
                            },
                            {
                                href: '/catalogo',
                                label: t('nav.catalog'),
                                icon: BookOpen,
                                color: 'bg-[#f3f0ff] text-[#6d28d9] dark:bg-violet-500/20 dark:text-violet-300',
                            },
                            {
                                href: '/planes',
                                label: t('dashboard.quick_plans'),
                                icon: CreditCard,
                                color: 'bg-[#ecfdf5] text-[#047857] dark:bg-emerald-500/20 dark:text-emerald-300',
                            },
                            {
                                href: '/usuarios',
                                label: t('dashboard.quick_users'),
                                icon: LayoutGrid,
                                color: 'bg-[#fff4e8] text-[#c45f00] dark:bg-brand-orange/20 dark:text-brand-orange-light',
                            },
                        ]}
                    />
                </div>
            </div>
        </>
    );
}

PlatformDashboard.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(
                props.translations as TranslationTree,
                'nav.dashboard',
            ),
            href: dashboard(),
        },
    ],
});
