import { Head, router } from '@inertiajs/react';
import {
    Download,
    Pencil,
    Plus,
    Receipt,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { SearchInput } from '@/components/common/search-input';
import { StatusPill } from '@/components/common/status-pill';
import { TableCard } from '@/components/common/table-card';
import { TableRowActions } from '@/components/common/table-row-actions';
import { SubscriptionPaymentFormModal } from '@/components/subscription-payments/subscription-payment-form-modal';
import type {
    SubscriptionOption,
    SubscriptionPaymentAbilities,
    SubscriptionPaymentRow,
} from '@/components/subscription-payments/types';
import { Button } from '@/components/ui/button';
import { useClientTable } from '@/hooks/use-client-table';
import { useTranslations } from '@/hooks/use-translations';
import { downloadXlsx } from '@/lib/export-xlsx';
import { formatLocaleDate, translate, type TranslationTree } from '@/lib/i18n';

type SubscriptionPaymentsPageProps = {
    payments: SubscriptionPaymentRow[];
    subscriptions: SubscriptionOption[];
    concepts: string[];
    statuses: string[];
    gateways: string[];
    can: SubscriptionPaymentAbilities;
};

export default function SubscriptionPaymentsIndex({
    payments,
    subscriptions,
    concepts,
    statuses,
    gateways,
    can,
}: SubscriptionPaymentsPageProps) {
    const { t, locale } = useTranslations();

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<SubscriptionPaymentRow | null>(null);
    const [deleteTarget, setDeleteTarget] =
        useState<SubscriptionPaymentRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const table = useClientTable(payments, {
        searchable: [
            'tenant_name',
            'tenant_slug',
            'plan_name',
            'plan_code',
            'gateway_ref',
        ],
        initialSort: { key: 'created_at', dir: 'desc' },
    });

    const paidCount = payments.filter((row) => row.status === 'paid').length;
    const pendingCount = payments.filter((row) => row.status === 'pending').length;

    const statusLabel = (status: string) =>
        t(
            `subscription_payments.status_${status}` as 'subscription_payments.status_pending',
        );

    const conceptLabel = (concept: string) =>
        t(
            `subscription_payments.concept_${concept}` as 'subscription_payments.concept_subscription',
        );

    const statusVariant = (status: string) => {
        if (status === 'paid') return 'blue' as const;
        if (status === 'pending') return 'neutral' as const;
        return 'muted' as const;
    };

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (row: SubscriptionPaymentRow) => {
        setEditing(row);
        setFormOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/subscription-payments/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    const exportExcel = async () => {
        const q = table.search.trim().toLowerCase();
        const rows = q
            ? payments.filter((row) =>
                  [
                      row.tenant_name,
                      row.tenant_slug,
                      row.plan_name,
                      row.plan_code,
                      row.gateway_ref,
                  ]
                      .join(' ')
                      .toLowerCase()
                      .includes(q),
              )
            : payments;

        await downloadXlsx(
            'pagos-suscripcion-vanpe.xlsx',
            'Pagos',
            rows,
            [
                {
                    header: t('subscription_payments.col_tenant'),
                    width: 22,
                    value: (r) => r.tenant_name ?? '',
                },
                {
                    header: t('subscription_payments.col_plan'),
                    width: 16,
                    value: (r) => r.plan_name ?? '',
                },
                {
                    header: t('subscription_payments.col_concept'),
                    width: 18,
                    value: (r) => conceptLabel(r.concept),
                },
                {
                    header: t('subscription_payments.col_amount'),
                    width: 12,
                    value: (r) => `${r.currency} ${r.amount}`,
                },
                {
                    header: t('subscription_payments.col_status'),
                    width: 14,
                    value: (r) => statusLabel(r.status),
                },
                {
                    header: t('subscription_payments.col_paid_at'),
                    width: 14,
                    value: (r) =>
                        r.paid_at
                            ? formatLocaleDate(r.paid_at, locale)
                            : '—',
                },
            ],
            {
                title: t('subscription_payments.title'),
                subtitle: new Date().toLocaleString(locale),
            },
        );
    };

    const columns: DataTableColumn<SubscriptionPaymentRow>[] = useMemo(
        () => [
            {
                key: 'tenant_name',
                header: t('subscription_payments.col_tenant'),
                sortable: true,
                render: (row) => (
                    <div>
                        <span className="text-[13px] font-medium text-foreground">
                            {row.tenant_name}
                        </span>
                        <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                            {row.tenant_slug}
                        </span>
                    </div>
                ),
            },
            {
                key: 'plan_name',
                header: t('subscription_payments.col_plan'),
                sortable: true,
                render: (row) => (
                    <span className="text-[13px] text-muted-foreground">
                        {row.plan_name}
                    </span>
                ),
            },
            {
                key: 'concept',
                header: t('subscription_payments.col_concept'),
                sortable: true,
                render: (row) => (
                    <span className="text-[13px] text-muted-foreground">
                        {conceptLabel(row.concept)}
                    </span>
                ),
            },
            {
                key: 'amount',
                header: t('subscription_payments.col_amount'),
                sortable: true,
                render: (row) => (
                    <span className="text-[13px] font-medium tabular-nums text-foreground">
                        {row.currency} {row.amount}
                    </span>
                ),
            },
            {
                key: 'status',
                header: t('subscription_payments.col_status'),
                sortable: true,
                render: (row) => (
                    <StatusPill variant={statusVariant(row.status)}>
                        {statusLabel(row.status)}
                    </StatusPill>
                ),
            },
            {
                key: 'paid_at',
                header: t('subscription_payments.col_paid_at'),
                sortable: true,
                render: (row) => (
                    <span className="text-[12px] text-muted-foreground">
                        {row.paid_at
                            ? formatLocaleDate(row.paid_at, locale)
                            : '—'}
                    </span>
                ),
            },
        ],
        [locale, t],
    );

    const actions = (row: SubscriptionPaymentRow) => (
        <TableRowActions
            items={[
                {
                    key: 'edit',
                    label: t('roles.action_edit'),
                    icon: Pencil,
                    onClick: () => openEdit(row),
                    hidden: !can.update,
                },
                {
                    key: 'delete',
                    label: t('roles.action_delete'),
                    icon: Trash2,
                    onClick: () => setDeleteTarget(row),
                    variant: 'destructive',
                    hidden: !can.delete,
                },
            ]}
        />
    );

    return (
        <>
            <Head title={t('subscription_payments.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('subscription_payments.title')}
                    description={t('subscription_payments.description')}
                    badges={[
                        {
                            label: t('subscription_payments.badge_total'),
                            value: payments.length,
                            color: 'blue',
                            icon: Receipt,
                        },
                        {
                            label: t('subscription_payments.status_paid'),
                            value: paidCount,
                            color: 'green',
                            icon: Receipt,
                        },
                        {
                            label: t('subscription_payments.status_pending'),
                            value: pendingCount,
                            color: 'orange',
                            icon: Receipt,
                        },
                    ]}
                    action={
                        can.create
                            ? {
                                  label: t('subscription_payments.new'),
                                  onClick: openCreate,
                                  icon: Plus,
                              }
                            : undefined
                    }
                >
                    <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer gap-2"
                        onClick={exportExcel}
                    >
                        <Download className="size-4" />
                        {t('subscription_payments.export_excel')}
                    </Button>
                </PageHeader>

                <TableCard
                    flush
                    toolbar={
                        <SearchInput
                            value={table.search}
                            onChange={table.setSearch}
                            placeholder={t(
                                'subscription_payments.search_placeholder',
                            )}
                        />
                    }
                    footer={
                        <Pagination
                            page={table.page}
                            perPage={table.perPage}
                            total={table.total}
                            onPageChange={table.setPage}
                            onPerPageChange={table.setPerPage}
                        />
                    }
                >
                    <DataTable
                        columns={columns}
                        data={table.pageItems}
                        rowKey={(row) => row.id}
                        sort={table.sort}
                        onSort={table.toggleSort}
                        actions={
                            can.update || can.delete ? actions : undefined
                        }
                        emptyMessage={t('subscription_payments.empty')}
                    />
                </TableCard>
            </div>

            <SubscriptionPaymentFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                payment={editing}
                subscriptions={subscriptions}
                concepts={concepts}
                statuses={statuses}
                gateways={gateways}
            />

            <BaseModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={t('subscription_payments.delete_title')}
                description={
                    deleteTarget
                        ? t('subscription_payments.delete_confirm', {
                              tenant: deleteTarget.tenant_name ?? '',
                          })
                        : ''
                }
                submitLabel={t('common.delete')}
                submitVariant="destructive"
                onSubmit={confirmDelete}
                submitting={deleting}
            />
        </>
    );
}

SubscriptionPaymentsIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(
                props.translations as TranslationTree,
                'nav.saas',
            ),
            href: '/planes',
        },
        {
            title: translate(
                props.translations as TranslationTree,
                'subscription_payments.title',
            ),
            href: '/subscription-payments',
        },
    ],
});
