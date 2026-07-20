import { Head, router } from '@inertiajs/react';
import {
    BookOpen,
    LayoutGrid,
    Pencil,
    Plus,
    Smartphone,
    Trash2,
    UtensilsCrossed,
} from 'lucide-react';
import { useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { PageHeader } from '@/components/common/page-header';
import { StatusPill } from '@/components/common/status-pill';
import { CategoryFormModal } from '@/components/carta/category-form-modal';
import { DishCard } from '@/components/carta/dish-card';
import { DishFormModal } from '@/components/carta/dish-form-modal';
import type {
    CartaAbilities,
    CartaStats,
    CategoryRow,
    DishRow,
} from '@/components/carta/types';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';
import { translate, type TranslationTree } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type CartaPageProps = {
    categories: CategoryRow[];
    stats: CartaStats;
    can: CartaAbilities;
};

const categoryThemes = [
    {
        section: 'border-brand-orange/20',
        header: 'border-b border-white/60 bg-gradient-to-r from-orange-500/10 via-orange-50/80 to-amber-500/8',
        icon: 'bg-orange-100 text-orange-700 ring-orange-200/80',
    },
    {
        section: 'border-rose-200/60',
        header: 'border-b border-white/60 bg-gradient-to-r from-rose-500/10 via-rose-50/80 to-pink-500/8',
        icon: 'bg-rose-100 text-rose-700 ring-rose-200/80',
    },
    {
        section: 'border-amber-200/60',
        header: 'border-b border-white/60 bg-gradient-to-r from-amber-500/10 via-yellow-50/80 to-orange-500/8',
        icon: 'bg-amber-100 text-amber-800 ring-amber-200/80',
    },
    {
        section: 'border-teal-200/60',
        header: 'border-b border-white/60 bg-gradient-to-r from-teal-500/10 via-cyan-50/80 to-emerald-500/8',
        icon: 'bg-teal-100 text-teal-700 ring-teal-200/80',
    },
] as const;

function formatPrice(value: number): string {
    return `S/ ${value.toFixed(2)}`;
}

export default function CartaIndex({ categories, stats, can }: CartaPageProps) {
    const { t } = useTranslations();

    const [categoryFormOpen, setCategoryFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(
        null,
    );
    const [deleteCategoryTarget, setDeleteCategoryTarget] =
        useState<CategoryRow | null>(null);

    const [dishFormOpen, setDishFormOpen] = useState(false);
    const [editingDish, setEditingDish] = useState<DishRow | null>(null);
    const [defaultCategoryId, setDefaultCategoryId] = useState<
        string | undefined
    >();
    const [deleteDishTarget, setDeleteDishTarget] = useState<DishRow | null>(
        null,
    );
    const [deleting, setDeleting] = useState(false);

    const openCreateCategory = () => {
        setEditingCategory(null);
        setCategoryFormOpen(true);
    };

    const openEditCategory = (category: CategoryRow) => {
        setEditingCategory(category);
        setCategoryFormOpen(true);
    };

    const openCreateDish = (categoryId?: string) => {
        setEditingDish(null);
        setDefaultCategoryId(categoryId);
        setDishFormOpen(true);
    };

    const openEditDish = (dish: DishRow) => {
        setEditingDish(dish);
        setDefaultCategoryId(undefined);
        setDishFormOpen(true);
    };

    const confirmDeleteCategory = () => {
        if (!deleteCategoryTarget) return;
        setDeleting(true);
        router.delete(`/carta/categories/${deleteCategoryTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteCategoryTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    const confirmDeleteDish = () => {
        if (!deleteDishTarget) return;
        setDeleting(true);
        router.delete(`/carta/dishes/${deleteDishTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteDishTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <>
            <Head title={t('carta.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('carta.title')}
                    description={t('carta.description')}
                    badges={[
                        {
                            label: t('carta.badge_categories'),
                            value: stats.categories,
                            color: 'orange',
                            icon: LayoutGrid,
                        },
                        {
                            label: t('carta.badge_dishes'),
                            value: stats.dishes,
                            color: 'yellow',
                            icon: UtensilsCrossed,
                        },
                        {
                            label: t('carta.badge_available'),
                            value: stats.available_dishes,
                            color: 'green',
                            icon: BookOpen,
                        },
                        {
                            label: t('carta.badge_published'),
                            value: stats.published_dishes,
                            color: 'blue',
                            icon: Smartphone,
                        },
                    ]}
                    action={
                        can.manage
                            ? {
                                  label: t('carta.new_category'),
                                  onClick: openCreateCategory,
                                  icon: Plus,
                              }
                            : undefined
                    }
                />
            </div>

            {categories.length === 0 ? (
                <div className="mx-4 overflow-hidden rounded-2xl border border-dashed border-brand-orange/25 bg-gradient-to-br from-brand-orange/[0.06] via-white to-amber-500/[0.05] p-10 text-center md:mx-6 md:mb-6">
                    <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange ring-1 ring-brand-orange/15">
                        <BookOpen className="size-8" />
                    </span>
                    <p className="text-base font-medium text-foreground">
                        {t('carta.loading_structure')}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-5 px-4 pb-6 md:px-6">
                    {categories.map((category, categoryIndex) => {
                        const theme =
                            categoryThemes[
                                categoryIndex % categoryThemes.length
                            ];

                        return (
                            <section
                                key={category.id}
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
                                                    {category.name}
                                                </h2>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-orange-700 ring-1 ring-orange-200/70">
                                                    <UtensilsCrossed className="size-3" />
                                                    {category.dishes.length}
                                                </span>
                                                {!category.active && (
                                                    <StatusPill variant="muted">
                                                        {t('carta.inactive')}
                                                    </StatusPill>
                                                )}
                                                {category.is_system && (
                                                    <StatusPill variant="blue">
                                                        {t('carta.system_category_badge')}
                                                    </StatusPill>
                                                )}
                                            </div>
                                            {category.description && (
                                                <p className="mt-0.5 text-[12px] text-slate-600">
                                                    {category.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {can.manage && (
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                className="cursor-pointer gap-1.5 border-0 bg-brand-orange text-white shadow-sm shadow-brand-orange/25 hover:bg-brand-orange-dark"
                                                onClick={() =>
                                                    openCreateDish(category.id)
                                                }
                                            >
                                                <Plus className="size-3.5" />
                                                {t('carta.new_dish')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="cursor-pointer border-brand-blue/25 bg-white/80 text-brand-blue hover:bg-brand-blue/8 hover:text-brand-blue"
                                                onClick={() =>
                                                    openEditCategory(category)
                                                }
                                            >
                                                <Pencil className="size-3.5" />
                                            </Button>
                                            {!category.is_system && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="cursor-pointer border-red-200 bg-white/80 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() =>
                                                        setDeleteCategoryTarget(
                                                            category,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {category.dishes.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                                        <span className="flex size-12 items-center justify-center rounded-xl bg-orange-50 text-orange-400">
                                            <UtensilsCrossed className="size-5" />
                                        </span>
                                        <p className="text-[13px] text-muted-foreground">
                                            {t('carta.empty_dishes')}
                                        </p>
                                        {can.manage && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-1 cursor-pointer border-orange-200 text-orange-700 hover:bg-orange-50"
                                                onClick={() =>
                                                    openCreateDish(category.id)
                                                }
                                            >
                                                <Plus className="size-3.5" />
                                                {t('carta.new_dish')}
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid gap-3 bg-white/40 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {category.dishes.map((dish) => (
                                            <DishCard
                                                key={dish.id}
                                                dish={dish}
                                                priceLabel={formatPrice(
                                                    dish.price,
                                                )}
                                                availableLabel={t(
                                                    'carta.available',
                                                )}
                                                unavailableLabel={t(
                                                    'carta.unavailable',
                                                )}
                                                publishedLabel={t(
                                                    'carta.published_in_app',
                                                )}
                                                featuredLabel={t(
                                                    'carta.featured',
                                                )}
                                                canManage={can.manage}
                                                onEdit={() =>
                                                    openEditDish(dish)
                                                }
                                                onDelete={() =>
                                                    setDeleteDishTarget(dish)
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

            <CategoryFormModal
                open={categoryFormOpen}
                onOpenChange={setCategoryFormOpen}
                category={editingCategory}
            />

            <DishFormModal
                open={dishFormOpen}
                onOpenChange={(open) => {
                    setDishFormOpen(open);
                    if (!open) {
                        setEditingDish(null);
                        setDefaultCategoryId(undefined);
                    }
                }}
                dish={editingDish}
                categories={categories}
                defaultCategoryId={defaultCategoryId}
            />

            <BaseModal
                open={deleteCategoryTarget !== null}
                onOpenChange={(open) => !open && setDeleteCategoryTarget(null)}
                title={t('carta.delete_category_title')}
                description={
                    deleteCategoryTarget
                        ? t('carta.delete_category_confirm', {
                              name: deleteCategoryTarget.name,
                          })
                        : ''
                }
                submitLabel={t('common.delete')}
                submitVariant="destructive"
                onSubmit={confirmDeleteCategory}
                submitting={deleting}
            />

            <BaseModal
                open={deleteDishTarget !== null}
                onOpenChange={(open) => !open && setDeleteDishTarget(null)}
                title={t('carta.delete_dish_title')}
                description={
                    deleteDishTarget
                        ? t('carta.delete_dish_confirm', {
                              name: deleteDishTarget.name,
                          })
                        : ''
                }
                submitLabel={t('common.delete')}
                submitVariant="destructive"
                onSubmit={confirmDeleteDish}
                submitting={deleting}
            />
        </>
    );
}

CartaIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(
                props.translations as TranslationTree,
                'carta.title',
            ),
            href: '/carta',
        },
    ],
});
