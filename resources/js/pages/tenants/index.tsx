import { Head, router } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    CircleOff,
    Download,
    ExternalLink,
    Eye,
    EyeOff,
    Layers,
    Pencil,
    Plus,
    Store,
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
import { TableFilterSelect } from '@/components/common/table-filter-select';
import { TableRowActions } from '@/components/common/table-row-actions';
import { TenantFormModal } from '@/components/tenants/tenant-form-modal';
import type { TenantAbilities, TenantRow } from '@/components/tenants/types';
import { Button } from '@/components/ui/button';
import { useClientTable } from '@/hooks/use-client-table';
import { useTranslations } from '@/hooks/use-translations';
import { downloadXlsx } from '@/lib/export-xlsx';
import { formatLocaleDate, translate, type TranslationTree } from '@/lib/i18n';

type TenantsPageProps = {
    tenants: TenantRow[];
    statuses: string[];
    can: TenantAbilities;
};

type StatusFilter = 'all' | 'trial' | 'active' | 'suspended' | 'cancelled';
type PublishedFilter = 'all' | 'published' | 'unpublished';

export default function TenantsIndex({
    tenants,
    statuses,
    can,
}: TenantsPageProps) {
    const { t, locale } = useTranslations();

    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [publishedFilter, setPublishedFilter] =
        useState<PublishedFilter>('all');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<TenantRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<TenantRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const filteredTenants = useMemo(() => {
        return tenants.filter((tenant) => {
            if (statusFilter !== 'all' && tenant.estado !== statusFilter) {
                return false;
            }
            if (publishedFilter === 'published' && !tenant.publicado) {
                return false;
            }
            if (publishedFilter === 'unpublished' && tenant.publicado) {
                return false;
            }
            return true;
        });
    }, [tenants, statusFilter, publishedFilter]);

    const table = useClientTable(filteredTenants, {
        searchable: [
            'nombre_comercial',
            'razon_social',
            'slug',
            'email_admin',
            'ruc',
            'plan_name',
            'plan_code',
        ],
        initialSort: { key: 'created_at', dir: 'desc' },
    });

    const activeFilters =
        (statusFilter !== 'all' ? 1 : 0) +
        (publishedFilter !== 'all' ? 1 : 0);

    const trialCount = tenants.filter((row) => row.estado === 'trial').length;
    const activeCount = tenants.filter((row) => row.estado === 'active').length;
    const publishedCount = tenants.filter((row) => row.publicado).length;

    const statusLabel = (status: string) =>
        t(`tenants.status_${status}` as 'tenants.status_trial');

    const statusFilterOptions = useMemo(
        () => [
            {
                value: 'all',
                label: t('tenants.filter_all_status'),
                icon: Layers,
                tone: 'blue' as const,
            },
            {
                value: 'trial',
                label: t('tenants.status_trial'),
                icon: Building2,
                tone: 'blue' as const,
            },
            {
                value: 'active',
                label: t('tenants.status_active'),
                icon: CheckCircle2,
                tone: 'blue' as const,
            },
            {
                value: 'suspended',
                label: t('tenants.status_suspended'),
                icon: CircleOff,
                tone: 'muted' as const,
            },
            {
                value: 'cancelled',
                label: t('tenants.status_cancelled'),
                icon: CircleOff,
                tone: 'muted' as const,
            },
        ],
        [t],
    );

    const publishedFilterOptions = useMemo(
        () => [
            {
                value: 'all',
                label: t('tenants.filter_all_visibility'),
                icon: Layers,
                tone: 'blue' as const,
            },
            {
                value: 'published',
                label: t('tenants.filter_published'),
                icon: Eye,
                tone: 'blue' as const,
            },
            {
                value: 'unpublished',
                label: t('tenants.filter_unpublished'),
                icon: EyeOff,
                tone: 'muted' as const,
            },
        ],
        [t],
    );

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (row: TenantRow) => {
        setEditing(row);
        setFormOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/restaurantes/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    const exportExcel = async () => {
        const q = table.search.trim().toLowerCase();
        const rows = q
            ? filteredTenants.filter((row) =>
                  [
                      row.nombre_comercial,
                      row.razon_social,
                      row.slug,
                      row.email_admin,
                      row.ruc,
                      row.plan_name,
                  ]
                      .join(' ')
                      .toLowerCase()
                      .includes(q),
              )
            : filteredTenants;

        await downloadXlsx(
            'restaurantes-vanpe.xlsx',
            'Restaurantes',
            rows,
            [
                {
                    header: t('tenants.col_restaurant'),
                    width: 24,
                    value: (r) => r.nombre_comercial,
                },
                {
                    header: t('tenants.field_slug'),
                    width: 18,
                    value: (r) => r.slug,
                },
                {
                    header: t('tenants.field_email_admin'),
                    width: 26,
                    value: (r) => r.email_admin,
                },
                {
                    header: t('tenants.col_plan'),
                    width: 16,
                    value: (r) => r.plan_name ?? '—',
                },
                {
                    header: t('tenants.col_status'),
                    width: 14,
                    value: (r) => statusLabel(r.estado),
                },
                {
                    header: t('tenants.col_published'),
                    width: 12,
                    value: (r) =>
                        r.publicado
                            ? t('tenants.published_yes')
                            : t('tenants.published_no'),
                },
            ],
            {
                title: t('tenants.title'),
                subtitle: new Date().toLocaleString(locale),
            },
        );
    };

    const columns: DataTableColumn<TenantRow>[] = useMemo(
        () => [
            {
                key: 'nombre_comercial',
                header: t('tenants.col_restaurant'),
                sortable: true,
                render: (row) => (
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="truncate text-[13px] font-medium text-foreground">
                                {row.nombre_comercial}
                            </span>
                            <a
                                href={row.subdomain_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-blue hover:text-brand-blue/80"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink className="size-3.5" />
                            </a>
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground">
                            {row.slug}
                        </span>
                    </div>
                ),
            },
            {
                key: 'email_admin',
                header: t('tenants.col_contact'),
                sortable: true,
                render: (row) => (
                    <div className="min-w-0">
                        <span className="block truncate text-[13px] text-foreground">
                            {row.email_admin}
                        </span>
                        {row.telefono && (
                            <span className="text-[11px] text-muted-foreground">
                                {row.telefono}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                key: 'plan_name',
                header: t('tenants.col_plan'),
                sortable: true,
                render: (row) => (
                    <div>
                        <span className="text-[13px] text-foreground">
                            {row.plan_name ?? '—'}
                        </span>
                        {row.subscription_status && (
                            <span className="ml-2 text-[11px] text-muted-foreground">
                                {t(
                                    `subscriptions.status_${row.subscription_status}` as 'subscriptions.status_trial',
                                )}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                key: 'estado',
                header: t('tenants.col_status'),
                sortable: true,
                render: (row) => (
                    <StatusPill
                        variant={
                            row.estado === 'active' || row.estado === 'trial'
                                ? 'blue'
                                : 'muted'
                        }
                    >
                        {statusLabel(row.estado)}
                    </StatusPill>
                ),
            },
            {
                key: 'trial_ends_at',
                header: t('tenants.col_trial'),
                sortable: true,
                render: (row) => (
                    <span className="text-[12px] text-muted-foreground">
                        {row.trial_ends_at
                            ? formatLocaleDate(row.trial_ends_at, locale)
                            : '—'}
                    </span>
                ),
            },
            {
                key: 'publicado',
                header: t('tenants.col_published'),
                sortable: true,
                render: (row) => (
                    <StatusPill variant={row.publicado ? 'blue' : 'neutral'}>
                        {row.publicado
                            ? t('tenants.published_yes')
                            : t('tenants.published_no')}
                    </StatusPill>
                ),
            },
        ],
        [locale, t],
    );

    const actions = (row: TenantRow) => (
        <TableRowActions
            items={[
                {
                    key: 'open-subdomain',
                    label: t('tenants.action_open_subdomain'),
                    icon: ExternalLink,
                    onClick: () =>
                        window.open(row.subdomain_url, '_blank', 'noopener,noreferrer'),
                },
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
            <Head title={t('tenants.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('tenants.title')}
                    description={t('tenants.description')}
                    badges={[
                        {
                            label: t('tenants.badge_total'),
                            value: tenants.length,
                            color: 'blue',
                            icon: Store,
                        },
                        {
                            label: t('tenants.status_active'),
                            value: activeCount,
                            color: 'teal',
                            icon: Building2,
                        },
                        {
                            label: t('tenants.badge_trial'),
                            value: trialCount,
                            color: 'purple',
                            icon: Building2,
                        },
                        {
                            label: t('tenants.badge_published'),
                            value: publishedCount,
                            color: 'green',
                            icon: Eye,
                        },
                        ...(activeFilters > 0
                            ? [
                                  {
                                      label: t('tenants.badge_filters'),
                                      value: activeFilters,
                                      color: 'orange' as const,
                                      icon: Layers,
                                  },
                                  {
                                      label: t('tenants.badge_matches'),
                                      value: filteredTenants.length,
                                      color: 'teal' as const,
                                      icon: Store,
                                  },
                              ]
                            : []),
                    ]}
                    action={
                        can.create
                            ? {
                                  label: t('tenants.new'),
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
                        {t('tenants.export_excel')}
                    </Button>
                </PageHeader>

                <TableCard
                    flush
                    toolbar={
                        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <SearchInput
                                value={table.search}
                                onChange={table.setSearch}
                                placeholder={t('tenants.search_placeholder')}
                                className="w-full lg:max-w-md"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <TableFilterSelect
                                    value={statusFilter}
                                    onChange={(value) => {
                                        setStatusFilter(value as StatusFilter);
                                        table.setPage(1);
                                    }}
                                    options={statusFilterOptions}
                                    placeholder={t('tenants.filter_all_status')}
                                />
                                <TableFilterSelect
                                    value={publishedFilter}
                                    onChange={(value) => {
                                        setPublishedFilter(
                                            value as PublishedFilter,
                                        );
                                        table.setPage(1);
                                    }}
                                    options={publishedFilterOptions}
                                    placeholder={t(
                                        'tenants.filter_all_visibility',
                                    )}
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
                        rowKey={(row) => row.id}
                        sort={table.sort}
                        onSort={table.toggleSort}
                        actions={actions}
                        emptyMessage={t('tenants.empty')}
                    />
                </TableCard>
            </div>

            <TenantFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                tenant={editing}
                statuses={statuses}
            />

            <BaseModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={t('tenants.delete_title')}
                description={
                    deleteTarget
                        ? t('tenants.delete_confirm', {
                              name: deleteTarget.nombre_comercial,
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

TenantsIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(
                props.translations as TranslationTree,
                'nav.saas',
            ),
            href: '/restaurantes',
        },
        {
            title: translate(
                props.translations as TranslationTree,
                'tenants.title',
            ),
            href: '/restaurantes',
        },
    ],
});
