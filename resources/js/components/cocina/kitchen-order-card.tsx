import { router } from '@inertiajs/react';
import { Check, ChefHat } from 'lucide-react';
import { StatusPill } from '@/components/common/status-pill';
import type { KitchenOrderRow } from '@/components/cocina/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type KitchenOrderCardProps = {
    order: KitchenOrderRow;
    markReadyLabel: string;
    statusPreparingLabel: string;
    statusReadyLabel: string;
    tableLabel: string;
    orderLabel: string;
    canManage: boolean;
};

function formatElapsed(iso: string | null): string {
    if (!iso) return '—';

    const opened = new Date(iso).getTime();
    const minutes = Math.max(0, Math.floor((Date.now() - opened) / 60_000));

    if (minutes < 1) return '<1 min';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return `${hours}h ${rest}m`;
}

export function KitchenOrderCard({
    order,
    markReadyLabel,
    statusPreparingLabel,
    statusReadyLabel,
    tableLabel,
    orderLabel,
    canManage,
}: KitchenOrderCardProps) {
    const markReady = (itemId: string) => {
        router.post(
            `/cocina/items/${itemId}/ready`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <article className="overflow-hidden rounded-2xl border border-amber-200/70 bg-card shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 bg-gradient-to-r from-amber-50/90 to-orange-50/50 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 ring-1 ring-amber-200/80">
                        <ChefHat className="size-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="font-semibold text-foreground">
                            {tableLabel} {order.table?.number ?? '—'}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                            {orderLabel} #{order.number}
                            {order.waiter?.name
                                ? ` · ${order.waiter.name}`
                                : ''}
                        </p>
                    </div>
                </div>
                <span className="rounded-full bg-white/80 px-2.5 py-1 font-mono text-[11px] font-medium text-amber-800 ring-1 ring-amber-200/70">
                    {formatElapsed(order.opened_at)}
                </span>
            </header>

            <ul className="divide-y divide-border/70">
                {order.items.map((item) => {
                    const isReady = item.kitchen_status === 'ready';

                    return (
                        <li
                            key={item.id}
                            className={cn(
                                'flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between',
                                isReady && 'bg-emerald-50/40',
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium text-foreground">
                                        {item.name}
                                        {item.quantity > 1 ? (
                                            <span className="ml-1 font-mono text-sm text-muted-foreground">
                                                ×{item.quantity}
                                            </span>
                                        ) : null}
                                    </p>
                                    <StatusPill
                                        variant={isReady ? 'green' : 'amber'}
                                    >
                                        {isReady
                                            ? statusReadyLabel
                                            : statusPreparingLabel}
                                    </StatusPill>
                                </div>

                                {item.selections.length > 0 ? (
                                    <ul className="mt-1.5 space-y-0.5 text-[12px] text-muted-foreground">
                                        {item.selections.map((selection) => (
                                            <li key={`${item.id}-${selection.step_slug}-${selection.name}`}>
                                                · {selection.name}
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}

                                {item.notes ? (
                                    <p className="mt-1.5 text-[12px] italic text-muted-foreground">
                                        {item.notes}
                                    </p>
                                ) : null}
                            </div>

                            {canManage && !isReady ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    className="shrink-0 cursor-pointer gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => markReady(item.id)}
                                >
                                    <Check className="size-3.5" />
                                    {markReadyLabel}
                                </Button>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </article>
    );
}
