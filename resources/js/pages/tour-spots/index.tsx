import { Head, router } from '@inertiajs/react';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { SearchInput } from '@/components/common/search-input';
import { StatusPill } from '@/components/common/status-pill';
import { TableCard } from '@/components/common/table-card';
import { TableRowActions } from '@/components/common/table-row-actions';
import { TourSpotFormModal } from '@/components/tour-spots/tour-spot-form-modal';
import type {
    CatalogOption,
    GeoOption,
    TourCategoryOption,
    TourSpotAbilities,
    TourSpotHourRow,
    TourSpotRow,
} from '@/components/tour-spots/types';
import { useClientTable } from '@/hooks/use-client-table';
import { useTranslations } from '@/hooks/use-translations';
import { translate, type TranslationTree } from '@/lib/i18n';

type TourSpotsPageProps = {
    spots: TourSpotRow[];
    categories: TourCategoryOption[];
    accessModes: CatalogOption[];
    roadTypes: CatalogOption[];
    inclusions: CatalogOption[];
    departamentos: GeoOption[];
    defaultHours: TourSpotHourRow[];
    estados: string[];
    dificultades: string[];
    estacionamientos: string[];
    can: TourSpotAbilities;
};

export default function TourSpotsIndex({
    spots,
    categories: initialCategories,
    accessModes: initialAccessModes,
    roadTypes: initialRoadTypes,
    inclusions: initialInclusions,
    departamentos,
    defaultHours,
    estados,
    dificultades,
    estacionamientos,
    can,
}: TourSpotsPageProps) {
    const { t } = useTranslations();

    const [categories, setCategories] = useState(initialCategories);
    const [accessModes, setAccessModes] = useState(initialAccessModes);
    const [roadTypes, setRoadTypes] = useState(initialRoadTypes);
    const [inclusions, setInclusions] = useState(initialInclusions);

    useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories]);

    useEffect(() => {
        setAccessModes(initialAccessModes);
    }, [initialAccessModes]);

    useEffect(() => {
        setRoadTypes(initialRoadTypes);
    }, [initialRoadTypes]);

    useEffect(() => {
        setInclusions(initialInclusions);
    }, [initialInclusions]);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<TourSpotRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<TourSpotRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const table = useClientTable(spots, {
        searchable: [
            'nombre',
            'slug',
            'distrito_name',
            'provincia_name',
            'departamento_name',
            'primary_category_name',
        ],
        initialSort: { key: 'nombre', dir: 'asc' },
    });

    const publishedCount = spots.filter((s) => s.estado === 'publicado').length;
    const featuredCount = spots.filter((s) => s.destacado).length;

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (row: TourSpotRow) => {
        setEditing(row);
        setFormOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/centros-turisticos/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    const statusVariant = (estado: string) => {
        if (estado === 'publicado') return 'blue' as const;
        if (estado === 'pausado') return 'neutral' as const;
        if (estado === 'archivado') return 'muted' as const;
        return 'neutral' as const;
    };

    const columns: DataTableColumn<TourSpotRow>[] = useMemo(
        () => [
            {
                key: 'nombre',
                header: t('tour_spots.col_name'),
                sortable: true,
                render: (row) => (
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                            <MapPin className="size-4.5" />
                        </span>
                        <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">
                                {row.nombre}
                            </div>
                            <span className="truncate text-xs text-muted-foreground">
                                {row.slug}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'distrito_name',
                header: t('tour_spots.col_location'),
                sortable: true,
                render: (row) => (
                    <span className="text-[13px] text-muted-foreground">
                        {[row.distrito_name, row.provincia_name, row.departamento_name]
                            .filter(Boolean)
                            .join(', ') || '—'}
                    </span>
                ),
            },
            {
                key: 'primary_category_name',
                header: t('tour_spots.col_category'),
                sortable: true,
                render: (row) => (
                    <span className="text-[13px] text-muted-foreground">
                        {row.primary_category_name || '—'}
                    </span>
                ),
            },
            {
                key: 'estado',
                header: t('tour_spots.col_status'),
                sortable: true,
                render: (row) => (
                    <StatusPill variant={statusVariant(row.estado)}>
                        {t(
                            `tour_spots.estado_${row.estado}` as 'tour_spots.estado_borrador',
                        )}
                    </StatusPill>
                ),
            },
            {
                key: 'destacado',
                header: t('tour_spots.col_featured'),
                render: (row) =>
                    row.destacado ? (
                        <StatusPill variant="blue">
                            <span className="inline-flex items-center gap-1">
                                <Star className="size-3" />
                                {t('tour_spots.featured_yes')}
                            </span>
                        </StatusPill>
                    ) : (
                        <span className="text-[13px] text-muted-foreground">
                            {t('tour_spots.featured_no')}
                        </span>
                    ),
            },
        ],
        [t],
    );

    const actions = (row: TourSpotRow) => (
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
            <Head title={t('tour_spots.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('tour_spots.title')}
                    description={t('tour_spots.description')}
                    badges={[
                        {
                            label: t('tour_spots.badge_total'),
                            value: spots.length,
                            color: 'blue',
                            icon: MapPin,
                        },
                        {
                            label: t('tour_spots.badge_published'),
                            value: publishedCount,
                            color: 'green',
                            icon: MapPin,
                        },
                        {
                            label: t('tour_spots.badge_featured'),
                            value: featuredCount,
                            color: 'orange',
                            icon: Star,
                        },
                    ]}
                    action={
                        can.create
                            ? {
                                  label: t('tour_spots.new'),
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
                            placeholder={t('tour_spots.search_placeholder')}
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
                        emptyMessage={t('tour_spots.empty')}
                    />
                </TableCard>
            </div>

            <TourSpotFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                spot={editing}
                categories={categories}
                accessModes={accessModes}
                roadTypes={roadTypes}
                inclusions={inclusions}
                departamentos={departamentos}
                defaultHours={defaultHours}
                estados={estados}
                dificultades={dificultades}
                estacionamientos={estacionamientos}
                canPublish={can.publish}
                onCategoriesChange={setCategories}
                onAccessModesChange={setAccessModes}
                onRoadTypesChange={setRoadTypes}
                onInclusionsChange={setInclusions}
            />

            <BaseModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={t('tour_spots.delete_title')}
                description={
                    deleteTarget
                        ? t('tour_spots.delete_confirm', {
                              name: deleteTarget.nombre,
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

TourSpotsIndex.layout = (props) => ({
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
                'tour_spots.title',
            ),
            href: '/centros-turisticos',
        },
    ],
});
