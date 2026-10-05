import { Head, router } from '@inertiajs/react';
import { BedDouble, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { DataTable  } from '@/components/common/data-table';
import type {DataTableColumn} from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { SearchInput } from '@/components/common/search-input';
import { StatusPill } from '@/components/common/status-pill';
import { TableCard } from '@/components/common/table-card';
import { TableRowActions } from '@/components/common/table-row-actions';
import { HotelFormModal } from '@/components/hotels/hotel-form-modal';
import type {
    GeoOption,
    HotelAbilities,
    HotelLimits,
    HotelOptions,
    HotelRow,
} from '@/components/hotels/types';
import { useClientTable } from '@/hooks/use-client-table';
import { useTranslations } from '@/hooks/use-translations';
import { translate  } from '@/lib/i18n';
import type {TranslationTree} from '@/lib/i18n';

type HotelsPageProps = {
    hotels: HotelRow[];
    departamentos: GeoOption[];
    options: HotelOptions;
    limits: HotelLimits;
    can: HotelAbilities;
    mapbox_token: string | null;
};

function formatPrice(value: number | null): string | null {
    if (value === null) {
return null;
}

    return `S/ ${value.toLocaleString('es-PE', { maximumFractionDigits: 2 })}`;
}

export default function HotelsIndex({
    hotels,
    departamentos,
    options,
    limits,
    can,
    mapbox_token,
}: HotelsPageProps) {
    const { t } = useTranslations();

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<HotelRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<HotelRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const table = useClientTable(hotels, {
        searchable: [
            'nombre',
            'slug',
            'ruc',
            'direccion',
            'distrito_name',
            'provincia_name',
            'departamento_name',
        ],
        initialSort: { key: 'nombre', dir: 'asc' },
    });

    const publishedCount = hotels.filter((h) => h.estado === 'publicado').length;
    const featuredCount = hotels.filter((h) => h.destacado).length;

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (row: HotelRow) => {
        setEditing(row);
        setFormOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
return;
}

        setDeleting(true);
        router.delete(`/hoteles/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    const statusVariant = (estado: string) => {
        if (estado === 'publicado') {
return 'blue' as const;
}

        if (estado === 'archivado') {
return 'muted' as const;
}

        return 'neutral' as const;
    };

    const columns: DataTableColumn<HotelRow>[] = useMemo(
        () => [
            {
                key: 'nombre',
                header: t('hotels.col_name'),
                sortable: true,
                render: (row) => (
                    <div className="flex items-center gap-2.5">
                        {row.imagen_portada_url ? (
                            <img
                                src={row.imagen_portada_url}
                                alt=""
                                className="size-8 shrink-0 rounded-full object-cover"
                            />
                        ) : (
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                                <BedDouble className="size-4.5" />
                            </span>
                        )}
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate font-medium text-foreground">
                                {row.nombre}
                                {row.destacado && (
                                    <Star className="size-3.5 fill-brand-orange text-brand-orange" />
                                )}
                            </div>
                            <span className="block truncate text-xs text-muted-foreground">
                                {row.tenant_slug
                                    ? t('hotels.owner_panel', {
                                          slug: row.tenant_slug,
                                      })
                                    : (row.telefono_reservas ?? '—')}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'ruc',
                header: t('hotels.col_ruc'),
                sortable: true,
                render: (row) => (
                    <span className="font-mono text-[13px] text-muted-foreground">
                        {row.ruc ?? '—'}
                    </span>
                ),
            },
            {
                key: 'distrito_name',
                header: t('hotels.col_location'),
                sortable: true,
                render: (row) => (
                    <span className="text-[13px] text-muted-foreground">
                        {[row.distrito_name, row.provincia_name, row.departamento_name]
                            .filter(Boolean)
                            .join(', ') || row.direccion}
                    </span>
                ),
            },
            {
                key: 'clasificacion',
                header: t('hotels.col_classification'),
                sortable: true,
                render: (row) => {
                    const stars = Number.parseInt(row.clasificacion, 10);

                    return Number.isFinite(stars) && stars > 0 ? (
                        <span className="flex items-center gap-0.5 text-brand-orange">
                            {Array.from({ length: stars }).map((_, i) => (
                                <Star key={i} className="size-3.5 fill-current" />
                            ))}
                        </span>
                    ) : (
                        <span className="text-[12px] text-muted-foreground">
                            {t(`hotels.clasificacion_${row.clasificacion}`)}
                        </span>
                    );
                },
            },
            {
                key: 'precio_desde',
                header: t('hotels.col_prices'),
                sortable: true,
                render: (row) => {
                    const range = [formatPrice(row.precio_desde), formatPrice(row.precio_hasta)]
                        .filter(Boolean)
                        .join(' – ');

                    return (
                        <span className="text-[13px] text-muted-foreground">
                            {range || t('hotels.no_prices')}
                        </span>
                    );
                },
            },
            {
                key: 'estado',
                header: t('hotels.col_status'),
                sortable: true,
                render: (row) => (
                    <StatusPill variant={statusVariant(row.estado)}>
                        {t(`hotels.estado_${row.estado}`)}
                    </StatusPill>
                ),
            },
        ],
        [t],
    );

    const actions = (row: HotelRow) => (
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
            <Head title={t('hotels.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('hotels.title')}
                    description={t('hotels.description')}
                    badges={[
                        {
                            label: t('hotels.badge_total'),
                            value: hotels.length,
                            color: 'blue',
                            icon: BedDouble,
                        },
                        {
                            label: t('hotels.badge_published'),
                            value: publishedCount,
                            color: 'green',
                            icon: BedDouble,
                        },
                        {
                            label: t('hotels.badge_featured'),
                            value: featuredCount,
                            color: 'orange',
                            icon: Star,
                        },
                    ]}
                    action={
                        can.create
                            ? {
                                  label: t('hotels.new'),
                                  onClick: openCreate,
                                  icon: Plus,
                              }
                            : undefined
                    }
                />

                <TableCard
                    flush
                    toolbar={
                        <SearchInput
                            value={table.search}
                            onChange={table.setSearch}
                            placeholder={t('hotels.search_placeholder')}
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
                        actions={actions}
                        emptyMessage={t('hotels.empty')}
                    />
                </TableCard>
            </div>

            <HotelFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                hotel={editing}
                departamentos={departamentos}
                options={options}
                limits={limits}
                canPublish={can.publish}
                mapboxToken={mapbox_token}
            />

            <BaseModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={t('hotels.delete_title')}
                description={
                    deleteTarget
                        ? t('hotels.delete_confirm', { name: deleteTarget.nombre })
                        : ''
                }
                submitLabel={t('common.delete')}
                submitVariant="destructive"
                onSubmit={confirmDelete}
                submitting={deleting}
            >
                {null}
            </BaseModal>
        </>
    );
}

HotelsIndex.layout = (props: { translations: TranslationTree }) => ({
    breadcrumbs: [
        {
            title: translate(props.translations, 'nav.saas'),
            href: '/planes',
        },
        {
            title: translate(props.translations, 'hotels.title'),
            href: '/hoteles',
        },
    ],
});
