import { Head, Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    CalendarDays,
    ChefHat,
    Clock,
    LayoutGrid,
    Receipt,
    ScrollText,
    Settings,
    TrendingUp,
    UtensilsCrossed,
    Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import {
    CartaBarChart,
    PaymentMethodsChart,
    RESERVATION_STATUS_COLORS,
    ReservationsWeekChart,
    SalesWeekChart,
    StatusDonutChart,
    TABLE_STATUS_COLORS,
} from '@/components/dashboard/dashboard-charts';
import { ProfileChecklist } from '@/components/dashboard/profile-checklist';
import { QuickLinks } from '@/components/dashboard/quick-links';
import { StatCard } from '@/components/dashboard/stat-card';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/hooks/use-translations';
import { formatCajaMoney } from '@/lib/caja-format';
import { translate, type TranslationTree } from '@/lib/i18n';
import { dashboard } from '@/routes';
import type { SharedData } from '@/types';
import type { TenantDashboardProps } from '@/types/dashboard';

export default function TenantDashboard({
    kpis,
    charts,
    profile,
    upcoming_today,
    settings,
    currency,
}: TenantDashboardProps) {
    const { t } = useTranslations();
    const { auth, tenant } = usePage<SharedData>().props;
    const userName = auth.user?.name?.split(' ')[0] ?? '';

    const statusLabel = (status: string) =>
        t(`reservas.status_${status}` as 'reservas.status_pending');

    const tableStatusLabel = (status: string) =>
        t(`mesas.status_${status}` as 'mesas.status_free');

    const checklistLabel = (key: string) =>
        t(`dashboard.checklist_${key}` as 'dashboard.checklist_tables');

    const methodLabel = (method: string) =>
        t(`caja.method_${method}` as 'caja.method_efectivo');

    const money = (amount: number) => formatCajaMoney(amount, currency);

    return (
        <>
            <Head title={t('nav.dashboard')} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title={t('dashboard.greeting', { name: userName })}
                    description={t('dashboard.tenant_subtitle')}
                    badges={[
                        {
                            label: tenant?.name ?? t('nav.negocio'),
                            color: 'blue',
                        },
                        ...(settings.reservations_enabled
                            ? [
                                  {
                                      label: t('dashboard.badge_reservations_on'),
                                      color: 'green' as const,
                                      icon: CalendarDays,
                                  },
                              ]
                            : []),
                        {
                            label: t('dashboard.kpi_cash_session'),
                            value: kpis.cash_session_open
                                ? t('dashboard.kpi_cash_session_open')
                                : t('dashboard.kpi_cash_session_closed'),
                            color: kpis.cash_session_open ? 'green' : 'gray',
                            icon: Wallet,
                        },
                    ]}
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title={t('dashboard.kpi_sales_today')}
                        value={kpis.sales_today}
                        hint={t('dashboard.kpi_sales_today_hint')}
                        icon={ScrollText}
                        accent="teal"
                    />
                    <StatCard
                        title={t('dashboard.kpi_revenue_today')}
                        value={money(kpis.revenue_today)}
                        hint={t('dashboard.kpi_revenue_today_hint')}
                        icon={TrendingUp}
                        accent="green"
                    />
                    <StatCard
                        title={t('dashboard.kpi_orders_to_pay')}
                        value={kpis.orders_to_pay}
                        hint={t('dashboard.kpi_orders_to_pay_hint')}
                        icon={Receipt}
                        accent="orange"
                    />
                    <StatCard
                        title={t('dashboard.kpi_reservations_today')}
                        value={kpis.reservations_today}
                        hint={t('dashboard.kpi_reservations_today_hint')}
                        icon={CalendarDays}
                        accent="blue"
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <SalesWeekChart
                        data={charts.sales_by_day}
                        title={t('dashboard.chart_sales_week')}
                        description={t('dashboard.chart_sales_week_hint')}
                        amountLabel={t('dashboard.kpi_revenue_today')}
                    />
                    <PaymentMethodsChart
                        data={charts.sales_by_payment_method}
                        title={t('dashboard.chart_payment_methods')}
                        description={t('dashboard.chart_payment_methods_hint')}
                        labelForMethod={methodLabel}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title={t('dashboard.kpi_pending_approval')}
                        value={kpis.pending_approval}
                        hint={t('dashboard.kpi_pending_approval_hint')}
                        icon={Clock}
                        accent="amber"
                    />
                    <StatCard
                        title={t('dashboard.kpi_dishes')}
                        value={kpis.dishes}
                        hint={t('dashboard.kpi_dishes_hint', {
                            count: charts.carta.categories,
                        })}
                        icon={UtensilsCrossed}
                        accent="green"
                    />
                    <StatCard
                        title={t('dashboard.kpi_tables_occupied')}
                        value={`${kpis.tables_occupied}/${kpis.tables_total}`}
                        hint={t('dashboard.kpi_tables_occupied_hint')}
                        icon={LayoutGrid}
                        accent="orange"
                    />
                    <StatCard
                        title={t('reportes.kpi_avg_ticket')}
                        value={money(kpis.average_ticket_today)}
                        hint={t('reportes.kpi_avg_ticket_hint')}
                        icon={BarChart3}
                        accent="purple"
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <ReservationsWeekChart
                        data={charts.reservations_by_day}
                        title={t('dashboard.chart_reservations_week')}
                        description={t('dashboard.chart_reservations_week_hint')}
                    />
                    <StatusDonutChart
                        data={charts.reservations_by_status}
                        title={t('dashboard.chart_status_title')}
                        description={t('dashboard.chart_status_hint')}
                        colorMap={RESERVATION_STATUS_COLORS}
                        labelForStatus={statusLabel}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <StatusDonutChart
                        data={charts.tables_by_status}
                        title={t('dashboard.chart_tables_title')}
                        description={t('dashboard.chart_tables_hint')}
                        colorMap={TABLE_STATUS_COLORS}
                        labelForStatus={tableStatusLabel}
                    />
                    <CartaBarChart
                        stats={charts.carta}
                        title={t('dashboard.chart_carta_title')}
                        description={t('dashboard.chart_carta_hint')}
                        labels={{
                            available: t('dashboard.carta_available'),
                            with_image: t('dashboard.carta_with_image'),
                            published: t('dashboard.carta_published'),
                            without_image: t('dashboard.carta_without_image'),
                            unpublished: t('dashboard.carta_unpublished'),
                        }}
                    />
                    <ProfileChecklist
                        percent={profile.percent}
                        items={profile.checklist}
                        title={t('dashboard.profile_title')}
                        subtitle={t('dashboard.profile_subtitle')}
                        labelForKey={checklistLabel}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <QuickLinks
                        title={t('dashboard.quick_title')}
                        links={[
                            {
                                href: '/caja',
                                label: t('dashboard.quick_caja'),
                                icon: Receipt,
                                color: 'bg-[#ecfeff] text-[#0e7490] dark:bg-cyan-500/15 dark:text-cyan-300',
                            },
                            {
                                href: '/ventas',
                                label: t('dashboard.quick_ventas'),
                                icon: ScrollText,
                                color: 'bg-[#ecfdf5] text-[#047857] dark:bg-emerald-500/20 dark:text-emerald-300',
                            },
                            {
                                href: '/reportes',
                                label: t('dashboard.quick_reportes'),
                                icon: BarChart3,
                                color: 'bg-[#eef3fc] text-[#0744a9] dark:bg-brand-blue/20 dark:text-brand-blue-light',
                            },
                            {
                                href: '/reservas',
                                label: t('dashboard.quick_reservas'),
                                icon: CalendarDays,
                                color: 'bg-[#eef3fc] text-[#0744a9] dark:bg-brand-blue/20 dark:text-brand-blue-light',
                            },
                            {
                                href: '/carta',
                                label: t('dashboard.quick_carta'),
                                icon: ChefHat,
                                color: 'bg-[#ecfdf5] text-[#047857] dark:bg-emerald-500/20 dark:text-emerald-300',
                            },
                            {
                                href: '/configuracion',
                                label: t('dashboard.quick_config'),
                                icon: Settings,
                                color: 'bg-[#f3f0ff] text-[#6d28d9] dark:bg-violet-500/20 dark:text-violet-300',
                            },
                        ]}
                    />

                    <section className="rounded-xl border bg-card shadow-sm">
                        <div className="border-b border-border/60 px-5 py-4">
                            <h2 className="text-base font-semibold">
                                {t('dashboard.upcoming_title')}
                            </h2>
                        </div>
                        <div className="divide-y divide-border/60">
                            {upcoming_today.length === 0 ? (
                                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                                    {t('dashboard.upcoming_empty')}
                                </p>
                            ) : (
                                upcoming_today.map((reservation) => (
                                    <div
                                        key={reservation.id}
                                        className="flex items-center justify-between gap-3 px-5 py-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">
                                                {reservation.customer_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {reservation.time} ·{' '}
                                                {t('dashboard.party_size', {
                                                    count: reservation.party_size,
                                                })}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">
                                            {statusLabel(reservation.status)}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                        {upcoming_today.length > 0 ? (
                            <div className="border-t border-border/60 px-5 py-3">
                                <Link
                                    href="/reservas"
                                    className="text-sm font-medium text-brand-blue hover:underline dark:text-brand-blue-light"
                                >
                                    {t('dashboard.view_all_reservations')}
                                </Link>
                            </div>
                        ) : null}
                    </section>
                </div>
            </div>
        </>
    );
}

TenantDashboard.layout = (props) => ({
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
