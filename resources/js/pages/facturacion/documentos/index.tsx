import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    FileText,
    RefreshCw,
    Search,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FelDocumentSummary } from '@/components/fel/types';
import { FelDocumentBadges } from '@/components/fel/fel-document-badges';
import { FelDocumentDownloadMenu } from '@/components/fel/fel-document-download-menu';
import { FelCpeModal } from '@/components/fel/fel-cpe-modal';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { SearchInput } from '@/components/common/search-input';
import { TableCard } from '@/components/common/table-card';
import { TableFilterSelect } from '@/components/common/table-filter-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClientTable } from '@/hooks/use-client-table';
import { useTranslations } from '@/hooks/use-translations';
import { formatCajaDate, formatCajaMoney, formatCajaTime } from '@/lib/caja-format';
import { parseIsoTimestamp } from '@/lib/datetime';
import { translate, type TranslationTree } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type FelDocumentRow = FelDocumentSummary & {
    tipo_comprobante: number;
    tipo_label: string;
    receptor_nombre: string | null;
    receptor_num_doc: string | null;
    total: number;
    sale: { id: string; numero: string } | null;
};

type FelDocumentsPaginator = {
    data: FelDocumentRow[];
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
    meta?: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
};

type FacturacionDocumentosPageProps = {
    documents: FelDocumentsPaginator;
    filters: {
        search: string;
        estado: string;
    };
    can: {
        reemit: boolean;
    };
};

export default function FacturacionDocumentosIndex({
    documents,
    filters,
    can,
}: FacturacionDocumentosPageProps) {
    const { t, locale, timezone } = useTranslations();
    const [cpePreview, setCpePreview] = useState<FelDocumentRow | null>(null);
    const [reemittingId, setReemittingId] = useState<string | null>(null);

    const rows = documents.data;
    const page = documents.meta?.current_page ?? documents.current_page ?? 1;
    const perPage = documents.meta?.per_page ?? documents.per_page ?? 20;
    const total = documents.meta?.total ?? documents.total ?? 0;

    const table = useClientTable(rows, {
        searchable: (row) =>
            [
                row.numero_completo,
                row.receptor_nombre,
                row.receptor_num_doc,
                row.sale?.numero,
                row.tipo_label,
                row.estado,
                row.error_mensaje,
            ]
                .filter(Boolean)
                .join(' '),
        initialPerPage: perPage,
        initialSort: { key: 'sort_at', dir: 'desc' },
        sortAccessor: (row, key) => {
            if (key === 'sort_at' || key === 'emitido_at' || key === 'created_at') {
                return parseIsoTimestamp(
                    key === 'sort_at'
                        ? row.sort_at ?? row.emitido_at ?? row.created_at
                        : row[key as keyof FelDocumentRow] as string | null,
                );
            }

            return (row as Record<string, string | number | null | undefined>)[key];
        },
    });

    const estadoOptions = useMemo(
        () => [
            { value: 'todos', label: t('fel.filter_all'), icon: FileText, tone: 'muted' as const },
            { value: 'emitido', label: t('fel.status_emitido'), icon: CheckCircle2, tone: 'green' as const },
            { value: 'rechazado', label: t('fel.status_rechazado'), icon: XCircle, tone: 'red' as const },
            { value: 'pendiente', label: t('fel.status_pendiente'), icon: FileText, tone: 'yellow' as const },
            { value: 'anulado', label: t('fel.status_anulado'), icon: XCircle, tone: 'gray' as const },
        ],
        [t],
    );

    const applyFilters = (next: Partial<typeof filters>) => {
        router.get(
            '/facturacion/documentos',
            {
                search: next.search ?? filters.search,
                estado: next.estado ?? filters.estado,
                page: 1,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const goToPage = (nextPage: number) => {
        router.get(
            '/facturacion/documentos',
            {
                search: filters.search,
                estado: filters.estado,
                page: nextPage,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const reemit = (row: FelDocumentRow) => {
        setReemittingId(row.id);
        router.post(
            `/facturacion/documentos/${row.id}/reemitir`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setReemittingId(null),
            },
        );
    };

    const columns: DataTableColumn<FelDocumentRow>[] = useMemo(
        () => [
            {
                key: 'numero_completo',
                header: t('fel.col_number'),
                render: (row) => (
                    <div className="space-y-1">
                        <span className="font-mono font-semibold">{row.numero_completo}</span>
                        <FelDocumentBadges document={row} compact />
                    </div>
                ),
            },
            {
                key: 'tipo_label',
                header: t('fel.col_type'),
                render: (row) => row.tipo_label,
            },
            {
                key: 'receptor_nombre',
                header: t('fel.col_customer'),
                render: (row) => (
                    <div className="min-w-0">
                        <p className="truncate">{row.receptor_nombre ?? '—'}</p>
                        {row.receptor_num_doc ? (
                            <p className="text-xs text-muted-foreground">{row.receptor_num_doc}</p>
                        ) : null}
                    </div>
                ),
            },
            {
                key: 'total',
                header: t('fel.col_total'),
                sortable: true,
                align: 'right',
                render: (row) => formatCajaMoney(row.total, 'PEN'),
            },
            {
                key: 'estado',
                header: t('fel.col_status'),
                render: (row) => (
                    <div className="space-y-1.5">
                        <Badge
                            variant="outline"
                            className={cn(
                                row.estado === 'emitido' &&
                                    'border-emerald-200 bg-emerald-50 text-emerald-700',
                                row.estado === 'rechazado' &&
                                    'border-red-200 bg-red-50 text-red-700',
                                row.estado === 'pendiente' &&
                                    'border-amber-200 bg-amber-50 text-amber-700',
                            )}
                        >
                            {t(`fel.status_${row.estado}` as 'fel.status_emitido')}
                        </Badge>
                        {row.estado === 'rechazado' && row.error_mensaje ? (
                            <p
                                className="max-w-xs text-xs leading-snug text-red-700"
                                title={row.error_mensaje}
                            >
                                {row.error_mensaje}
                            </p>
                        ) : null}
                    </div>
                ),
            },
            {
                key: 'sort_at',
                sortKey: 'sort_at',
                header: t('fel.col_date'),
                sortable: true,
                render: (row) => {
                    const dateIso = row.sort_at ?? row.emitido_at ?? row.created_at;

                    return dateIso ? (
                        <div>
                            <div className="font-medium">
                                {formatCajaDate(dateIso, locale, timezone)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {formatCajaTime(dateIso, locale, timezone)}
                            </div>
                        </div>
                    ) : (
                        '—'
                    );
                },
            },
        ],
        [t, locale, timezone],
    );

    const actions = (row: FelDocumentRow) => (
        <div className="flex items-center justify-end gap-1">
            {can.reemit && row.can_reemit ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
                    disabled={reemittingId === row.id}
                    onClick={() => reemit(row)}
                >
                    <RefreshCw
                        className={cn('size-3.5', reemittingId === row.id && 'animate-spin')}
                    />
                    {t('fel.action_reemit')}
                </Button>
            ) : null}
            <FelDocumentDownloadMenu
                document={row}
                saleId={row.sale?.id}
                onViewCpe={() => setCpePreview(row)}
                showViewCpe={row.estado === 'emitido'}
            />
        </div>
    );

    const emitidos = rows.filter((r) => r.estado === 'emitido').length;
    const rechazados = rows.filter((r) => r.estado === 'rechazado').length;

    return (
        <>
            <Head title={t('fel.documents_page_title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('fel.documents_page_title')}
                    description={t('fel.documents_page_description')}
                    badges={[
                        {
                            label: t('fel.documents_total'),
                            value: total,
                            color: 'blue',
                            icon: FileText,
                        },
                        {
                            label: t('fel.documents_issued'),
                            value: emitidos,
                            color: 'green',
                            icon: CheckCircle2,
                        },
                        ...(rechazados > 0
                            ? [
                                  {
                                      label: t('fel.documents_rejected'),
                                      value: rechazados,
                                      color: 'red' as const,
                                      icon: AlertTriangle,
                                  },
                              ]
                            : []),
                    ]}
                />

                {rechazados > 0 && filters.estado !== 'rechazado' ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="size-4 shrink-0" />
                            <span>{t('fel.documents_rejected_banner', { count: rechazados })}</span>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-red-200 bg-white text-red-700 hover:bg-red-50"
                            onClick={() => applyFilters({ estado: 'rechazado' })}
                        >
                            {t('fel.documents_view_rejected')}
                        </Button>
                    </div>
                ) : null}

                <TableCard
                    toolbar={
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <SearchInput
                                value={filters.search}
                                onChange={(search) => applyFilters({ search })}
                                placeholder={t('fel.search_placeholder')}
                                className="sm:max-w-xs"
                            />
                            <TableFilterSelect
                                value={filters.estado}
                                onChange={(estado) => applyFilters({ estado })}
                                options={estadoOptions}
                                placeholder={t('fel.filter_status')}
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
                        emptyMessage={t('fel.documents_empty')}
                    />
                </TableCard>
            </div>

            {cpePreview ? (
                <FelCpeModal
                    open={cpePreview !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setCpePreview(null);
                        }
                    }}
                    document={cpePreview}
                    documentType={
                        cpePreview.tipo_comprobante === 1 ? 'factura' : 'boleta'
                    }
                />
            ) : null}
        </>
    );
}

FacturacionDocumentosIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(props.translations as TranslationTree, 'nav.facturacion'),
            href: '/facturacion/documentos',
        },
        {
            title: translate(props.translations as TranslationTree, 'fel.documents_page_title'),
            href: '/facturacion/documentos',
        },
    ],
});
