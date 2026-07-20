import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleOff,
    Download,
    Eye,
    EyeOff,
    Layers,
    ListTree,
    Pencil,
    Plus,
    Star,
    Trash2,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { SearchInput } from '@/components/common/search-input';
import { StatusPill } from '@/components/common/status-pill';
import { TableCard } from '@/components/common/table-card';
import { TableFilterSelect } from '@/components/common/table-filter-select';
import { TableRowActions } from '@/components/common/table-row-actions';
import { PlanFormModal } from '@/components/planes/plan-form-modal';
import { resolvePlanColor } from '@/components/planes/plan-colors';
import type { PlanAbilities, PlanRow } from '@/components/planes/types';
import { Button } from '@/components/ui/button';
import { useClientTable } from '@/hooks/use-client-table';
import { useTranslations } from '@/hooks/use-translations';
import { downloadXlsx } from '@/lib/export-xlsx';
import { translate, type TranslationTree } from '@/lib/i18n';

type PlansPageProps = {
    plans: PlanRow[];
    can: PlanAbilities;
};

type ActiveFilter = 'all' | 'active' | 'inactive';
type VisibilityFilter = 'all' | 'public' | 'private';

function formatPen(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }
    return `S/ ${Number(value).toFixed(2)}`;
}

export default function PlansIndex({ plans, can }: PlansPageProps) {
    const { t, locale } = useTranslations();

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<PlanRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PlanRow | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
    const [visibilityFilter, setVisibilityFilter] =
        useState<VisibilityFilter>('all');

    const filteredByStatus = useMemo(() => {
        return plans.filter((plan) => {
            if (activeFilter === 'active' && !plan.active) return false;
            if (activeFilter === 'inactive' && plan.active) return false;
            if (visibilityFilter === 'public' && !plan.is_public) {
                return false;
            }
            if (visibilityFilter === 'private' && plan.is_public) {
                return false;
            }
            return true;
        });
    }, [plans, activeFilter, visibilityFilter]);

    const table = useClientTable(filteredByStatus, {
        searchable: (row) =>
            [row.name, row.code, row.badge, row.description]
                .filter(Boolean)
                .join(' '),
        initialSort: { key: 'sort_order', dir: 'asc' },
    });

    const activeCount = plans.filter((p) => p.active).length;
    const inactiveCount = plans.length - activeCount;
    const publicCount = plans.filter((p) => p.is_public).length;
    const privateCount = plans.length - publicCount;
    const activeFilters =
        (activeFilter !== 'all' ? 1 : 0) +
        (visibilityFilter !== 'all' ? 1 : 0);

    const activeFilterOptions = useMemo(
        () => [
            {
                value: 'all',
                label: t('plans.filter_all_status'),
                icon: Layers,
                tone: 'blue' as const,
            },
            {
                value: 'active',
                label: t('plans.filter_active'),
                icon: CheckCircle2,
                tone: 'green' as const,
            },
            {
                value: 'inactive',
                label: t('plans.filter_inactive'),
                icon: CircleOff,
                tone: 'orange' as const,
            },
        ],
        [t],
    );

    const visibilityFilterOptions = useMemo(
        () => [
            {
                value: 'all',
                label: t('plans.filter_all_visibility'),
                icon: Layers,
                tone: 'blue' as const,
            },
            {
                value: 'public',
                label: t('plans.filter_public'),
                icon: Eye,
                tone: 'purple' as const,
            },
            {
                value: 'private',
                label: t('plans.filter_private'),
                icon: EyeOff,
                tone: 'gray' as const,
            },
        ],
        [t],
    );

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (plan: PlanRow) => {
        setEditing(plan);
        setFormOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/planes/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    const exportExcel = async () => {
        await downloadXlsx(
            'planes-vanpe.xlsx',
            'Planes',
            filteredByStatus,
            [
                { header: t('plans.col_plan'), width: 22, value: (p) => p.name },
                { header: t('plans.col_code'), width: 14, value: (p) => p.code },
                { header: t('plans.field_badge'), width: 16, value: (p) => p.badge ?? '' },
                {
                    header: t('plans.col_price'),
                    width: 14,
                    value: (p) => formatPen(p.monthly_price),
                },
                {
                    header: t('plans.field_yearly_price'),
                    width: 14,
                    value: (p) =>
                        p.yearly_price
                            ? formatPen(p.yearly_price)
                            : t('plans.yearly_none'),
                },
                {
                    header: t('plans.col_features'),
                    width: 10,
                    value: (p) => p.features_count,
                },
                {
                    header: t('plans.col_subscriptions'),
                    width: 14,
                    value: (p) => p.subscriptions_count,
                },
                {
                    header: t('plans.col_trial'),
                    width: 12,
                    value: (p) =>
                        p.trial_days > 0
                            ? t('plans.trial_days_label', { days: p.trial_days })
                            : t('plans.trial_none'),
                },
                {
                    header: t('plans.active'),
                    width: 10,
                    value: (p) =>
                        p.active ? t('plans.active') : t('plans.inactive'),
                },
                {
                    header: t('plans.public'),
                    width: 10,
                    value: (p) =>
                        p.is_public ? t('plans.public') : t('plans.private'),
                },
            ],
            {
                title: t('plans.title'),
                subtitle: `${t('plans.description')} · ${new Date().toLocaleString(locale)}`,
            },
        );
    };

    const columns: DataTableColumn<PlanRow>[] = useMemo(
        () => [
            {
                key: 'name',
                header: t('plans.col_plan'),
                sortable: true,
                render: (plan) => {
                    const accent = resolvePlanColor(
                        plan.code,
                        plan.color_hex,
                    );
                    return (
                        <div className="flex items-center gap-2.5">
                            <span
                                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ring-1 ring-black/5"
                                style={{ backgroundColor: accent }}
                            >
                                <Star
                                    className="size-3.5 fill-current"
                                    strokeWidth={1.5}
                                />
                            </span>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[13px] font-medium text-foreground">
                                        {plan.name}
                                    </span>
                                    {plan.badge && (
                                        <span
                                            className="rounded-md px-2 py-0.5 text-[10px] font-medium text-white"
                                            style={{
                                                backgroundColor: accent,
                                            }}
                                        >
                                            {plan.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="font-mono text-[11px] text-muted-foreground">
                                    {plan.code}
                                </p>
                            </div>
                        </div>
                    );
                },
            },
            {
                key: 'monthly_price',
                header: t('plans.col_prices'),
                sortable: true,
                render: (plan) => (
                    <div className="space-y-0.5">
                        <p className="text-[13px] font-medium text-foreground">
                            {formatPen(plan.monthly_price)}
                            <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                                /{t('plans.per_month')}
                            </span>
                        </p>
                        <p className="text-[11px] italic text-muted-foreground">
                            {plan.yearly_price
                                ? `${formatPen(plan.yearly_price)} / ${t('plans.per_year')}`
                                : t('plans.yearly_none')}
                        </p>
                    </div>
                ),
            },
            {
                key: 'features_count',
                header: t('plans.col_features'),
                sortable: true,
                render: (plan) => (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <ListTree className="size-3.5 opacity-70" />
                        <span>{plan.features_count}</span>
                    </span>
                ),
            },
            {
                key: 'subscriptions_count',
                header: t('plans.col_subscriptions'),
                sortable: true,
                render: (plan) => (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Users className="size-3.5 opacity-70" />
                        <span>{plan.subscriptions_count}</span>
                    </span>
                ),
            },
            {
                key: 'trial_days',
                header: t('plans.col_trial'),
                sortable: true,
                render: (plan) => (
                    <span className="text-[12px] text-muted-foreground">
                        {plan.trial_days > 0
                            ? t('plans.trial_days_label', {
                                  days: plan.trial_days,
                              })
                            : t('plans.trial_none')}
                    </span>
                ),
            },
            {
                key: 'active',
                header: t('plans.col_status'),
                sortable: true,
                render: (plan) => (
                    <div className="flex flex-wrap gap-1">
                        <StatusPill variant="neutral">
                            {plan.active
                                ? t('plans.active')
                                : t('plans.inactive')}
                        </StatusPill>
                        <StatusPill variant="blue">
                            {plan.is_public
                                ? t('plans.public')
                                : t('plans.private')}
                        </StatusPill>
                    </div>
                ),
            },
        ],
        [t],
    );

    const actions = (plan: PlanRow) => (
        <TableRowActions
            items={[
                {
                    key: 'edit',
                    label: t('roles.action_edit'),
                    icon: Pencil,
                    onClick: () => openEdit(plan),
                    hidden: !can.update,
                },
                {
                    key: 'delete',
                    label: t('roles.action_delete'),
                    icon: Trash2,
                    onClick: () => setDeleteTarget(plan),
                    variant: 'destructive',
                    disabled: plan.subscriptions_count > 0,
                    hidden: !can.delete,
                },
                {
                    key: 'subs-hint',
                    hint:
                        plan.subscriptions_count > 0
                            ? t('plans.subscriptions_locked', {
                                  count: plan.subscriptions_count,
                              })
                            : undefined,
                    hidden:
                        plan.subscriptions_count === 0 || !can.delete,
                },
            ]}
        />
    );

    return (
        <>
            <Head title={t('plans.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('plans.title')}
                    description={t('plans.description')}
                    badges={[
                        {
                            label: t('plans.badge_total'),
                            value: plans.length,
                            color: 'blue',
                            icon: Layers,
                        },
                        {
                            label: t('plans.active'),
                            value: activeCount,
                            color: 'green',
                            icon: Layers,
                        },
                        {
                            label: t('plans.inactive'),
                            value: inactiveCount,
                            color: 'orange',
                            icon: Layers,
                        },
                        {
                            label: t('plans.public'),
                            value: publicCount,
                            color: 'purple',
                            icon: Layers,
                        },
                        {
                            label: t('plans.private'),
                            value: privateCount,
                            color: 'gray',
                            icon: Layers,
                        },
                        ...(activeFilters > 0
                            ? [
                                  {
                                      label: t('plans.badge_filters'),
                                      value: activeFilters,
                                      color: 'yellow' as const,
                                  },
                              ]
                            : []),
                        {
                            label: t('plans.badge_matches'),
                            value: table.total,
                            color: 'teal',
                        },
                    ]}
                    action={
                        can.create
                            ? {
                                  label: t('plans.new'),
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
                        {t('plans.export_excel')}
                    </Button>
                </PageHeader>

                <TableCard
                    flush
                    toolbar={
                        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <SearchInput
                                value={table.search}
                                onChange={table.setSearch}
                                placeholder={t('plans.search_placeholder')}
                                className="w-full lg:max-w-md"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <TableFilterSelect
                                    value={activeFilter}
                                    onChange={(value) => {
                                        setActiveFilter(value as ActiveFilter);
                                        table.setPage(1);
                                    }}
                                    options={activeFilterOptions}
                                    placeholder={t('plans.filter_all_status')}
                                />
                                <TableFilterSelect
                                    value={visibilityFilter}
                                    onChange={(value) => {
                                        setVisibilityFilter(
                                            value as VisibilityFilter,
                                        );
                                        table.setPage(1);
                                    }}
                                    options={visibilityFilterOptions}
                                    placeholder={t('plans.filter_all_visibility')}
                                />
                            </div>
                        </div>
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
                        rowKey={(plan) => plan.id}
                        sort={table.sort}
                        onSort={table.toggleSort}
                        actions={
                            can.update || can.delete ? actions : undefined
                        }
                        emptyMessage={t('plans.empty')}
                    />
                </TableCard>
            </div>

            <PlanFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                plan={editing}
            />

            <BaseModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={t('plans.delete_title')}
                description={
                    deleteTarget
                        ? t('plans.delete_confirm', { name: deleteTarget.name })
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

PlansIndex.layout = (props) => ({
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
                'plans.title',
            ),
            href: '/planes',
        },
    ],
});
