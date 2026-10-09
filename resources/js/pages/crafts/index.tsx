import { Head, router } from '@inertiajs/react';
import { Headphones, Image, KeyRound, Palette, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { DataTable } from '@/components/common/data-table';
import type { DataTableColumn } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { SearchInput } from '@/components/common/search-input';
import { StatusPill } from '@/components/common/status-pill';
import { TableCard } from '@/components/common/table-card';
import { TableRowActions } from '@/components/common/table-row-actions';
import { CraftFormModal } from '@/components/crafts/craft-form-modal';
import type {
    CraftAbilities,
    CraftLimits,
    CraftOptions,
    CraftRow,
} from '@/components/crafts/types';
import { OwnerPasswordModal } from '@/components/tenants/owner-password-modal';
import { useClientTable } from '@/hooks/use-client-table';
import { useTranslations } from '@/hooks/use-translations';
import { translate } from '@/lib/i18n';
import type { TranslationTree } from '@/lib/i18n';

type CraftsPageProps = {
    crafts: CraftRow[];
    options: CraftOptions;
    limits: CraftLimits;
    can: CraftAbilities;
    mapbox_token: string | null;
};

function priceRange(row: CraftRow): string | null {
    const prices = row.media
        .map((m) => m.precio)
        .filter((p): p is number => p !== null);

    if (prices.length === 0) {
        return null;
    }

    const fmt = (v: number) =>
        `S/ ${v.toLocaleString('es-PE', { maximumFractionDigits: 2 })}`;
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
}

export default function CraftsIndex({
    crafts,
    options,
    limits,
    can,
    mapbox_token,
}: CraftsPageProps) {
    const { t } = useTranslations();

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<CraftRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CraftRow | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [passwordTarget, setPasswordTarget] = useState<CraftRow | null>(null);

    const table = useClientTable(crafts, {
        searchable: ['nombre', 'slug', 'descripcion', 'telefono_contacto'],
        initialSort: { key: 'nombre', dir: 'asc' },
    });

    const publishedCount = crafts.filter((c) => c.estado === 'publicado').length;
    const featuredCount = crafts.filter((c) => c.destacado).length;

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (row: CraftRow) => {
        setEditing(row);
        setFormOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        setDeleting(true);
        router.delete(`/artesanias/${deleteTarget.id}`, {
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

    const columns: DataTableColumn<CraftRow>[] = useMemo(
        () => [
            {
                key: 'nombre',
                header: t('crafts.col_name'),
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
                                <Palette className="size-4.5" />
                            </span>
                        )}
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate font-medium text-foreground">
                                {row.nombre}
                                {row.destacado && (
                                    <Star className="size-3.5 fill-brand-orange text-brand-orange" />
                                )}
                            </div>
                            <span className="block max-w-72 truncate text-xs text-muted-foreground">
                                {row.tenant_slug
                                    ? t('crafts.owner_panel', { slug: row.tenant_slug })
                                    : (row.descripcion ?? '—')}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'telefono_contacto',
                header: t('crafts.col_contact'),
                sortable: true,
                render: (row) => (
                    <span className="font-mono text-[13px] text-muted-foreground">
                        {row.telefono_contacto ?? '—'}
                    </span>
                ),
            },
            {
                key: 'media',
                header: t('crafts.col_photos'),
                render: (row) => (
                    <div className="flex flex-col text-[13px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Image className="size-3.5" />
                            {row.media.length}
                        </span>
                        <span className="text-[12px]">
                            {priceRange(row) ?? t('crafts.no_price')}
                        </span>
                    </div>
                ),
            },
            {
                key: 'redes_sociales',
                header: t('crafts.col_social'),
                render: (row) =>
                    row.redes_sociales.length === 0 ? (
                        <span className="text-[13px] text-muted-foreground">—</span>
                    ) : (
                        <div className="flex flex-wrap gap-1">
                            {row.redes_sociales.map((r) => (
                                <a
                                    key={r.red}
                                    href={r.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground hover:bg-muted/70"
                                >
                                    {t(`crafts.red_${r.red}`)}
                                </a>
                            ))}
                        </div>
                    ),
            },
            {
                key: 'estado',
                header: t('crafts.col_status'),
                sortable: true,
                render: (row) => (
                    <StatusPill variant={statusVariant(row.estado)}>
                        {t(`crafts.estado_${row.estado}`)}
                    </StatusPill>
                ),
            },
        ],
        [t],
    );

    const actions = (row: CraftRow) => (
        <TableRowActions
            items={[
                {
                    key: 'support-login',
                    label: t('tenants.action_support_login'),
                    icon: Headphones,
                    onClick: () => router.post(`/restaurantes/${row.tenant_id}/support-login`),
                    hidden: !can.support_login || !row.tenant_id,
                },
                {
                    key: 'owner-password',
                    label: t('tenants.action_owner_password'),
                    icon: KeyRound,
                    onClick: () => setPasswordTarget(row),
                    hidden: !can.support_login || !row.tenant_id,
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
            <Head title={t('crafts.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('crafts.title')}
                    description={t('crafts.description')}
                    badges={[
                        {
                            label: t('crafts.badge_total'),
                            value: crafts.length,
                            color: 'blue',
                            icon: Palette,
                        },
                        {
                            label: t('crafts.badge_published'),
                            value: publishedCount,
                            color: 'green',
                            icon: Palette,
                        },
                        {
                            label: t('crafts.badge_featured'),
                            value: featuredCount,
                            color: 'orange',
                            icon: Star,
                        },
                    ]}
                    action={
                        can.create
                            ? {
                                  label: t('crafts.new'),
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
                            placeholder={t('crafts.search_placeholder')}
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
                        emptyMessage={t('crafts.empty')}
                    />
                </TableCard>
            </div>

            <CraftFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                craft={editing}
                options={options}
                limits={limits}
                canPublish={can.publish}
                mapboxToken={mapbox_token}
            />

            <OwnerPasswordModal
                open={passwordTarget !== null}
                onOpenChange={(open) => !open && setPasswordTarget(null)}
                tenantId={passwordTarget?.tenant_id ?? null}
                businessName={passwordTarget?.nombre ?? ''}
            />

            <BaseModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={t('crafts.delete_title')}
                description={
                    deleteTarget
                        ? t('crafts.delete_confirm', { name: deleteTarget.nombre })
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

CraftsIndex.layout = (props: { translations: TranslationTree }) => ({
    breadcrumbs: [
        {
            title: translate(props.translations, 'nav.saas'),
            href: '/planes',
        },
        {
            title: translate(props.translations, 'crafts.title'),
            href: '/artesanias',
        },
    ],
});
