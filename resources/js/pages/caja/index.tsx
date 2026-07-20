import { Head, Link, router } from '@inertiajs/react';
import {
    Banknote,
    CircleDollarSign,
    Eye,
    History,
    Lock,
    Plus,
    Receipt,
    ScrollText,
    UserCircle,
    Wallet,
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { AutoRefreshIndicator } from '@/components/common/auto-refresh-indicator';
import { ChargeOrderModal } from '@/components/caja/charge-order-modal';
import { CloseCashModal } from '@/components/caja/close-cash-modal';
import { HistoryDetailModal } from '@/components/caja/history-detail-modal';
import { OpenCashModal } from '@/components/caja/open-cash-modal';
import { PostSaleDocumentModal } from '@/components/fel/post-sale-document-modal';
import type { SaleTicket } from '@/components/ventas/types';
import type {
    CajaAbilities,
    CajaFelConfig,
    CajaHistoryPaginator,
    CajaHistorySession,
    CajaPendingOrder,
    CajaSession,
} from '@/components/caja/types';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { SearchInput } from '@/components/common/search-input';
import { TableCard } from '@/components/common/table-card';
import { TableRowActions } from '@/components/common/table-row-actions';
import { Button } from '@/components/ui/button';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { useClientTable } from '@/hooks/use-client-table';
import { useTranslations } from '@/hooks/use-translations';
import {
    formatCajaDate,
    formatCajaMoney,
    formatCajaTime,
} from '@/lib/caja-format';
import { translate, type TranslationTree } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type CajaIndexProps = {
    session: CajaSession | null;
    pendingOrders: CajaPendingOrder[];
    history: CajaHistoryPaginator;
    currency: string;
    saleTicket: SaleTicket | null;
    fel: CajaFelConfig;
    can: CajaAbilities;
};

const CAJA_REFRESH_MS = 15_000;
const CAJA_RELOAD_PROPS = ['session', 'pendingOrders', 'history'];

export default function CajaIndex({
    session,
    pendingOrders,
    history,
    currency,
    saleTicket,
    fel,
}: CajaIndexProps) {
    const { t, locale, timezone } = useTranslations();

    const { secondsAgo, intervalSeconds, isRefreshing, refresh } =
        useAutoRefresh({
            intervalMs: CAJA_REFRESH_MS,
            only: CAJA_RELOAD_PROPS,
        });

    const [openModal, setOpenModal] = useState(false);
    const [closeModal, setCloseModal] = useState(false);
    const [chargeOrder, setChargeOrder] = useState<CajaPendingOrder | null>(null);
    const [historyDetail, setHistoryDetail] = useState<CajaHistorySession | null>(null);
    const [ticketSale, setTicketSale] = useState<SaleTicket | null>(saleTicket);

    useEffect(() => {
        if (saleTicket) {
            setTicketSale(saleTicket);
        }
    }, [saleTicket]);

    const pendingTable = useClientTable(pendingOrders, {
        searchable: (order) =>
            [
                order.number,
                order.table?.number,
                order.table?.area,
                order.waiter?.name,
            ]
                .filter((value) => value != null && value !== '')
                .join(' '),
        initialSort: { key: 'opened_at', dir: 'asc' },
        sortAccessor: (row, key) => {
            if (key === 'table') {
                return row.table?.number ?? '';
            }

            if (key === 'waiter') {
                return row.waiter?.name ?? '';
            }

            return (row as Record<string, string | number | null | undefined>)[key];
        },
    });

    const historyPage = history.meta?.current_page ?? history.current_page ?? 1;
    const historyPerPage = history.meta?.per_page ?? history.per_page ?? 15;
    const historyTotal = history.meta?.total ?? history.total ?? 0;

    const goHistoryPage = (nextPage: number) => {
        router.get(
            '/caja',
            { page: nextPage },
            { preserveState: true, preserveScroll: true, only: ['history'] },
        );
    };

    const pendingColumns: DataTableColumn<CajaPendingOrder>[] = useMemo(
        () => [
            {
                key: 'number',
                header: t('caja.col_order'),
                sortable: true,
                render: (order) => (
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                            <Receipt className="size-4" />
                        </span>
                        <div className="min-w-0">
                            <span className="font-medium text-foreground">
                                {t('caja.order', { number: order.number })}
                            </span>
                            <p className="text-xs text-muted-foreground">
                                {t('caja.col_items_count', {
                                    count: order.items_count,
                                })}
                            </p>
                        </div>
                    </div>
                ),
            },
            {
                key: 'table',
                header: t('caja.col_table'),
                sortable: true,
                sortKey: 'table',
                render: (order) =>
                    order.table ? (
                        <span className="text-muted-foreground">
                            {t('caja.table', { number: order.table.number })}
                            {order.table.area ? ` · ${order.table.area}` : ''}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    ),
            },
            {
                key: 'waiter',
                header: t('caja.col_waiter'),
                render: (order) =>
                    order.waiter ? (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <UserCircle className="size-3.5" />
                            {order.waiter.name}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    ),
            },
            {
                key: 'opened_at',
                header: t('caja.col_opened'),
                sortable: true,
                render: (order) => (
                    <span className="text-muted-foreground">
                        {formatCajaTime(order.opened_at, locale, timezone)}
                    </span>
                ),
            },
            {
                key: 'total',
                header: t('caja.col_total'),
                sortable: true,
                align: 'right',
                render: (order) => (
                    <span className="font-semibold text-foreground">
                        {formatCajaMoney(order.total, currency)}
                    </span>
                ),
            },
        ],
        [t, currency, locale, timezone],
    );

    const historyColumns: DataTableColumn<CajaHistorySession>[] = useMemo(
        () => [
            {
                key: 'cerrada_en',
                header: t('caja.history_date'),
                render: (row) => (
                    <div>
                        <div className="font-medium">
                            {formatCajaDate(row.cerrada_en, locale, timezone)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {formatCajaTime(row.abierta_en, locale, timezone)} –{' '}
                            {formatCajaTime(row.cerrada_en, locale, timezone)}
                        </div>
                    </div>
                ),
            },
            {
                key: 'cajero',
                header: t('caja.history_cashier'),
                render: (row) => (
                    <span className="text-muted-foreground">
                        {row.cajero?.name ?? '—'}
                    </span>
                ),
            },
            {
                key: 'monto_apertura',
                header: t('caja.history_opening'),
                align: 'right',
                render: (row) => (
                    <span className="text-muted-foreground">
                        {formatCajaMoney(row.monto_apertura, currency)}
                    </span>
                ),
            },
            {
                key: 'total_ventas',
                header: t('caja.history_sales'),
                align: 'right',
                render: (row) => (
                    <span className="font-medium">
                        {formatCajaMoney(row.total_ventas, currency)}
                    </span>
                ),
            },
            {
                key: 'monto_cierre',
                header: t('caja.history_closing'),
                align: 'right',
                render: (row) => (
                    <span className="text-muted-foreground">
                        {formatCajaMoney(row.monto_cierre, currency)}
                    </span>
                ),
            },
            {
                key: 'diferencia',
                header: t('caja.history_difference'),
                align: 'right',
                render: (row) => (
                    <span
                        className={cn(
                            'font-medium',
                            row.diferencia === 0
                                ? 'text-emerald-600'
                                : row.diferencia > 0
                                  ? 'text-amber-600'
                                  : 'text-red-600',
                        )}
                    >
                        {formatCajaMoney(row.diferencia, currency)}
                    </span>
                ),
            },
        ],
        [t, currency, locale, timezone],
    );

    const pendingActions = (order: CajaPendingOrder) => (
        <TableRowActions
            items={[
                {
                    key: 'charge',
                    label: session ? t('caja.charge') : t('caja.charge_requires_session'),
                    icon: Banknote,
                    onClick: () => setChargeOrder(order),
                    disabled: !session,
                },
            ]}
        />
    );

    const historyActions = (row: CajaHistorySession) => (
        <TableRowActions
            items={[
                {
                    key: 'detail',
                    label: t('caja.action_view_detail'),
                    icon: Eye,
                    onClick: () => setHistoryDetail(row),
                },
            ]}
        />
    );

    const badges = [
        {
            label: session ? t('caja.badge_session_open') : t('caja.badge_session_closed'),
            value: session
                ? formatCajaTime(session.abierta_en, locale, timezone)
                : undefined,
            color: (session ? 'green' : 'orange') as const,
            icon: Wallet,
        },
        ...(session
            ? [
                  {
                      label: t('caja.badge_sales'),
                      value: formatCajaMoney(
                          session.summary?.total_ventas ?? 0,
                          currency,
                      ),
                      color: 'blue' as const,
                      icon: CircleDollarSign,
                  },
                  {
                      label: t('caja.badge_expected_cash'),
                      value: formatCajaMoney(
                          session.monto_esperado_efectivo,
                          currency,
                      ),
                      color: 'teal' as const,
                      icon: Banknote,
                  },
              ]
            : []),
        {
            label: t('caja.badge_pending'),
            value: pendingOrders.length,
            color: 'yellow' as const,
            icon: Receipt,
        },
        {
            label: t('caja.badge_history'),
            value: historyTotal,
            color: 'purple' as const,
            icon: History,
        },
    ];

    return (
        <>
            <Head title={t('caja.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('caja.title')}
                    description={t('caja.description')}
                    badges={badges}
                    action={
                        session
                            ? {
                                  label: t('caja.close_button'),
                                  onClick: () => setCloseModal(true),
                                  icon: Lock,
                              }
                            : {
                                  label: t('caja.open_button'),
                                  onClick: () => setOpenModal(true),
                                  icon: Plus,
                              }
                    }
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="gap-2 border-teal-200/80 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-900 shadow-sm hover:border-teal-300 hover:from-teal-100 hover:to-emerald-100 dark:border-teal-500/30 dark:from-teal-500/10 dark:to-emerald-500/10 dark:text-teal-100"
                        >
                            <Link href="/ventas" className="gap-2">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-sm ring-1 ring-teal-600/20">
                                    <ScrollText className="size-3.5" />
                                </span>
                                {t('ventas.title')}
                            </Link>
                        </Button>
                        <AutoRefreshIndicator
                        intervalLabel={t('common.auto_refresh_interval', {
                            seconds: intervalSeconds,
                        })}
                        agoLabel={t('common.auto_refresh_ago', {
                            seconds: secondsAgo,
                        })}
                        refreshLabel={t('common.auto_refresh_now')}
                        isRefreshing={isRefreshing}
                        onRefresh={refresh}
                    />
                    </div>
                </PageHeader>

                {!session && (
                    <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                        {t('caja.session_closed')}
                    </p>
                )}

                {session && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                        <ShiftMetric
                            label={t('caja.opening_fund')}
                            value={formatCajaMoney(session.monto_apertura, currency)}
                        />
                        <ShiftMetric
                            label={t('caja.method_efectivo')}
                            value={formatCajaMoney(session.summary?.efectivo ?? 0, currency)}
                        />
                        <ShiftMetric
                            label={t('caja.method_tarjeta')}
                            value={formatCajaMoney(session.summary?.tarjeta ?? 0, currency)}
                        />
                        <ShiftMetric
                            label={t('caja.method_yape')}
                            value={formatCajaMoney(session.summary?.yape ?? 0, currency)}
                        />
                        <ShiftMetric
                            label={t('caja.method_plin')}
                            value={formatCajaMoney(session.summary?.plin ?? 0, currency)}
                        />
                        <ShiftMetric
                            label={t('caja.sales_count', {
                                count: session.summary?.ventas_count ?? 0,
                            })}
                            value={formatCajaMoney(session.summary?.total_ventas ?? 0, currency)}
                            highlight
                        />
                    </div>
                )}

                <section className="flex flex-col gap-3">
                    <div>
                        <h2 className="text-base font-semibold">
                            {t('caja.pending_title')}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {t('caja.pending_hint')}
                        </p>
                    </div>

                    <TableCard
                        flush
                        toolbar={
                            <SearchInput
                                value={pendingTable.search}
                                onChange={pendingTable.setSearch}
                                placeholder={t('caja.search_pending_placeholder')}
                            />
                        }
                        footer={
                            pendingTable.total > pendingTable.perPage ? (
                                <Pagination
                                    page={pendingTable.page}
                                    perPage={pendingTable.perPage}
                                    total={pendingTable.total}
                                    onPageChange={pendingTable.setPage}
                                    onPerPageChange={pendingTable.setPerPage}
                                />
                            ) : undefined
                        }
                    >
                        <DataTable
                            columns={pendingColumns}
                            data={pendingTable.pageItems}
                            rowKey={(order) => order.id}
                            sort={pendingTable.sort}
                            onSort={pendingTable.toggleSort}
                            actions={pendingActions}
                            emptyMessage={t('caja.pending_empty')}
                        />
                    </TableCard>
                </section>

                <section className="flex flex-col gap-3">
                    <div>
                        <h2 className="text-base font-semibold">
                            {t('caja.history_title')}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {t('caja.history_description')}
                        </p>
                    </div>

                    <TableCard
                        flush
                        footer={
                            historyTotal > historyPerPage ? (
                                <Pagination
                                    page={historyPage}
                                    perPage={historyPerPage}
                                    total={historyTotal}
                                    onPageChange={goHistoryPage}
                                />
                            ) : undefined
                        }
                    >
                        <DataTable
                            columns={historyColumns}
                            data={history.data}
                            rowKey={(row) => row.id}
                            actions={historyActions}
                            emptyMessage={t('caja.history_empty')}
                        />
                    </TableCard>
                </section>
            </div>

            <OpenCashModal open={openModal} onOpenChange={setOpenModal} />

            <CloseCashModal
                open={closeModal}
                onOpenChange={setCloseModal}
                session={session}
                currency={currency}
            />

            <ChargeOrderModal
                open={chargeOrder !== null}
                onOpenChange={(open) => !open && setChargeOrder(null)}
                order={chargeOrder}
                currency={currency}
                fel={fel}
            />

            <HistoryDetailModal
                open={historyDetail !== null}
                onOpenChange={(open) => !open && setHistoryDetail(null)}
                row={historyDetail}
                currency={currency}
            />

            <PostSaleDocumentModal
                open={ticketSale !== null}
                onOpenChange={(open) => !open && setTicketSale(null)}
                ticket={ticketSale}
            />
        </>
    );
}

function ShiftMetric({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <div className="rounded-xl border bg-card px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p
                className={cn(
                    'text-sm font-semibold',
                    highlight ? 'text-brand-blue' : 'text-foreground',
                )}
            >
                {value}
            </p>
        </div>
    );
}

CajaIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(props.translations as TranslationTree, 'caja.title'),
            href: '/caja',
        },
    ],
});
