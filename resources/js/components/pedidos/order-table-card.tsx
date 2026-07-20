import { Link } from '@inertiajs/react';
import { BellRing, Receipt, Users } from 'lucide-react';
import { StatusPill } from '@/components/common/status-pill';
import { mesaStatusStyle } from '@/components/mesas/mesa-status';
import type { PedidosTableRow } from '@/components/pedidos/types';
import { cn } from '@/lib/utils';

type OrderTableCardProps = {
    table: PedidosTableRow;
    statusLabel: string;
    capacityLabel: string;
    hasOrderLabel: string;
    kitchenReadyLabel: string;
    kitchenAllReadyLabel: string;
    inactiveLabel: string;
    href: string;
};

export function OrderTableCard({
    table,
    statusLabel,
    capacityLabel,
    hasOrderLabel,
    kitchenReadyLabel,
    kitchenAllReadyLabel,
    inactiveLabel,
    href,
}: OrderTableCardProps) {
    const style = mesaStatusStyle(table.status);
    const hasOrder = table.open_order_id !== null;
    const hasKitchenReady = table.kitchen_ready_count > 0;

    return (
        <Link
            href={href}
            className={cn(
                'group flex flex-col gap-3 rounded-xl border p-3.5 transition-all duration-200 cursor-pointer hover:shadow-md',
                style.card,
                hasOrder && !hasKitchenReady && 'ring-2 ring-brand-orange/30',
                hasKitchenReady &&
                    (table.kitchen_all_ready
                        ? 'ring-2 ring-emerald-400/50'
                        : 'ring-2 ring-amber-400/40'),
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span
                        className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-xl font-mono text-[15px] font-bold',
                            style.numberBadge,
                            hasKitchenReady &&
                                'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/80',
                        )}
                    >
                        {table.number}
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span
                                className={cn(
                                    'size-1.5 shrink-0 rounded-full',
                                    style.dot,
                                )}
                                aria-hidden
                            />
                            <StatusPill variant={style.pill}>
                                {statusLabel}
                            </StatusPill>
                            {hasKitchenReady ? (
                                <StatusPill
                                    variant="green"
                                    className="gap-1"
                                >
                                    <BellRing className="size-3" />
                                    {table.kitchen_all_ready
                                        ? kitchenAllReadyLabel
                                        : kitchenReadyLabel}
                                </StatusPill>
                            ) : null}
                        </div>
                        <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-slate-600">
                            <Users className="size-3.5 text-teal-600" />
                            {capacityLabel}
                        </p>
                    </div>
                </div>

                {hasOrder && table.open_order_total !== null && (
                    <div className="text-right">
                        <p
                            className={cn(
                                'flex items-center justify-end gap-1 text-[11px] font-medium',
                                hasKitchenReady
                                    ? 'text-emerald-700'
                                    : 'text-brand-orange',
                            )}
                        >
                            <Receipt className="size-3" />
                            {hasOrderLabel}
                        </p>
                        <p className="font-mono text-sm font-semibold text-foreground">
                            S/ {table.open_order_total.toFixed(2)}
                        </p>
                    </div>
                )}
            </div>

            {!table.active && (
                <StatusPill variant="muted" className="w-fit">
                    {inactiveLabel}
                </StatusPill>
            )}
        </Link>
    );
}
