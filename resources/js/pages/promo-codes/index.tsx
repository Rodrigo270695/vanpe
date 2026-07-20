import { Head, router } from '@inertiajs/react';
import { Download, Pencil, Plus, TicketPercent, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { SearchInput } from '@/components/common/search-input';
import { StatusPill } from '@/components/common/status-pill';
import { TableCard } from '@/components/common/table-card';
import { TableRowActions } from '@/components/common/table-row-actions';
import { PromoCodeFormModal } from '@/components/promo-codes/promo-code-form-modal';
import type {
    PromoCodeAbilities,
    PromoCodeRow,
} from '@/components/promo-codes/types';
import { Button } from '@/components/ui/button';
import { useClientTable } from '@/hooks/use-client-table';
import { useTranslations } from '@/hooks/use-translations';
import { downloadXlsx } from '@/lib/export-xlsx';
import { formatLocaleDate, translate, type TranslationTree } from '@/lib/i18n';

type PromoCodesPageProps = {
    promoCodes: PromoCodeRow[];
    types: string[];
    can: PromoCodeAbilities;
};

export default function PromoCodesIndex({
    promoCodes,
    types,
    can,
}: PromoCodesPageProps) {
    const { t, locale } = useTranslations();

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<PromoCodeRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PromoCodeRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const table = useClientTable(promoCodes, {
        searchable: ['code', 'description'],
        initialSort: { key: 'code', dir: 'asc' },
    });

    const activeCount = promoCodes.filter((row) => row.active).length;
    const validCount = promoCodes.filter((row) => row.is_valid).length;

    const typeLabel = (type: string) =>
        t(`promo_codes.type_${type}` as 'promo_codes.type_percentage');

    const formatValue = (row: PromoCodeRow) => {
        if (row.type === 'percentage') return `${row.value}%`;
        if (row.type === 'trial_extra') {
            return `${row.value} ${t('promo_codes.days')}`;
        }

        return `S/ ${row.value}`;
    };

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (row: PromoCodeRow) => {
        setEditing(row);
        setFormOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/promo-codes/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    const exportExcel = async () => {
        const q = table.search.trim().toLowerCase();
        const rows = q
            ? promoCodes.filter((row) =>
                  [row.code, row.description]
                      .join(' ')
                      .toLowerCase()
                      .includes(q),
              )
            : promoCodes;

        await downloadXlsx(
            'promo-codes-vanpe.xlsx',
            'Promos',
            rows,
            [
                { header: t('promo_codes.col_code'), width: 16, value: (r) => r.code },
                {
                    header: t('promo_codes.col_type'),
                    width: 16,
                    value: (r) => typeLabel(r.type),
                },
                {
                    header: t('promo_codes.col_value'),
                    width: 12,
                    value: (r) => formatValue(r),
                },
                {
                    header: t('promo_codes.col_uses'),
                    width: 12,
                    value: (r) =>
                        r.max_uses !== null
                            ? `${r.uses}/${r.max_uses}`
                            : String(r.uses),
                },
                {
                    header: t('promo_codes.col_validity'),
                    width: 22,
                    value: (r) =>
                        [r.valid_from, r.valid_until].filter(Boolean).join(' → ') ||
                        '—',
                },
            ],
            {
                title: t('promo_codes.title'),
                subtitle: new Date().toLocaleString(locale),
            },
        );
    };

    const columns: DataTableColumn<PromoCodeRow>[] = useMemo(
        () => [
            {
                key: 'code',
                header: t('promo_codes.col_code'),
                sortable: true,
                render: (row) => (
                    <span className="font-mono text-[13px] font-semibold text-brand-blue">
                        {row.code}
                    </span>
                ),
            },
            {
                key: 'type',
                header: t('promo_codes.col_type'),
                sortable: true,
                render: (row) => (
                    <span className="text-[13px] text-muted-foreground">
                        {typeLabel(row.type)}
                    </span>
                ),
            },
            {
                key: 'value',
                header: t('promo_codes.col_value'),
                sortable: true,
                render: (row) => (
                    <StatusPill variant="blue">{formatValue(row)}</StatusPill>
                ),
            },
            {
                key: 'uses',
                header: t('promo_codes.col_uses'),
                sortable: true,
                render: (row) => (
                    <span className="text-[13px] tabular-nums text-muted-foreground">
                        {row.max_uses !== null
                            ? `${row.uses}/${row.max_uses}`
                            : row.uses}
                    </span>
                ),
            },
            {
                key: 'valid_until',
                header: t('promo_codes.col_validity'),
                sortable: true,
                render: (row) => (
                    <span className="text-[12px] text-muted-foreground">
                        {row.valid_from || row.valid_until
                            ? `${row.valid_from ? formatLocaleDate(row.valid_from, locale) : '…'} → ${row.valid_until ? formatLocaleDate(row.valid_until, locale) : '…'}`
                            : '—'}
                    </span>
                ),
            },
            {
                key: 'active',
                header: t('promo_codes.col_status'),
                render: (row) => (
                    <StatusPill
                        variant={
                            row.is_valid
                                ? 'blue'
                                : row.active
                                  ? 'neutral'
                                  : 'muted'
                        }
                    >
                        {row.is_valid
                            ? t('promo_codes.status_valid')
                            : row.active
                              ? t('promo_codes.status_inactive_window')
                              : t('promo_codes.status_disabled')}
                    </StatusPill>
                ),
            },
        ],
        [locale, t],
    );

    const actions = (row: PromoCodeRow) => (
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
            <Head title={t('promo_codes.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('promo_codes.title')}
                    description={t('promo_codes.description')}
                    badges={[
                        {
                            label: t('promo_codes.badge_total'),
                            value: promoCodes.length,
                            color: 'blue',
                            icon: TicketPercent,
                        },
                        {
                            label: t('promo_codes.badge_active'),
                            value: activeCount,
                            color: 'teal',
                            icon: TicketPercent,
                        },
                        {
                            label: t('promo_codes.badge_valid'),
                            value: validCount,
                            color: 'green',
                            icon: TicketPercent,
                        },
                    ]}
                    action={
                        can.create
                            ? {
                                  label: t('promo_codes.new'),
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
                        {t('promo_codes.export_excel')}
                    </Button>
                </PageHeader>

                <TableCard
                    flush
                    toolbar={
                        <SearchInput
                            value={table.search}
                            onChange={table.setSearch}
                            placeholder={t('promo_codes.search_placeholder')}
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
                        emptyMessage={t('promo_codes.empty')}
                    />
                </TableCard>
            </div>

            <PromoCodeFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                promoCode={editing}
                types={types}
            />

            <BaseModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={t('promo_codes.delete_title')}
                description={
                    deleteTarget
                        ? t('promo_codes.delete_confirm', {
                              code: deleteTarget.code,
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

PromoCodesIndex.layout = (props) => ({
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
                'promo_codes.title',
            ),
            href: '/promo-codes',
        },
    ],
});
