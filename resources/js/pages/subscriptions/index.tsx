import { Head, router } from '@inertiajs/react';
import {
    Building2,
    CreditCard,
    Download,
    Pencil,
    Plus,
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
import { SubscriptionFormModal } from '@/components/subscriptions/subscription-form-modal';
import type {
    PlanOption,
    SubscriptionAbilities,
    SubscriptionRow,
    TenantOption,
} from '@/components/subscriptions/types';
import { Button } from '@/components/ui/button';
import { useClientTable } from '@/hooks/use-client-table';
import { useTranslations } from '@/hooks/use-translations';
import { downloadXlsx } from '@/lib/export-xlsx';
import { formatLocaleDate, translate, type TranslationTree } from '@/lib/i18n';

type SubscriptionsPageProps = {
    subscriptions: SubscriptionRow[];
    tenants: TenantOption[];
    plans: PlanOption[];
    statuses: string[];
    billingCycles: string[];
    can: SubscriptionAbilities;
};

export default function SubscriptionsIndex({
    subscriptions,
    tenants,
    plans,
    statuses,
    billingCycles,
    can,
}: SubscriptionsPageProps) {
    const { t, locale } = useTranslations();

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<SubscriptionRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SubscriptionRow | null>(
        null,
    );
    const [deleting, setDeleting] = useState(false);

    const subscribedTenantIds = useMemo(
        () => subscriptions.map((s) => s.tenant_id),
        [subscriptions],
    );

    const table = useClientTable(subscriptions, {
        searchable: ['tenant_name', 'tenant_slug', 'plan_name', 'plan_code'],
        initialSort: { key: 'created_at', dir: 'desc' },
    });

    const activeCount = subscriptions.filter(
        (s) => s.status === 'active' || s.status === 'trial',
    ).length;

    const statusLabel = (status: string) =>
        t(`subscriptions.status_${status}` as 'subscriptions.status_trial');

    const cycleLabel = (cycle: string) =>
        t(
            cycle === 'yearly'
                ? 'subscriptions.cycle_yearly'
                : 'subscriptions.cycle_monthly',
        );

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (row: SubscriptionRow) => {
        setEditing(row);
        setFormOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/subscriptions/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    const exportExcel = async () => {
        const q = table.search.trim().toLowerCase();
        const rows = q
            ? subscriptions.filter((row) =>
                  [row.tenant_name, row.tenant_slug, row.plan_name, row.plan_code]
                      .join(' ')
                      .toLowerCase()
                      .includes(q),
              )
            : subscriptions;

        await downloadXlsx(
            'suscripciones-vanpe.xlsx',
            'Suscripciones',
            rows,
            [
                {
                    header: t('subscriptions.col_tenant'),
                    width: 24,
                    value: (r) => r.tenant_name ?? '',
                },
                {
                    header: t('plans.col_code'),
                    width: 14,
                    value: (r) => r.tenant_slug ?? '',
                },
                {
                    header: t('subscriptions.col_plan'),
                    width: 18,
                    value: (r) => r.plan_name ?? '',
                },
                {
                    header: t('subscriptions.col_status'),
                    width: 12,
                    value: (r) => statusLabel(r.status),
                },
                {
                    header: t('subscriptions.col_cycle'),
                    width: 12,
                    value: (r) => cycleLabel(r.billing_cycle),
                },
                {
                    header: t('subscriptions.col_price'),
                    width: 12,
                    value: (r) => `S/ ${Number(r.current_price).toFixed(2)}`,
                },
                {
                    header: t('subscriptions.field_period_start'),
                    width: 14,
                    value: (r) => formatLocaleDate(r.period_start, locale),
                },
                {
                    header: t('subscriptions.field_period_end'),
                    width: 14,
                    value: (r) => formatLocaleDate(r.period_end, locale),
                },
                {
                    header: t('subscriptions.col_auto_renew'),
                    width: 12,
                    value: (r) =>
                        r.auto_renew
                            ? t('subscriptions.auto_yes')
                            : t('subscriptions.auto_no'),
                },
            ],
            {
                title: t('subscriptions.title'),
                subtitle: `${t('subscriptions.description')} · ${new Date().toLocaleString(locale)}`,
            },
        );
    };

    const columns: DataTableColumn<SubscriptionRow>[] = useMemo(
        () => [
            {
                key: 'tenant_name',
                header: t('subscriptions.col_tenant'),
                sortable: true,
                render: (row) => (
                    <div className="flex items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#eef3fc] text-brand-blue ring-1 ring-[#d0dbef]">
                            <Building2 className="size-3.5" />
                        </span>
                        <div>
                            <span className="text-[13px] font-medium text-foreground">
                                {row.tenant_name}
                            </span>
                            <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                                {row.tenant_slug}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'plan_name',
                header: t('subscriptions.col_plan'),
                sortable: true,
                render: (row) => (
                    <span className="text-[13px] text-muted-foreground">
                        {row.plan_name}
                        <span className="ml-1 font-mono text-[11px]">
                            ({row.plan_code})
                        </span>
                    </span>
                ),
            },
            {
                key: 'status',
                header: t('subscriptions.col_status'),
                sortable: true,
                render: (row) => (
                    <StatusPill
                        variant={
                            row.status === 'active' || row.status === 'trial'
                                ? 'blue'
                                : 'muted'
                        }
                    >
                        {statusLabel(row.status)}
                    </StatusPill>
                ),
            },
            {
                key: 'billing_cycle',
                header: t('subscriptions.col_cycle'),
                sortable: true,
                render: (row) => (
                    <span className="text-[13px] text-muted-foreground">
                        {cycleLabel(row.billing_cycle)}
                    </span>
                ),
            },
            {
                key: 'current_price',
                header: t('subscriptions.col_price'),
                sortable: true,
                render: (row) => (
                    <span className="text-[13px] text-foreground">
                        S/ {Number(row.current_price).toFixed(2)}
                    </span>
                ),
            },
            {
                key: 'period_end',
                header: t('subscriptions.col_period'),
                sortable: true,
                render: (row) => (
                    <span className="text-[11px] text-muted-foreground">
                        {formatLocaleDate(row.period_start, locale)} —{' '}
                        {formatLocaleDate(row.period_end, locale)}
                    </span>
                ),
            },
            {
                key: 'auto_renew',
                header: t('subscriptions.col_auto_renew'),
                sortable: true,
                render: (row) => (
                    <StatusPill variant="neutral">
                        {row.auto_renew
                            ? t('subscriptions.auto_yes')
                            : t('subscriptions.auto_no')}
                    </StatusPill>
                ),
            },
        ],
        [t, locale],
    );

    const actions = (row: SubscriptionRow) => (
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
            <Head title={t('subscriptions.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('subscriptions.title')}
                    description={t('subscriptions.description')}
                    badges={[
                        {
                            label: t('subscriptions.title'),
                            value: subscriptions.length,
                            color: 'blue',
                            icon: CreditCard,
                        },
                        {
                            label: t('subscriptions.status_active'),
                            value: activeCount,
                            color: 'green',
                            icon: Building2,
                        },
                    ]}
                    action={
                        can.create
                            ? {
                                  label: t('subscriptions.new'),
                                  onClick: openCreate,
                                  icon: Plus,
                              }
                            : undefined
                    }
                >
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={exportExcel}
                    >
                        <Download className="size-4" />
                        {t('subscriptions.export_excel')}
                    </Button>
                </PageHeader>

                <TableCard
                    flush
                    toolbar={
                        <SearchInput
                            value={table.search}
                            onChange={table.setSearch}
                            placeholder={t('subscriptions.search_placeholder')}
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
                        emptyMessage={t('subscriptions.empty')}
                    />
                </TableCard>
            </div>

            <SubscriptionFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                subscription={editing}
                tenants={tenants}
                plans={plans}
                statuses={statuses}
                billingCycles={billingCycles}
                subscribedTenantIds={subscribedTenantIds}
            />

            <BaseModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={t('subscriptions.delete_title')}
                description={
                    deleteTarget
                        ? t('subscriptions.delete_confirm', {
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

SubscriptionsIndex.layout = (props) => ({
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
                'subscriptions.title',
            ),
            href: '/subscriptions',
        },
    ],
});
