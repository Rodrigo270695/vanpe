import { Head, router } from '@inertiajs/react';
import {
    LayoutGrid,
    Pencil,
    Plus,
    Trash2,
    Utensils,
    UtensilsCrossed,
} from 'lucide-react';
import { useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { PageHeader } from '@/components/common/page-header';
import { StatusPill } from '@/components/common/status-pill';
import { AreaFormModal } from '@/components/mesas/area-form-modal';
import { MesaTableCard } from '@/components/mesas/mesa-table-card';
import { TableFormModal } from '@/components/mesas/table-form-modal';
import type {
    AreaRow,
    MesasAbilities,
    MesasStats,
    TableRow,
} from '@/components/mesas/types';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';
import { translate, type TranslationTree } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type MesasPageProps = {
    areas: AreaRow[];
    statuses: string[];
    shapes: string[];
    stats: MesasStats;
    can: MesasAbilities;
};

const areaThemes = [
    {
        section: 'border-brand-blue/15',
        header: 'border-b border-white/60 bg-gradient-to-r from-brand-blue/12 via-sky-50/80 to-brand-orange/8',
        icon: 'bg-brand-blue/12 text-brand-blue ring-brand-blue/20',
    },
    {
        section: 'border-teal-200/60',
        header: 'border-b border-white/60 bg-gradient-to-r from-teal-500/10 via-cyan-50/80 to-emerald-500/8',
        icon: 'bg-teal-100 text-teal-700 ring-teal-200/80',
    },
    {
        section: 'border-violet-200/60',
        header: 'border-b border-white/60 bg-gradient-to-r from-violet-500/10 via-purple-50/80 to-fuchsia-500/8',
        icon: 'bg-violet-100 text-violet-700 ring-violet-200/80',
    },
    {
        section: 'border-amber-200/60',
        header: 'border-b border-white/60 bg-gradient-to-r from-amber-500/10 via-orange-50/80 to-yellow-500/8',
        icon: 'bg-amber-100 text-amber-800 ring-amber-200/80',
    },
] as const;

export default function MesasIndex({
    areas,
    statuses,
    stats,
    can,
}: MesasPageProps) {
    const { t } = useTranslations();

    const [areaFormOpen, setAreaFormOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<AreaRow | null>(null);
    const [deleteAreaTarget, setDeleteAreaTarget] = useState<AreaRow | null>(null);

    const [tableFormOpen, setTableFormOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<TableRow | null>(null);
    const [defaultAreaId, setDefaultAreaId] = useState<string | undefined>();
    const [deleteTableTarget, setDeleteTableTarget] = useState<TableRow | null>(
        null,
    );
    const [deleting, setDeleting] = useState(false);

    const statusLabel = (status: string) =>
        t(`mesas.status_${status}` as 'mesas.status_free');

    const openCreateArea = () => {
        setEditingArea(null);
        setAreaFormOpen(true);
    };

    const openEditArea = (area: AreaRow) => {
        setEditingArea(area);
        setAreaFormOpen(true);
    };

    const openCreateTable = (areaId?: string) => {
        setEditingTable(null);
        setDefaultAreaId(areaId);
        setTableFormOpen(true);
    };

    const openEditTable = (table: TableRow) => {
        setEditingTable(table);
        setDefaultAreaId(undefined);
        setTableFormOpen(true);
    };

    const confirmDeleteArea = () => {
        if (!deleteAreaTarget) return;
        setDeleting(true);
        router.delete(`/mesas/areas/${deleteAreaTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteAreaTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    const confirmDeleteTable = () => {
        if (!deleteTableTarget) return;
        setDeleting(true);
        router.delete(`/mesas/tables/${deleteTableTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTableTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <>
            <Head title={t('mesas.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('mesas.title')}
                    description={t('mesas.description')}
                    badges={[
                        {
                            label: t('mesas.badge_areas'),
                            value: stats.areas,
                            color: 'blue',
                            icon: LayoutGrid,
                        },
                        {
                            label: t('mesas.badge_tables'),
                            value: stats.tables,
                            color: 'teal',
                            icon: Utensils,
                        },
                        {
                            label: t('mesas.badge_active_tables'),
                            value: stats.active_tables,
                            color: 'green',
                            icon: UtensilsCrossed,
                        },
                    ]}
                    action={
                        can.manage
                            ? {
                                  label: t('mesas.new_area'),
                                  onClick: openCreateArea,
                                  icon: Plus,
                              }
                            : undefined
                    }
                />
            </div>

            {areas.length === 0 ? (
                <div className="mx-4 md:mx-6 overflow-hidden rounded-2xl border border-dashed border-brand-blue/25 bg-gradient-to-br from-brand-blue/[0.06] via-white to-brand-orange/[0.05] p-10 text-center md:mb-6">
                    <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/15">
                        <LayoutGrid className="size-8" />
                    </span>
                    <p className="text-base font-medium text-foreground">
                        {t('mesas.empty')}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('mesas.description')}
                    </p>
                    {can.manage && (
                        <Button
                            className="mt-5 cursor-pointer"
                            onClick={openCreateArea}
                        >
                            <Plus className="size-4" />
                            {t('mesas.new_area')}
                        </Button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-5 px-4 pb-6 md:px-6">
                    {areas.map((area, areaIndex) => {
                        const theme =
                            areaThemes[areaIndex % areaThemes.length];

                        return (
                            <section
                                key={area.id}
                                className={cn(
                                    'overflow-hidden rounded-2xl border bg-card shadow-sm shadow-slate-200/50',
                                    theme.section,
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex flex-wrap items-center justify-between gap-3 px-4 py-3.5',
                                        theme.header,
                                    )}
                                >
                                    <div className="flex min-w-0 items-start gap-3">
                                        <span
                                            className={cn(
                                                'flex size-10 shrink-0 items-center justify-center rounded-xl ring-1',
                                                theme.icon,
                                            )}
                                        >
                                            <LayoutGrid className="size-5" />
                                        </span>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-[15px] font-semibold text-foreground">
                                                    {area.name}
                                                </h2>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-teal-700 ring-1 ring-teal-200/70">
                                                    <Utensils className="size-3" />
                                                    {area.tables.length}
                                                </span>
                                                {!area.active && (
                                                    <StatusPill variant="muted">
                                                        {t('mesas.inactive')}
                                                    </StatusPill>
                                                )}
                                            </div>
                                            {area.description && (
                                                <p className="mt-0.5 text-[12px] text-slate-600">
                                                    {area.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {can.manage && (
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                className="cursor-pointer gap-1.5 border-0 bg-teal-600 text-white shadow-sm shadow-teal-600/25 hover:bg-teal-700"
                                                onClick={() =>
                                                    openCreateTable(area.id)
                                                }
                                            >
                                                <Plus className="size-3.5" />
                                                {t('mesas.new_table')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="cursor-pointer border-brand-blue/25 bg-white/80 text-brand-blue hover:bg-brand-blue/8 hover:text-brand-blue"
                                                onClick={() => openEditArea(area)}
                                            >
                                                <Pencil className="size-3.5" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="cursor-pointer border-red-200 bg-white/80 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                onClick={() =>
                                                    setDeleteAreaTarget(area)
                                                }
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {area.tables.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                                        <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                            <Utensils className="size-5" />
                                        </span>
                                        <p className="text-[13px] text-muted-foreground">
                                            {t('mesas.empty_tables')}
                                        </p>
                                        {can.manage && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-1 cursor-pointer border-teal-200 text-teal-700 hover:bg-teal-50"
                                                onClick={() =>
                                                    openCreateTable(area.id)
                                                }
                                            >
                                                <Plus className="size-3.5" />
                                                {t('mesas.new_table')}
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid gap-3 bg-white/40 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {area.tables.map((table) => (
                                            <MesaTableCard
                                                key={table.id}
                                                table={table}
                                                statusLabel={statusLabel(
                                                    table.status,
                                                )}
                                                capacityLabel={t(
                                                    'mesas.capacity_label',
                                                    {
                                                        count: table.capacity,
                                                    },
                                                )}
                                                inactiveLabel={t(
                                                    'mesas.inactive',
                                                )}
                                                canManage={can.manage}
                                                onEdit={() =>
                                                    openEditTable(table)
                                                }
                                                onDelete={() =>
                                                    setDeleteTableTarget(table)
                                                }
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}

            <AreaFormModal
                open={areaFormOpen}
                onOpenChange={setAreaFormOpen}
                area={editingArea}
            />

            <TableFormModal
                open={tableFormOpen}
                onOpenChange={setTableFormOpen}
                table={editingTable}
                areas={areas}
                statuses={statuses}
                defaultAreaId={defaultAreaId}
            />

            <BaseModal
                open={deleteAreaTarget !== null}
                onOpenChange={(open) => !open && setDeleteAreaTarget(null)}
                title={t('mesas.delete_area_title')}
                description={
                    deleteAreaTarget
                        ? t('mesas.delete_area_confirm', {
                              name: deleteAreaTarget.name,
                          })
                        : ''
                }
                submitLabel={t('common.delete')}
                submitVariant="destructive"
                onSubmit={confirmDeleteArea}
                submitting={deleting}
            />

            <BaseModal
                open={deleteTableTarget !== null}
                onOpenChange={(open) => !open && setDeleteTableTarget(null)}
                title={t('mesas.delete_table_title')}
                description={
                    deleteTableTarget
                        ? t('mesas.delete_table_confirm', {
                              number: deleteTableTarget.number,
                          })
                        : ''
                }
                submitLabel={t('common.delete')}
                submitVariant="destructive"
                onSubmit={confirmDeleteTable}
                submitting={deleting}
            />
        </>
    );
}

MesasIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(
                props.translations as TranslationTree,
                'mesas.title',
            ),
            href: '/mesas',
        },
    ],
});
