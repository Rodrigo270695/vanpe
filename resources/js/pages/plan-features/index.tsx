import { Head, router } from '@inertiajs/react';
import { Download, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { SearchInput } from '@/components/common/search-input';
import { StatusPill } from '@/components/common/status-pill';
import { TableCard } from '@/components/common/table-card';
import { TableRowActions } from '@/components/common/table-row-actions';
import { PlanFeatureFormModal } from '@/components/plan-features/plan-feature-form-modal';
import type {
    FeatureCatalogItem,
    PlanFeatureAbilities,
    PlanFeatureRow,
    PlanOption,
} from '@/components/plan-features/types';
import { Button } from '@/components/ui/button';
import { useClientTable } from '@/hooks/use-client-table';
import { useTranslations } from '@/hooks/use-translations';
import { downloadXlsx } from '@/lib/export-xlsx';
import { translate, type TranslationTree } from '@/lib/i18n';

type PlanFeaturesPageProps = {
    features: PlanFeatureRow[];
    plans: PlanOption[];
    catalog: FeatureCatalogItem[];
    can: PlanFeatureAbilities;
};

export default function PlanFeaturesIndex({
    features,
    plans,
    catalog,
    can,
}: PlanFeaturesPageProps) {
    const { t, locale } = useTranslations();

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<PlanFeatureRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PlanFeatureRow | null>(
        null,
    );
    const [deleting, setDeleting] = useState(false);

    const table = useClientTable(features, {
        searchable: ['plan_name', 'plan_code', 'feature', 'feature_label'],
        initialSort: { key: 'plan_name', dir: 'asc' },
    });

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (row: PlanFeatureRow) => {
        setEditing(row);
        setFormOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/plan-features/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    const exportExcel = async () => {
        const q = table.search.trim().toLowerCase();
        const rows = q
            ? features.filter((row) =>
                  [row.plan_name, row.plan_code, row.feature, row.feature_label]
                      .join(' ')
                      .toLowerCase()
                      .includes(q),
              )
            : features;

        await downloadXlsx(
            'plan-features-vanpe.xlsx',
            'Features',
            rows,
            [
                {
                    header: t('plan_features.col_plan'),
                    width: 20,
                    value: (r) => r.plan_name ?? '',
                },
                {
                    header: t('plans.col_code'),
                    width: 14,
                    value: (r) => r.plan_code ?? '',
                },
                {
                    header: t('plan_features.col_feature'),
                    width: 24,
                    value: (r) => r.feature_label,
                },
                {
                    header: t('plan_features.col_value'),
                    width: 14,
                    value: (r) => r.display_value,
                },
            ],
            {
                title: t('plan_features.title'),
                subtitle: `${t('plan_features.description')} · ${new Date().toLocaleString(locale)}`,
            },
        );
    };

    const columns: DataTableColumn<PlanFeatureRow>[] = useMemo(
        () => [
            {
                key: 'plan_name',
                header: t('plan_features.col_plan'),
                sortable: true,
                render: (row) => (
                    <div>
                        <span className="text-[13px] font-medium text-foreground">
                            {row.plan_name}
                        </span>
                        <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                            {row.plan_code}
                        </span>
                    </div>
                ),
            },
            {
                key: 'feature_label',
                header: t('plan_features.col_feature'),
                sortable: true,
                render: (row) => (
                    <span className="text-[13px] text-muted-foreground">
                        {row.feature_label}
                    </span>
                ),
            },
            {
                key: 'display_value',
                header: t('plan_features.col_value'),
                sortable: true,
                render: (row) => (
                    <StatusPill variant="blue">{row.display_value}</StatusPill>
                ),
            },
        ],
        [t],
    );

    const actions = (row: PlanFeatureRow) => (
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
            <Head title={t('plan_features.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('plan_features.title')}
                    description={t('plan_features.description')}
                    badges={[
                        {
                            label: t('plan_features.title'),
                            value: features.length,
                            color: 'blue',
                            icon: ListChecks,
                        },
                        {
                            label: t('nav.plans'),
                            value: plans.length,
                            color: 'purple',
                            icon: ListChecks,
                        },
                    ]}
                    action={
                        can.create
                            ? {
                                  label: t('plan_features.new'),
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
                        {t('plan_features.export_excel')}
                    </Button>
                </PageHeader>

                <TableCard
                    flush
                    toolbar={
                        <SearchInput
                            value={table.search}
                            onChange={table.setSearch}
                            placeholder={t('plan_features.search_placeholder')}
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
                        emptyMessage={t('plan_features.empty')}
                    />
                </TableCard>
            </div>

            <PlanFeatureFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                feature={editing}
                plans={plans}
                catalog={catalog}
            />

            <BaseModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={t('plan_features.delete_title')}
                description={
                    deleteTarget
                        ? t('plan_features.delete_confirm', {
                              feature: deleteTarget.feature_label,
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

PlanFeaturesIndex.layout = (props) => ({
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
                'plan_features.title',
            ),
            href: '/plan-features',
        },
    ],
});
