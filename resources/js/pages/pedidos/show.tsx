import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Bell,
    Minus,
    Plus,
    Receipt,
    Send,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { PageHeader } from '@/components/common/page-header';
import { StatusPill } from '@/components/common/status-pill';
import type {
    MenuAddonsConfig,
    OrderCategoryRow,
    OrderItemRow,
    OrderRow,
    PedidosAbilities,
} from '@/components/pedidos/types';
import { DailyMenuPickerModal } from '@/components/pedidos/daily-menu-picker-modal';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';
import { translate, type TranslationTree } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type PedidosShowProps = {
    order: OrderRow;
    categories: OrderCategoryRow[];
    menu_addons: MenuAddonsConfig;
    can: PedidosAbilities;
};

function formatPrice(value: number): string {
    return `S/ ${value.toFixed(2)}`;
}

const statusVariant: Record<
    string,
    'green' | 'yellow' | 'blue' | 'gray' | 'muted'
> = {
    open: 'blue',
    kitchen: 'yellow',
    served: 'green',
    closed: 'gray',
    cancelled: 'muted',
};

const KITCHEN_REFRESH_MS = 10_000;

function kitchenItemStatusLabel(
    status: string,
    t: (key: string, params?: Record<string, string | number>) => string,
): { label: string; variant: 'amber' | 'green' | 'muted' } | null {
    if (status === 'preparing' || status === 'pending') {
        return { label: t('pedidos.item_kitchen_preparing'), variant: 'amber' };
    }
    if (status === 'ready') {
        return { label: t('pedidos.item_kitchen_ready'), variant: 'green' };
    }
    if (status === 'served') {
        return { label: t('pedidos.item_kitchen_served'), variant: 'muted' };
    }

    return null;
}

export default function PedidosShow({
    order,
    categories,
    menu_addons,
    can,
}: PedidosShowProps) {
    const { t } = useTranslations();
    const [activeCategoryId, setActiveCategoryId] = useState(
        categories[0]?.id ?? '',
    );
    const [processing, setProcessing] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [removeItemTarget, setRemoveItemTarget] = useState<OrderItemRow | null>(
        null,
    );
    const [dailyMenuOpen, setDailyMenuOpen] = useState(false);
    const [selectionItem, setSelectionItem] = useState<OrderItemRow | null>(
        null,
    );

    const activeCategory =
        categories.find((c) => c.id === activeCategoryId) ?? categories[0];

    const showKitchenTracking = ['kitchen', 'served'].includes(order.status);

    const kitchenReadyCount = useMemo(
        () =>
            order.items.filter((item) => item.kitchen_status === 'ready').length,
        [order.items],
    );

    const allItemsReadyInKitchen = useMemo(
        () =>
            order.status === 'kitchen' &&
            order.items.length > 0 &&
            order.items.every(
                (item) =>
                    item.kitchen_status === 'ready' ||
                    item.kitchen_status === 'served',
            ),
        [order.items, order.status],
    );

    useEffect(() => {
        if (order.status !== 'kitchen') {
            return;
        }

        const timer = window.setInterval(() => {
            router.reload({
                only: ['order'],
                preserveScroll: true,
            });
        }, KITCHEN_REFRESH_MS);

        return () => window.clearInterval(timer);
    }, [order.status, order.id]);

    const runAction = (url: string, method: 'post' | 'put' | 'delete' = 'post') => {
        setProcessing(true);
        router[method](url, undefined, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const addDish = (dishId: string) => {
        if (!order.is_editable || !can.manage) return;

        setProcessing(true);
        router.post(
            `/pedidos/${order.id}/items`,
            { dish_id: dishId, quantity: 1 },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        if (!order.is_editable || quantity < 1) return;

        setProcessing(true);
        router.put(
            `/pedidos/${order.id}/items/${itemId}`,
            { quantity },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const openSelections = (item: OrderItemRow) => {
        setSelectionItem(item);
        setDailyMenuOpen(true);
    };

    const removeItem = (item: OrderItemRow) => {
        if (!order.is_editable) return;
        setRemoveItemTarget(item);
    };

    const confirmRemoveItem = () => {
        if (!removeItemTarget) return;

        const itemId = removeItemTarget.id;
        setRemoveItemTarget(null);
        runAction(`/pedidos/${order.id}/items/${itemId}`, 'delete');
    };

    const confirmCancelOrder = () => {
        setCancelModalOpen(false);
        runAction(`/pedidos/${order.id}/cancel`);
    };

    const statusLabel = (status: string) =>
        t(`pedidos.status_${status}` as 'pedidos.status_open');

    return (
        <>
            <Head
                title={t('pedidos.order_title', {
                    number: order.number,
                    table: order.table?.number ?? '—',
                })}
            />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="cursor-pointer gap-2"
                    >
                        <Link href="/pedidos">
                            <ArrowLeft className="size-4" />
                            {t('pedidos.back_floor')}
                        </Link>
                    </Button>
                    <StatusPill variant={statusVariant[order.status] ?? 'muted'}>
                        {statusLabel(order.status)}
                    </StatusPill>
                </div>

                <PageHeader
                    title={t('pedidos.order_title', {
                        number: order.number,
                        table: order.table?.number ?? '—',
                    })}
                    description={
                        order.table?.area_name
                            ? `${order.table.area_name} · ${formatPrice(order.total)}`
                            : formatPrice(order.total)
                    }
                />

                <div className="grid gap-6 xl:grid-cols-5">
                    <section className="flex flex-col gap-4 rounded-2xl border border-[#d0dbef] bg-card p-4 shadow-sm xl:col-span-2">
                        <h2 className="text-sm font-semibold">
                            {t('pedidos.cart_title')}
                        </h2>

                        {showKitchenTracking && kitchenReadyCount > 0 ? (
                            <div
                                className={cn(
                                    'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
                                    allItemsReadyInKitchen
                                        ? 'border-emerald-300/80 bg-emerald-50 text-emerald-900'
                                        : 'border-amber-300/80 bg-amber-50 text-amber-900',
                                )}
                            >
                                <Bell className="mt-0.5 size-4 shrink-0" />
                                <p>
                                    {allItemsReadyInKitchen
                                        ? t('pedidos.kitchen_all_ready')
                                        : t('pedidos.kitchen_some_ready', {
                                              count: kitchenReadyCount,
                                          })}
                                </p>
                            </div>
                        ) : null}

                        {order.items.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                                {t('pedidos.cart_empty')}
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {order.items.map((item) => {
                                    const kitchenStatus = showKitchenTracking
                                        ? kitchenItemStatusLabel(
                                              item.kitchen_status,
                                              t,
                                          )
                                        : null;

                                    return (
                                    <li
                                        key={item.id}
                                        className={cn(
                                            'rounded-xl border border-border/80 bg-muted/10 p-3',
                                            item.kitchen_status === 'ready' &&
                                                'border-emerald-300/70 bg-emerald-50/40 ring-1 ring-emerald-200/60',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium text-foreground">
                                                        {item.name}
                                                    </p>
                                                    {kitchenStatus ? (
                                                        <StatusPill
                                                            variant={
                                                                kitchenStatus.variant
                                                            }
                                                        >
                                                            {
                                                                kitchenStatus.label
                                                            }
                                                        </StatusPill>
                                                    ) : null}
                                                </div>
                                                <p className="text-[12px] text-muted-foreground">
                                                    {formatPrice(item.price)}{' '}
                                                    × {item.quantity}
                                                </p>
                                                {item.notes ? (
                                                    <p className="mt-1 text-[12px] italic text-muted-foreground">
                                                        {item.notes}
                                                    </p>
                                                ) : null}
                                                {item.selections.length > 0 ? (
                                                    <ul className="mt-2 space-y-0.5 text-[12px] text-muted-foreground">
                                                        {item.selections.map(
                                                            (sel) => (
                                                                <li
                                                                    key={sel.id}
                                                                    className="text-foreground/75"
                                                                >
                                                                    · {sel.name}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                ) : item.item_type ===
                                                      'daily_menu' &&
                                                  !item.selections_complete ? (
                                                    <p className="mt-1 text-[12px] text-amber-700">
                                                        {t(
                                                            'pedidos.daily_menu_pending',
                                                        )}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <p className="shrink-0 font-mono text-sm font-semibold">
                                                {formatPrice(item.subtotal)}
                                            </p>
                                        </div>

                                        {order.is_editable &&
                                            can.manage &&
                                            item.item_type === 'daily_menu' && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={
                                                        item.selections_complete
                                                            ? 'outline'
                                                            : 'default'
                                                    }
                                                    className={cn(
                                                        'mt-3 h-9 w-full cursor-pointer gap-2',
                                                        !item.selections_complete &&
                                                            'bg-amber-500 hover:bg-amber-600',
                                                    )}
                                                    disabled={processing}
                                                    onClick={() =>
                                                        openSelections(item)
                                                    }
                                                >
                                                    <Plus className="size-4" />
                                                    {item.selections_complete
                                                        ? t(
                                                              'pedidos.daily_menu_edit_addons',
                                                          )
                                                        : t(
                                                              'pedidos.daily_menu_add_addons',
                                                          )}
                                                </Button>
                                            )}

                                        {order.is_editable && can.manage && (
                                            <div className="mt-3 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="outline"
                                                        className="size-8 cursor-pointer"
                                                        disabled={
                                                            processing ||
                                                            item.quantity <= 1
                                                        }
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.id,
                                                                item.quantity -
                                                                    1,
                                                            )
                                                        }
                                                    >
                                                        <Minus className="size-3.5" />
                                                    </Button>
                                                    <span className="w-8 text-center font-mono text-sm">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="outline"
                                                        className="size-8 cursor-pointer"
                                                        disabled={processing}
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.id,
                                                                item.quantity +
                                                                    1,
                                                            )
                                                        }
                                                    >
                                                        <Plus className="size-3.5" />
                                                    </Button>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="size-8 cursor-pointer text-red-600 hover:bg-red-50"
                                                    disabled={processing}
                                                    onClick={() =>
                                                        removeItem(item)
                                                    }
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </li>
                                    );
                                })}
                            </ul>
                        )}

                        <div className="mt-auto space-y-2 border-t border-border pt-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    {t('pedidos.subtotal')}
                                </span>
                                <span className="font-mono">
                                    {formatPrice(order.subtotal)}
                                </span>
                            </div>
                            <div className="flex justify-between text-base font-semibold">
                                <span>{t('pedidos.total')}</span>
                                <span className="font-mono text-brand-orange">
                                    {formatPrice(order.total)}
                                </span>
                            </div>
                        </div>

                        {can.manage && (
                            <div className="flex flex-col gap-2">
                                {order.status === 'open' && (
                                    <Button
                                        type="button"
                                        disabled={
                                            processing ||
                                            order.items.length === 0
                                        }
                                        onClick={() =>
                                            runAction(
                                                `/pedidos/${order.id}/send`,
                                            )
                                        }
                                        className="cursor-pointer gap-2"
                                    >
                                        <Send className="size-4" />
                                        {t('pedidos.send_kitchen')}
                                    </Button>
                                )}
                                {['open', 'kitchen'].includes(order.status) && (
                                    <Button
                                        type="button"
                                        disabled={
                                            processing ||
                                            order.items.length === 0
                                        }
                                        onClick={() =>
                                            runAction(
                                                `/pedidos/${order.id}/served`,
                                            )
                                        }
                                        className="cursor-pointer gap-2 bg-teal-600 hover:bg-teal-700"
                                    >
                                        <Receipt className="size-4" />
                                        {t('pedidos.send_to_caja')}
                                    </Button>
                                )}
                                {order.status === 'served' && (
                                    <div className="rounded-xl border border-brand-blue/20 bg-brand-blue/5 px-4 py-3 text-sm">
                                        <p className="font-medium text-brand-blue">
                                            {t('pedidos.pending_in_caja')}
                                        </p>
                                        <p className="mt-1 text-muted-foreground">
                                            {t('pedidos.pending_in_caja_hint')}
                                        </p>
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="mt-3 cursor-pointer"
                                        >
                                            <Link href="/caja">
                                                {t('pedidos.go_to_caja')}
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                                {['open', 'kitchen', 'served'].includes(
                                    order.status,
                                ) && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        disabled={processing}
                                        onClick={() => setCancelModalOpen(true)}
                                        className="cursor-pointer gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <XCircle className="size-4" />
                                        {t('pedidos.cancel_order')}
                                    </Button>
                                )}
                            </div>
                        )}
                    </section>

                    <section className="flex flex-col gap-4 rounded-2xl border border-[#d0dbef] bg-card p-4 shadow-sm xl:col-span-3">
                        <h2 className="text-sm font-semibold">
                            {t('pedidos.menu_title')}
                        </h2>

                        {!order.is_editable ? (
                            <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                                {t('pedidos.menu_locked')}
                            </p>
                        ) : categories.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                                {t('pedidos.menu_empty')}
                            </p>
                        ) : (
                            <>
                                <div className="flex flex-wrap gap-1 rounded-xl bg-muted/40 p-1">
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            type="button"
                                            onClick={() =>
                                                setActiveCategoryId(
                                                    category.id,
                                                )
                                            }
                                            className={cn(
                                                'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                                                activeCategoryId ===
                                                    category.id
                                                    ? 'bg-card text-brand-blue shadow-sm ring-1 ring-brand-blue/20'
                                                    : 'text-muted-foreground hover:bg-card/60',
                                            )}
                                        >
                                            {category.name}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    {activeCategory?.dishes.map((dish) => (
                                        <button
                                            key={dish.id}
                                            type="button"
                                            disabled={
                                                processing || !can.manage
                                            }
                                            onClick={() => addDish(dish.id)}
                                            className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3 text-left transition-colors hover:border-brand-orange/40 hover:bg-orange-50/40 disabled:cursor-default disabled:opacity-60"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium text-foreground">
                                                    {dish.name}
                                                </p>
                                                {dish.description ? (
                                                    <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">
                                                        {dish.description}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <span className="shrink-0 font-mono text-sm font-semibold text-brand-orange">
                                                {formatPrice(dish.price)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>

            <DailyMenuPickerModal
                open={dailyMenuOpen}
                onOpenChange={(open) => {
                    setDailyMenuOpen(open);
                    if (!open) setSelectionItem(null);
                }}
                menuAddons={menu_addons}
                orderItem={selectionItem}
                orderId={order.id}
            />

            <BaseModal
                open={cancelModalOpen}
                onOpenChange={setCancelModalOpen}
                title={t('pedidos.cancel_order_title')}
                description={t('pedidos.cancel_order_description', {
                    table: order.table?.number ?? '—',
                    number: order.number,
                })}
                icon={XCircle}
                iconClassName="bg-red-100 text-red-600 ring-red-200"
                submitLabel={t('pedidos.cancel_order_confirm')}
                submitVariant="destructive"
                onSubmit={confirmCancelOrder}
                submitting={processing}
                size="sm"
            />

            <BaseModal
                open={removeItemTarget !== null}
                onOpenChange={(open) => !open && setRemoveItemTarget(null)}
                title={t('pedidos.remove_item_title')}
                description={
                    removeItemTarget
                        ? t('pedidos.remove_item_description', {
                              name: removeItemTarget.name,
                          })
                        : ''
                }
                icon={Trash2}
                iconClassName="bg-red-100 text-red-600 ring-red-200"
                submitLabel={t('pedidos.remove_item_confirm')}
                submitVariant="destructive"
                onSubmit={confirmRemoveItem}
                submitting={processing}
                size="sm"
            />
        </>
    );
}

PedidosShow.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(
                props.translations as TranslationTree,
                'pedidos.title',
            ),
            href: '/pedidos',
        },
        {
            title: translate(
                props.translations as TranslationTree,
                'pedidos.breadcrumb_order',
            ),
            href: '#',
        },
    ],
});
