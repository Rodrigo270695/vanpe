import { Head, router } from '@inertiajs/react';
import {
    BarChart3,
    Download,
    Eye,
    Receipt,
    ScrollText,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useMemo } from 'react';
import type { SaleListRow, SalesPaginator } from '@/components/ventas/types';
import {
    PaymentMethodsChart,
    SalesWeekChart,
} from '@/components/dashboard/dashboard-charts';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { DateRangeFilter } from '@/components/common/date-range-filter';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { SearchInput } from '@/components/common/search-input';
import { StatCard } from '@/components/dashboard/stat-card';
import { TableCard } from '@/components/common/table-card';
import { TableRowActions } from '@/components/common/table-row-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientTable } from '@/hooks/use-client-table';
import { useTranslations } from '@/hooks/use-translations';
import { formatCajaDate, formatCajaMoney, formatCajaTime } from '@/lib/caja-format';
import type { DateRange } from '@/lib/date-range';
import type {
    DashboardPaymentMethodPoint,
    DashboardSalesDayPoint,
} from '@/types/dashboard';
import { downloadXlsx } from '@/lib/export-xlsx';
import { translate, type TranslationTree } from '@/lib/i18n';

type ReportSummary = {
    sales_count: number;
    total_revenue: number;
    average_ticket: number;
    voided_count: number;
    voided_total: number;
};

type CashierRow = {
    cajero: { id: number; name: string } | null;
    sales_count: number;
    total: number;
};

type ReportesFilters = {
    date_from: string;
    date_to: string;
};

type ReportesIndexProps = {
    report: {
        summary: ReportSummary;
        by_payment_method: DashboardPaymentMethodPoint[];
        by_day: DashboardSalesDayPoint[];
        by_cashier: CashierRow[];
    };
    sales: SalesPaginator;
    filters: ReportesFilters;
    currency: string;
};

export default function ReportesIndex({
    report,
    sales,
    filters,
    currency,
}: ReportesIndexProps) {
    const { t, locale, timezone } = useTranslations();

    const rows = sales.data;
    const page = sales.meta?.current_page ?? sales.current_page ?? 1;
    const perPage = sales.meta?.per_page ?? sales.per_page ?? 20;
    const total = sales.meta?.total ?? sales.total ?? 0;

    const dateRange: DateRange = {
        from: filters.date_from,
        to: filters.date_to,
    };

    const applyFilters = (next: Partial<ReportesFilters>) => {
        router.get(
            '/reportes',
            {
                date_from: next.date_from ?? filters.date_from,
                date_to: next.date_to ?? filters.date_to,
                page: 1,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const table = useClientTable(rows, {
        searchable: (row) =>
            [row.numero, row.order_number, row.cajero?.name, row.metodo]
                .filter((value) => value != null && value !== '')
                .join(' '),
        initialSort: { key: 'created_at', dir: 'desc' },
    });

    const goToPage = (nextPage: number) => {
        router.get(
            '/reportes',
            {
                date_from: filters.date_from,
                date_to: filters.date_to,
                page: nextPage,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const methodLabel = (method: string) =>
        t(`caja.method_${method}` as 'caja.method_efectivo');

    const money = (amount: number) => formatCajaMoney(amount, currency);

    const exportExcel = async () => {
        const exportRows = table.search.trim()
            ? table.pageItems
            : rows;

        await downloadXlsx(
            'reporte-ventas-vanpe.xlsx',
            'Ventas',
            exportRows,
            [
                {
                    header: t('ventas.col_number'),
                    width: 14,
                    value: (row) => row.numero,
                },
                {
                    header: t('ventas.col_date'),
                    width: 18,
                    value: (row) =>
                        `${formatCajaDate(row.created_at, locale, timezone)} ${formatCajaTime(row.created_at, locale, timezone)}`,
                },
                {
                    header: t('ventas.col_order'),
                    width: 12,
                    value: (row) => row.order_number ?? '—',
                },
                {
                    header: t('ventas.col_method'),
                    width: 14,
                    value: (row) => (row.metodo ? methodLabel(row.metodo) : '—'),
                },
                {
                    header: t('ventas.col_cashier'),
                    width: 18,
                    value: (row) => row.cajero?.name ?? '—',
                },
                {
                    header: t('ventas.col_total'),
                    width: 12,
                    value: (row) => row.total,
                },
            ],
            {
                title: t('reportes.title'),
                subtitle: `${filters.date_from} — ${filters.date_to}`,
            },
        );
    };

    const columns: DataTableColumn<SaleListRow>[] = useMemo(
        () => [
            {
                key: 'numero',
                header: t('ventas.col_number'),
                sortable: true,
                render: (row) => (
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-sm">
                            <Receipt className="size-4" />
                        </span>
                        <span className="font-medium">{row.numero}</span>
                    </div>
                ),
            },
            {
                key: 'created_at',
                header: t('ventas.col_date'),
                sortable: true,
                render: (row) => (
                    <div>
                        <div className="font-medium">
                            {formatCajaDate(row.created_at, locale, timezone)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {formatCajaTime(row.created_at, locale, timezone)}
                        </div>
                    </div>
                ),
            },
            {
                key: 'metodo',
                header: t('ventas.col_method'),
                render: (row) => (
                    <span className="text-muted-foreground">
                        {row.metodo ? methodLabel(row.metodo) : '—'}
                    </span>
                ),
            },
            {
                key: 'cajero',
                header: t('ventas.col_cashier'),
                render: (row) => (
                    <span className="text-muted-foreground">
                        {row.cajero?.name ?? '—'}
                    </span>
                ),
            },
            {
                key: 'total',
                header: t('ventas.col_total'),
                sortable: true,
                align: 'right',
                render: (row) => (
                    <span className="font-semibold">{money(row.total)}</span>
                ),
            },
        ],
        [t, locale, timezone, currency],
    );

    const actions = (row: SaleListRow) => (
        <TableRowActions
            items={[
                {
                    key: 'ticket',
                    label: t('ventas.action_view_ticket'),
                    icon: Eye,
                    onClick: () => router.visit(`/ventas/${row.id}`),
                },
            ]}
        />
    );

    return (
        <>
            <Head title={t('reportes.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('reportes.title')}
                    description={t('reportes.description')}
                    badges={[
                        {
                            label: t('reportes.badge_revenue'),
                            value: money(report.summary.total_revenue),
                            color: 'teal',
                            icon: TrendingUp,
                        },
                        {
                            label: t('reportes.badge_sales'),
                            value: report.summary.sales_count,
                            color: 'green',
                            icon: ScrollText,
                        },
                    ]}
                >
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => void exportExcel()}
                    >
                        <Download className="size-4" />
                        {t('reportes.export_excel')}
                    </Button>
                </PageHeader>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <DateRangeFilter
                        value={dateRange}
                        onChange={(range) =>
                            applyFilters({
                                date_from: range.from,
                                date_to: range.to,
                            })
                        }
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title={t('reportes.kpi_revenue')}
                        value={money(report.summary.total_revenue)}
                        hint={t('reportes.kpi_revenue_hint')}
                        icon={TrendingUp}
                        accent="teal"
                    />
                    <StatCard
                        title={t('reportes.kpi_sales')}
                        value={report.summary.sales_count}
                        hint={t('reportes.kpi_sales_hint')}
                        icon={ScrollText}
                        accent="green"
                    />
                    <StatCard
                        title={t('reportes.kpi_avg_ticket')}
                        value={money(report.summary.average_ticket)}
                        hint={t('reportes.kpi_avg_ticket_hint')}
                        icon={BarChart3}
                        accent="blue"
                    />
                    <StatCard
                        title={t('reportes.kpi_voided')}
                        value={report.summary.voided_count}
                        hint={t('reportes.kpi_voided_hint', {
                            amount: money(report.summary.voided_total),
                        })}
                        icon={Receipt}
                        accent="amber"
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <SalesWeekChart
                        data={report.by_day}
                        title={t('reportes.chart_sales_title')}
                        description={t('reportes.chart_sales_hint')}
                        amountLabel={t('reportes.kpi_revenue')}
                    />
                    <PaymentMethodsChart
                        data={report.by_payment_method}
                        title={t('reportes.chart_payment_title')}
                        description={t('reportes.chart_payment_hint')}
                        labelForMethod={methodLabel}
                    />
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="border-b border-border/60">
                        <CardTitle className="text-base">
                            {t('reportes.cashier_title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-border/60 p-0">
                        {report.by_cashier.length === 0 ? (
                            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                                {t('reportes.cashier_empty')}
                            </p>
                        ) : (
                            report.by_cashier.map((row) => (
                                <div
                                    key={row.cajero?.id ?? 'sin-cajero'}
                                    className="flex items-center justify-between gap-3 px-5 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-9 items-center justify-center rounded-lg bg-[#eef3fc] text-[#0744a9] dark:bg-brand-blue/20 dark:text-brand-blue-light">
                                            <Users className="size-4" />
                                        </span>
                                        <div>
                                            <p className="font-medium">
                                                {row.cajero?.name ?? '—'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {t('reportes.cashier_sales', {
                                                    count: row.sales_count,
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-semibold tabular-nums">
                                        {money(row.total)}
                                    </p>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    <div>
                        <h2 className="text-base font-semibold">
                            {t('reportes.detail_title')}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {t('reportes.detail_description')}
                        </p>
                    </div>

                    <TableCard
                        flush
                        toolbar={
                        <SearchInput
                            value={table.search}
                            onChange={table.setSearch}
                            placeholder={t('reportes.search_placeholder')}
                            className="sm:max-w-xs"
                        />
                    }
                    footer={
                        total > perPage ? (
                            <Pagination
                                page={page}
                                perPage={perPage}
                                total={total}
                                onPageChange={goToPage}
                            />
                        ) : undefined
                    }
                >
                    <DataTable
                        columns={columns}
                        data={table.pageItems}
                        rowKey={(row) => row.id}
                        sort={table.sort}
                        onSort={table.toggleSort}
                        actions={actions}
                        emptyMessage={t('reportes.empty')}
                    />
                </TableCard>
                </div>
            </div>
        </>
    );
}

ReportesIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(props.translations as TranslationTree, 'reportes.title'),
            href: '/reportes',
        },
    ],
});
