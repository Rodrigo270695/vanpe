import { Head, router } from '@inertiajs/react';
import { Check, Clock, Plus, Store, Tags, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CatalogItemCard } from '@/components/catalog/catalog-item-card';
import { CatalogItemFormModal } from '@/components/catalog/catalog-item-form-modal';
import type {
    CatalogAbilities,
    CatalogItemRow,
    CatalogProposalRow,
} from '@/components/catalog/types';
import { BaseModal } from '@/components/common/base-modal';
import { PageHeader } from '@/components/common/page-header';
import { StatusPill } from '@/components/common/status-pill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/use-translations';
import {
    CATALOG_TYPE_THEMES,
    getCatalogItemIcon,
    getCatalogTypeTheme,
    type CatalogTypeKey,
} from '@/lib/catalog-visual';
import { translate, type TranslationTree } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type CatalogPageProps = {
    items: CatalogItemRow[];
    proposals: CatalogProposalRow[];
    types: string[];
    type_labels: Record<string, string>;
    pending_count: number;
    can: CatalogAbilities;
};

const TYPE_TABS: CatalogTypeKey[] = [
    'cuisine',
    'service',
    'language',
    'ambiance',
    'proposals',
];

export default function CatalogIndex({
    items,
    proposals,
    types,
    type_labels,
    pending_count,
    can,
}: CatalogPageProps) {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState<CatalogTypeKey>('cuisine');
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<CatalogItemRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CatalogItemRow | null>(null);
    const [rejectTarget, setRejectTarget] = useState<CatalogProposalRow | null>(
        null,
    );
    const [rejectReason, setRejectReason] = useState('');
    const [busy, setBusy] = useState(false);

    const filteredItems = useMemo(() => {
        if (activeTab === 'proposals') return [];
        const q = search.trim().toLowerCase();
        return items
            .filter((item) => item.type === activeTab)
            .filter(
                (item) =>
                    q === '' ||
                    item.name_es.toLowerCase().includes(q) ||
                    item.name_en.toLowerCase().includes(q) ||
                    item.slug.includes(q),
            );
    }, [items, activeTab, search]);

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (row: CatalogItemRow) => {
        setEditing(row);
        setFormOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setBusy(true);
        router.delete(`/catalogo/items/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setBusy(false),
        });
    };

    const approve = (proposal: CatalogProposalRow) => {
        setBusy(true);
        router.post(`/catalogo/proposals/${proposal.id}/approve`, undefined, {
            preserveScroll: true,
            onFinish: () => setBusy(false),
        });
    };

    const confirmReject = () => {
        if (!rejectTarget) return;
        setBusy(true);
        router.post(
            `/catalogo/proposals/${rejectTarget.id}/reject`,
            { rejection_reason: rejectReason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRejectTarget(null);
                    setRejectReason('');
                },
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <>
            <Head title={t('catalog.title')} />

            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title={t('catalog.title')}
                    description={t('catalog.description')}
                    badges={[
                        {
                            label: t('catalog.badge_items'),
                            value: String(items.length),
                            color: 'blue',
                            icon: Tags,
                        },
                        {
                            label: t('catalog.badge_pending'),
                            value: String(pending_count),
                            color: pending_count > 0 ? 'yellow' : 'gray',
                            icon: Clock,
                        },
                    ]}
                >
                    {can.create && activeTab !== 'proposals' && (
                        <Button
                            type="button"
                            onClick={openCreate}
                            className="cursor-pointer gap-2"
                        >
                            <Plus className="size-4" />
                            {t('catalog.new_item')}
                        </Button>
                    )}
                </PageHeader>

                <div className="flex flex-wrap gap-1 rounded-xl border border-[#d0dbef] bg-card p-1">
                    {TYPE_TABS.map((tab) => {
                        const theme = CATALOG_TYPE_THEMES[tab];
                        const TabIcon = theme.tabIcon;
                        const isActive = activeTab === tab;

                        return (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    'flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
                                    isActive ? theme.tabActive : theme.tabIdle,
                                )}
                            >
                                <TabIcon className="size-3.5 shrink-0" />
                                {tab === 'proposals'
                                    ? t('catalog.tab_proposals')
                                    : (type_labels[tab] ?? tab)}
                                {tab === 'proposals' && pending_count > 0 && (
                                    <span className="ml-0.5 rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-amber-950">
                                        {pending_count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {activeTab === 'proposals' ? (
                    <div className="overflow-hidden rounded-xl border border-[#d0dbef] bg-card">
                        {proposals.length === 0 ? (
                            <p className="p-6 text-sm text-muted-foreground">
                                {t('catalog.proposals_empty')}
                            </p>
                        ) : (
                            <ul className="divide-y divide-[#d0dbef]/80">
                                {proposals.map((row) => {
                                    const theme = getCatalogTypeTheme(row.type);
                                    const TypeIcon = getCatalogItemIcon(
                                        row.type,
                                        row.suggested_name
                                            .toLowerCase()
                                            .replace(/\s+/g, '-'),
                                    );

                                    return (
                                        <li
                                            key={row.id}
                                            className={cn(
                                                'flex flex-col gap-2 border-l-4 p-3 sm:flex-row sm:items-center sm:justify-between',
                                                theme.proposalAccent,
                                            )}
                                        >
                                            <div className="flex min-w-0 items-start gap-2.5">
                                                <span
                                                    className={cn(
                                                        'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                                        theme.iconWrap,
                                                    )}
                                                >
                                                    <TypeIcon className="size-4" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-foreground">
                                                        {row.suggested_name}
                                                    </p>
                                                    <p className="flex flex-wrap items-center gap-1 text-[12px] text-muted-foreground">
                                                        <Store className="size-3 shrink-0 text-foreground/70" />
                                                        {row.tenant_name ??
                                                            row.tenant_slug}
                                                        <span>·</span>
                                                        {type_labels[row.type] ??
                                                            row.type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
                                                <StatusPill
                                                    variant={
                                                        row.status === 'pending'
                                                            ? 'amber'
                                                            : row.status ===
                                                                'approved'
                                                              ? 'green'
                                                              : 'muted'
                                                    }
                                                >
                                                    {t(
                                                        `catalog.status_${row.status}`,
                                                    )}
                                                </StatusPill>
                                                {row.status === 'pending' &&
                                                    can.proposals && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="h-8 cursor-pointer gap-1"
                                                                disabled={busy}
                                                                onClick={() =>
                                                                    approve(row)
                                                                }
                                                            >
                                                                <Check className="size-3.5" />
                                                                {t(
                                                                    'catalog.approve',
                                                                )}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 cursor-pointer gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                                disabled={busy}
                                                                onClick={() =>
                                                                    setRejectTarget(
                                                                        row,
                                                                    )
                                                                }
                                                            >
                                                                <X className="size-3.5" />
                                                                {t(
                                                                    'catalog.reject',
                                                                )}
                                                            </Button>
                                                        </>
                                                    )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                ) : (
                    <>
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('catalog.search_placeholder')}
                            className="max-w-sm bg-card"
                        />
                        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredItems.map((item) => (
                                <CatalogItemCard
                                    key={item.id}
                                    item={item}
                                    canUpdate={can.update}
                                    canDelete={can.delete}
                                    onEdit={() => openEdit(item)}
                                    onDelete={() => setDeleteTarget(item)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <CatalogItemFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                item={editing}
                types={types}
                typeLabels={type_labels}
                defaultType={activeTab === 'proposals' ? 'cuisine' : activeTab}
            />

            <BaseModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={t('catalog.delete_item_title')}
                description={t('catalog.delete_item_confirm', {
                    name: deleteTarget?.name_es ?? '',
                })}
                submitLabel={t('common.delete')}
                submitVariant="destructive"
                onSubmit={confirmDelete}
                submitting={busy}
            />

            <BaseModal
                open={rejectTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setRejectTarget(null);
                        setRejectReason('');
                    }
                }}
                title={t('catalog.reject_title')}
                description={t('catalog.reject_hint')}
                submitLabel={t('catalog.reject')}
                submitVariant="destructive"
                onSubmit={confirmReject}
                submitting={busy}
            >
                <Input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t('catalog.reject_reason_placeholder')}
                    className="bg-card"
                />
            </BaseModal>
        </>
    );
}

CatalogIndex.layout = (props) => ({
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
                'catalog.title',
            ),
            href: '/catalogo',
        },
    ],
});
