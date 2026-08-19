import { Head, router } from '@inertiajs/react';
import { Link2, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type CatalogItemOption = {
    id: string;
    type: string;
    slug: string;
    name_es: string;
};

type TourCategoryOption = {
    id: string;
    slug: string;
    name_es: string;
};

type InterestCategoryRow = {
    id: string;
    slug: string;
    name_es: string;
    catalog_item_ids: string[];
    tour_category_ids: string[];
};

type InterestGroupRow = {
    id: string;
    slug: string;
    name_es: string;
    target_entity: 'restaurant' | 'tour_spot';
    categories: InterestCategoryRow[];
};

type InterestsPageProps = {
    groups: InterestGroupRow[];
    catalog_items: CatalogItemOption[];
    tour_categories: TourCategoryOption[];
    can: { update: boolean };
};

const TARGET_LABELS: Record<string, string> = {
    restaurant: 'Restaurantes',
    tour_spot: 'Centros turísticos',
};

export default function CatalogInterests({
    groups,
    catalog_items,
    tour_categories,
    can,
}: InterestsPageProps) {
    const [draft, setDraft] = useState<Record<string, string[]>>(() => {
        const initial: Record<string, string[]> = {};
        for (const group of groups) {
            for (const cat of group.categories) {
                initial[`catalog:${cat.id}`] = [...cat.catalog_item_ids];
                initial[`tour:${cat.id}`] = [...cat.tour_category_ids];
            }
        }
        return initial;
    });
    const [busyId, setBusyId] = useState<string | null>(null);

    const catalogByType = useMemo(() => {
        const map: Record<string, CatalogItemOption[]> = {};
        for (const item of catalog_items) {
            map[item.type] ??= [];
            map[item.type].push(item);
        }
        return map;
    }, [catalog_items]);

    const toggle = (key: string, id: string, checked: boolean) => {
        setDraft((prev) => {
            const current = new Set(prev[key] ?? []);
            if (checked) {
                current.add(id);
            } else {
                current.delete(id);
            }
            return { ...prev, [key]: [...current] };
        });
    };

    const saveCatalog = (categoryId: string) => {
        if (!can.update) return;
        setBusyId(categoryId);
        router.put(
            `/catalogo/intereses/categorias/${categoryId}/catalog-items`,
            { catalog_item_ids: draft[`catalog:${categoryId}`] ?? [] },
            {
                preserveScroll: true,
                onFinish: () => setBusyId(null),
            },
        );
    };

    const saveTour = (categoryId: string) => {
        if (!can.update) return;
        setBusyId(categoryId);
        router.put(
            `/catalogo/intereses/categorias/${categoryId}/tour-categories`,
            { tour_category_ids: draft[`tour:${categoryId}`] ?? [] },
            {
                preserveScroll: true,
                onFinish: () => setBusyId(null),
            },
        );
    };

    return (
        <>
            <Head title="Intereses turista" />
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Intereses turista"
                    description="Amarra las macros que elige el turista con el catálogo de restaurantes y las categorías de centros turísticos. Los tenants no cambian."
                />

                <div className="space-y-8">
                    {groups.map((group) => (
                        <section
                            key={group.id}
                            className="rounded-xl border bg-card p-5 shadow-sm"
                        >
                            <div className="mb-4 flex flex-wrap items-center gap-3">
                                <h2 className="text-lg font-semibold">{group.name_es}</h2>
                                <span
                                    className={cn(
                                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                                        group.target_entity === 'restaurant'
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-sky-100 text-sky-800',
                                    )}
                                >
                                    {TARGET_LABELS[group.target_entity]}
                                </span>
                            </div>

                            <div className="space-y-6">
                                {group.categories.map((category) => {
                                    const catalogKey = `catalog:${category.id}`;
                                    const tourKey = `tour:${category.id}`;
                                    const isRestaurant =
                                        group.target_entity === 'restaurant';

                                    return (
                                        <div
                                            key={category.id}
                                            className="rounded-lg border bg-muted/20 p-4"
                                        >
                                            <div className="mb-3 flex items-center gap-2">
                                                <Link2 className="size-4 text-muted-foreground" />
                                                <h3 className="font-medium">{category.name_es}</h3>
                                            </div>

                                            {isRestaurant ? (
                                                <div className="space-y-4">
                                                    {Object.entries(catalogByType).map(
                                                        ([type, items]) => (
                                                            <div key={type}>
                                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                    {type}
                                                                </p>
                                                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                                    {items.map((item) => (
                                                                        <label
                                                                            key={item.id}
                                                                            className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm"
                                                                        >
                                                                            <Checkbox
                                                                                checked={(
                                                                                    draft[catalogKey] ?? []
                                                                                ).includes(item.id)}
                                                                                disabled={!can.update}
                                                                                onCheckedChange={(
                                                                                    v,
                                                                                ) =>
                                                                                    toggle(
                                                                                        catalogKey,
                                                                                        item.id,
                                                                                        v === true,
                                                                                    )
                                                                                }
                                                                            />
                                                                            <span>{item.name_es}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                    {can.update && (
                                                        <Button
                                                            size="sm"
                                                            disabled={busyId === category.id}
                                                            onClick={() =>
                                                                saveCatalog(category.id)
                                                            }
                                                        >
                                                            <Save className="mr-2 size-4" />
                                                            Guardar amarres
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                        {tour_categories.map((item) => (
                                                            <label
                                                                key={item.id}
                                                                className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm"
                                                            >
                                                                <Checkbox
                                                                    checked={(
                                                                        draft[tourKey] ?? []
                                                                    ).includes(item.id)}
                                                                    disabled={!can.update}
                                                                    onCheckedChange={(v) =>
                                                                        toggle(
                                                                            tourKey,
                                                                            item.id,
                                                                            v === true,
                                                                        )
                                                                    }
                                                                />
                                                                <span>{item.name_es}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    {can.update && (
                                                        <Button
                                                            size="sm"
                                                            disabled={busyId === category.id}
                                                            onClick={() => saveTour(category.id)}
                                                        >
                                                            <Save className="mr-2 size-4" />
                                                            Guardar amarres
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </>
    );
}
