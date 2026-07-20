import { Head, router } from '@inertiajs/react';
import { Ban, Banknote, CheckCircle2, CreditCard, Eye, ListFilter, Receipt, RefreshCw, ScrollText, Smartphone, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FelDocumentBadges } from '@/components/fel/fel-document-badges';
import { FelDocumentDownloadMenu } from '@/components/fel/fel-document-download-menu';
import { FelCpeModal } from '@/components/fel/fel-cpe-modal';
import type { SaleListRow, SalesPaginator, VentasFilters, VentasStats } from '@/components/ventas/types';
import { VoidSaleModal } from '@/components/ventas/void-sale-modal';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { DateRangeFilter } from '@/components/common/date-range-filter';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { SearchInput } from '@/components/common/search-input';
import { TableCard } from '@/components/common/table-card';
import { TableFilterSelect } from '@/components/common/table-filter-select';
import { TableRowActions } from '@/components/common/table-row-actions';
import { Badge } from '@/components/ui/badge';
import { useClientTable } from '@/hooks/use-client-table';
import { useTranslations } from '@/hooks/use-translations';
import { formatCajaDate, formatCajaMoney, formatCajaTime } from '@/lib/caja-format';
import { parseIsoTimestamp } from '@/lib/datetime';
import type { DateRange } from '@/lib/date-range';
import { translate, type TranslationTree } from '@/lib/i18n';

type VentasIndexProps = {
    sales: SalesPaginator;
    filters: VentasFilters;
    stats: VentasStats;
    payment_methods: string[];
    currency: string;
    can: { manage: boolean; void: boolean; emit_fel: boolean };
};

export default function VentasIndex({
    sales,
    filters,
    stats,
    payment_methods,
    currency,
    can,
}: VentasIndexProps) {
    const { t, locale, timezone } = useTranslations();
    const [voidTarget, setVoidTarget] = useState<SaleListRow | null>(null);
    const [cpePreview, setCpePreview] = useState<SaleListRow | null>(null);

    const rows = sales.data;
    const page = sales.meta?.current_page ?? sales.current_page ?? 1;
    const perPage = sales.meta?.per_page ?? sales.per_page ?? 15;
    const total = sales.meta?.total ?? sales.total ?? 0;

    const dateRange: DateRange = {
        from: filters.date_from,
        to: filters.date_to,
    };

    const applyFilters = (next: Partial<VentasFilters>) => {
        router.get(
            '/ventas',
            {
                date_from: next.date_from ?? filters.date_from,
                date_to: next.date_to ?? filters.date_to,
                estado: next.estado ?? filters.estado ?? 'pagada',
                metodo: next.metodo ?? filters.metodo ?? 'all',
                page: 1,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const table = useClientTable(rows, {
        searchable: (row) =>
            [
                row.numero,
                row.order_number,
                row.table?.number,
                row.cajero?.name,
                row.metodo,
                row.estado,
            ]
                .filter((value) => value != null && value !== '')
                .join(' '),
        initialPerPage: perPage,
        initialSort: { key: 'created_at', dir: 'desc' },
        sortAccessor: (row, key) => {
            if (key === 'created_at') {
                return parseIsoTimestamp(row.created_at);
            }

            return (row as Record<string, string | number | null | undefined>)[key];
        },
    });

    const goToPage = (nextPage: number) => {
        router.get(
            '/ventas',
            {
                date_from: filters.date_from,
                date_to: filters.date_to,
                estado: filters.estado ?? 'pagada',
                metodo: filters.metodo ?? 'all',
                page: nextPage,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const methodLabel = (method: string | null) =>
        method ? t(`caja.method_${method}` as 'caja.method_efectivo') : '—';

    const statusLabel = (status: string) =>
        t(`ventas.status_${status}` as 'ventas.status_pagada');

    const estadoFilter = filters.estado ?? 'pagada';
    const metodoFilter = filters.metodo ?? 'all';

    const paymentMethodMeta: Record<
        string,
        { icon: typeof Wallet; tone: 'green' | 'blue' | 'purple' | 'gray' }
    > = {
        efectivo: { icon: Banknote, tone: 'green' },
        tarjeta: { icon: CreditCard, tone: 'blue' },
        yape: { icon: Smartphone, tone: 'purple' },
        plin: { icon: Smartphone, tone: 'gray' },
    };

    const statusFilterOptions = useMemo(
        () => [
            {
                value: 'pagada',
                label: t('ventas.filter_pagada'),
                icon: CheckCircle2,
                tone: 'green' as const,
            },
            {
                value: 'anulada',
                label: t('ventas.filter_anulada'),
                icon: Ban,
                tone: 'gray' as const,
            },
            {
                value: 'all',
                label: t('ventas.filter_all'),
                icon: ListFilter,
                tone: 'muted' as const,
            },
        ],
        [t],
    );

    const paymentFilterOptions = useMemo(
        () => [
            {
                value: 'all',
                label: t('ventas.filter_all_methods'),
                icon: Wallet,
                tone: 'muted' as const,
            },
            ...payment_methods.map((method) => {
                const meta = paymentMethodMeta[method] ?? {
                    icon: Wallet,
                    tone: 'muted' as const,
                };

                return {
                    value: method,
                    label: t(`caja.method_${method}` as 'caja.method_efectivo'),
                    icon: meta.icon,
                    tone: meta.tone,
                };
            }),
        ],
        [t, payment_methods],
    );

    const docLabel = (type: string) =>
        t(`fel.doc_${type}` as 'fel.doc_nota_venta');

    const felStatusLabel = (estado: string) =>
        t(`fel.status_${estado}` as 'fel.status_emitido');

    const columns: DataTableColumn<SaleListRow>[] = useMemo(
        () => [
            {
                key: 'numero',
                header: t('ventas.col_number'),
                sortable: true,
                render: (row) => (
                    <div className="flex items-center gap-2.5">
                        <span
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${
                                row.estado === 'anulada'
                                    ? 'bg-gradient-to-br from-slate-400 to-slate-500'
                                    : 'bg-gradient-to-br from-teal-500 to-emerald-600'
                            }`}
                        >
                            <Receipt className="size-4" />
                        </span>
                        <span className="font-medium">{row.numero}</span>
                    </div>
                ),
            },
            {
                key: 'tipo_comprobante',
                header: t('ventas.col_document'),
                render: (row) => (
                    <div className="space-y-1.5">
                        <span className="text-sm">{docLabel(row.tipo_comprobante)}</span>
                        {row.fel?.numero_completo ? (
                            <p className="font-mono text-xs text-muted-foreground">
                                {row.fel.numero_completo}
                            </p>
                        ) : row.tipo_comprobante !== 'nota_venta' ? (
                            <p className="text-xs text-amber-700">
                                {felStatusLabel(row.fel_estado)}
                            </p>
                        ) : null}
                        {row.fel && row.tipo_comprobante !== 'nota_venta' ? (
                            <FelDocumentBadges document={row.fel} compact />
                        ) : null}
                        {row.fel?.estado === 'rechazado' && row.fel.error_mensaje ? (
                            <p
                                className="max-w-xs text-xs leading-snug text-red-700"
                                title={row.fel.error_mensaje}
                            >
                                {row.fel.error_mensaje}
                            </p>
                        ) : null}
                    </div>
                ),
            },
            {
                key: 'estado',
                header: t('ventas.col_status'),
                render: (row) => (
                    <Badge
                        variant={row.estado === 'anulada' ? 'secondary' : 'default'}
                        className={
                            row.estado === 'anulada'
                                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                        }
                    >
                        {statusLabel(row.estado)}
                    </Badge>
                ),
            },
            {
                key: 'created_at',
                header: t('ventas.col_date'),
                sortable: true,
                sortKey: 'created_at',
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
                key: 'order_number',
                header: t('ventas.col_order'),
                render: (row) =>
                    row.order_number ? (
                        <span className="text-muted-foreground">
                            #{row.order_number}
                            {row.table
                                ? ` · ${t('caja.table', { number: row.table.number })}`
                                : ''}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    ),
            },
            {
                key: 'metodo',
                header: t('ventas.col_method'),
                render: (row) => (
                    <span className="text-muted-foreground">
                        {methodLabel(row.metodo)}
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
                    <span
                        className={`font-semibold ${
                            row.estado === 'anulada' ? 'text-muted-foreground line-through' : ''
                        }`}
                    >
                        {formatCajaMoney(row.total, currency)}
                    </span>
                ),
            },
        ],
        [t, currency, locale, timezone, docLabel, felStatusLabel],
    );

    const emitFel = (row: SaleListRow) => {
        router.post(`/ventas/${row.id}/emitir-fel`, {}, { preserveScroll: true });
    };

    const actions = (row: SaleListRow) => (
        <div className="flex items-center justify-end gap-1">
            {row.fel?.estado === 'emitido' ? (
                <FelDocumentDownloadMenu
                    document={row.fel}
                    saleId={row.id}
                    onViewCpe={() => setCpePreview(row)}
                />
            ) : null}
            <TableRowActions
                items={[
                    {
                        key: 'ticket',
                        label: t('ventas.action_view_ticket'),
                        icon: Eye,
                        onClick: () => router.visit(`/ventas/${row.id}`),
                    },
                    ...(can.emit_fel && row.can_emit_fel
                        ? [
                              {
                                  key: 'emit_fel',
                                  label: t('fel.action_emit'),
                                  icon: RefreshCw,
                                  onClick: () => emitFel(row),
                              },
                          ]
                        : []),
                    ...(can.void && row.can_void
                        ? [
                              {
                                  key: 'void',
                                  label: t('ventas.action_void'),
                                  icon: Ban,
                                  variant: 'destructive' as const,
                                  onClick: () => setVoidTarget(row),
                              },
                          ]
                        : []),
                ]}
            />
        </div>
    );

    return (
        <>
            <Head title={t('ventas.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('ventas.title')}
                    description={t('ventas.description')}
                    badges={[
                        {
                            label: t('ventas.badge_sales'),
                            value: total,
                            color: 'teal',
                            icon: ScrollText,
                        },
                        {
                            label: t('ventas.badge_filtered_total'),
                            value: formatCajaMoney(stats.filtered_total, currency),
                            color: 'green',
                            icon: Wallet,
                        },
                    ]}
                />

                <TableCard
                    flush
                    toolbar={
                        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <DateRangeFilter
                                    value={dateRange}
                                    onChange={(range) =>
                                        applyFilters({
                                            date_from: range.from,
                                            date_to: range.to,
                                        })
                                    }
                                />
                                <TableFilterSelect
                                    value={estadoFilter}
                                    options={statusFilterOptions}
                                    onChange={(value) =>
                                        applyFilters({ estado: value })
                                    }
                                />
                                <TableFilterSelect
                                    value={metodoFilter}
                                    options={paymentFilterOptions}
                                    onChange={(value) =>
                                        applyFilters({ metodo: value })
                                    }
                                />
                            </div>
                            <SearchInput
                                value={table.search}
                                onChange={table.setSearch}
                                placeholder={t('ventas.search_placeholder')}
                                className="sm:max-w-xs"
                            />
                        </div>
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
                        emptyMessage={t('ventas.empty')}
                    />
                </TableCard>
            </div>

            {voidTarget ? (
                <VoidSaleModal
                    open={voidTarget !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setVoidTarget(null);
                        }
                    }}
                    saleId={voidTarget.id}
                    saleNumber={voidTarget.numero}
                />
            ) : null}

            {cpePreview?.fel ? (
                <FelCpeModal
                    open={cpePreview !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setCpePreview(null);
                        }
                    }}
                    document={cpePreview.fel}
                    documentType={
                        cpePreview.tipo_comprobante === 'factura' ? 'factura' : 'boleta'
                    }
                />
            ) : null}
        </>
    );
}

VentasIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(props.translations as TranslationTree, 'ventas.title'),
            href: '/ventas',
        },
    ],
});
