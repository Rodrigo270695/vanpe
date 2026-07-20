import { router } from '@inertiajs/react';
import { UtensilsCrossed } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import type {
    MenuAddonsConfig,
    OrderItemRow,
} from '@/components/pedidos/types';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type DailyMenuPickerModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    menuAddons: MenuAddonsConfig;
    orderItem: OrderItemRow | null;
    orderId: string;
};

function formatPrice(value: number): string {
    return `S/ ${value.toFixed(2)}`;
}

export function DailyMenuPickerModal({
    open,
    onOpenChange,
    menuAddons,
    orderItem,
    orderId,
}: DailyMenuPickerModalProps) {
    const { t } = useTranslations();
    const [entradaIds, setEntradaIds] = useState<string[]>([]);
    const [bebidaId, setBebidaId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open || !orderItem) return;

        setEntradaIds(
            orderItem.selections
                .filter((s) => s.step_slug === 'entrada' && s.dish_id)
                .map((s) => s.dish_id as string),
        );

        const bebida = orderItem.selections.find((s) => s.step_slug === 'bebida');
        setBebidaId(bebida?.dish_id ?? null);
    }, [open, orderItem]);

    const bebidaAvailable = useMemo(
        () =>
            menuAddons.bebida_groups.some((group) => group.dishes.length > 0),
        [menuAddons.bebida_groups],
    );

    const showBebida = bebidaAvailable;

    const canSubmit = useMemo(() => {
        if (!orderItem) return false;

        const entradaOk =
            entradaIds.length >= 1 && entradaIds.length <= 2;

        const bebidaOk = !showBebida || bebidaId !== null;

        return entradaOk && bebidaOk;
    }, [orderItem, entradaIds, bebidaId, showBebida]);

    const toggleEntrada = (dishId: string) => {
        setEntradaIds((prev) => {
            if (prev.includes(dishId)) {
                return prev.filter((id) => id !== dishId);
            }
            if (prev.length >= 2) {
                return prev;
            }
            return [...prev, dishId];
        });
    };

    const reset = () => {
        setEntradaIds([]);
        setBebidaId(null);
    };

    const submit = () => {
        if (!orderItem || !canSubmit) return;

        setSubmitting(true);
        router.put(
            `/pedidos/${orderId}/items/${orderItem.id}/selections`,
            {
                entrada_dish_ids: entradaIds,
                bebida_dish_id: bebidaId,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={(value) => {
                onOpenChange(value);
                if (!value) reset();
            }}
            title={
                orderItem
                    ? t('pedidos.daily_menu_picker_for', { dish: orderItem.name })
                    : ''
            }
            description={t('pedidos.daily_menu_picker_addon_hint')}
            icon={UtensilsCrossed}
            submitLabel={t('pedidos.daily_menu_save_addons')}
            onSubmit={submit}
            canSubmit={canSubmit}
            submitting={submitting}
            contentClassName="sm:max-w-xl"
        >
            {orderItem ? (
                <div className="flex flex-col gap-5">
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
                        <p className="text-base font-semibold text-foreground">
                            {orderItem.name}
                        </p>
                        <p className="mt-1 font-mono text-sm font-bold text-brand-orange">
                            {formatPrice(orderItem.price)}
                            <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                                {showBebida
                                    ? t('pedidos.daily_menu_price_included')
                                    : t(
                                          'pedidos.daily_menu_price_included_entrada',
                                      )}
                            </span>
                        </p>
                    </div>

                    <AddonPicker
                        title={t('pedidos.daily_menu_step_entrada')}
                        groups={menuAddons.entrada_groups}
                        selectedIds={entradaIds}
                        onToggle={toggleEntrada}
                        maxPicks={2}
                        emptyLabel={t('pedidos.daily_menu_no_entrada_dishes')}
                    />

                    {showBebida ? (
                        <AddonPicker
                            title={t('pedidos.daily_menu_step_bebida')}
                            groups={menuAddons.bebida_groups}
                            selectedIds={bebidaId ? [bebidaId] : []}
                            onToggle={(id) =>
                                setBebidaId((prev) => (prev === id ? null : id))
                            }
                            maxPicks={1}
                            emptyLabel={t('pedidos.daily_menu_no_bebida_dishes')}
                        />
                    ) : (
                        <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-center text-[12px] text-muted-foreground">
                            {t('pedidos.daily_menu_no_bebida_catalog')}
                        </p>
                    )}
                </div>
            ) : null}
        </BaseModal>
    );
}

type AddonPickerProps = {
    title: string;
    groups: MenuAddonsConfig['addon_groups'];
    selectedIds: string[];
    onToggle: (dishId: string) => void;
    maxPicks: number;
    emptyLabel: string;
};

function AddonPicker({
    title,
    groups,
    selectedIds,
    onToggle,
    maxPicks,
    emptyLabel,
}: AddonPickerProps) {
    const hasDishes = groups.some((g) => g.dishes.length > 0);

    return (
        <section className="rounded-xl border border-border/80 bg-muted/10 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{title}</h3>
                <span className="text-[11px] text-muted-foreground">
                    {selectedIds.length}/{maxPicks}
                </span>
            </div>

            {!hasDishes ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[12px] text-muted-foreground">
                    {emptyLabel}
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    {groups.map((group) =>
                        group.dishes.length > 0 ? (
                            <div key={group.name}>
                                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {group.name}
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {group.dishes.map((dish) => {
                                        const isSelected = selectedIds.includes(
                                            dish.id,
                                        );

                                        return (
                                            <button
                                                key={dish.id}
                                                type="button"
                                                onClick={() => onToggle(dish.id)}
                                                className={cn(
                                                    'flex cursor-pointer items-center rounded-lg border p-3 text-left transition-colors',
                                                    isSelected
                                                        ? 'border-brand-orange/50 bg-orange-50/60 ring-1 ring-brand-orange/20'
                                                        : 'border-border/80 bg-card hover:border-brand-orange/30',
                                                )}
                                            >
                                                <p className="text-sm font-medium">
                                                    {dish.name}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null,
                    )}
                </div>
            )}
        </section>
    );
}
