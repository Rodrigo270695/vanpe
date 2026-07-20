import { router } from '@inertiajs/react';
import {
    Check,
    Clock,
    Pencil,
    Smartphone,
    UserX,
    Users,
    X,
} from 'lucide-react';
import { StatusPill } from '@/components/common/status-pill';
import type { ReservationRow } from '@/components/reservas/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ReservationCardProps = {
    reservation: ReservationRow;
    statusLabel: string;
    sourceLabel: string;
    partyLabel: string;
    tablesLabel: string;
    canManage: boolean;
    onEdit: () => void;
    labels: {
        confirm: string;
        reject: string;
        seat: string;
        complete: string;
        noShow: string;
        cancel: string;
        pendingApproval: string;
    };
    onSeat?: () => void;
};

const statusVariant = (
    status: string,
): 'amber' | 'blue' | 'green' | 'violet' | 'muted' | 'neutral' => {
    if (status === 'pending') return 'amber';
    if (status === 'confirmed') return 'blue';
    if (status === 'seated') return 'green';
    if (status === 'completed') return 'muted';
    if (status === 'no_show') return 'violet';
    return 'muted';
};

export function ReservationCard({
    reservation,
    statusLabel,
    sourceLabel,
    partyLabel,
    tablesLabel,
    canManage,
    onEdit,
    labels,
    onSeat,
}: ReservationCardProps) {
    const act = (url: string) => {
        router.post(url, {}, { preserveScroll: true });
    };

    const isTerminal = [
        'completed',
        'no_show',
        'cancelled_customer',
        'cancelled_restaurant',
    ].includes(reservation.status);

    return (
        <article
            className={cn(
                'rounded-xl border p-4 transition-shadow hover:shadow-md',
                reservation.needs_approval
                    ? 'border-amber-300/80 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40'
                    : 'border-border/80 bg-card',
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[13px] font-bold text-brand-blue">
                            {reservation.code}
                        </span>
                        <StatusPill variant={statusVariant(reservation.status)}>
                            {statusLabel}
                        </StatusPill>
                        {reservation.source === 'app' && (
                            <StatusPill variant="blue" className="gap-0.5">
                                <Smartphone className="size-3" />
                                {sourceLabel}
                            </StatusPill>
                        )}
                        {reservation.needs_approval && (
                            <StatusPill variant="amber">
                                {labels.pendingApproval}
                            </StatusPill>
                        )}
                    </div>

                    <h3 className="mt-2 text-[15px] font-semibold">
                        {reservation.customer_name}
                    </h3>

                    <div className="mt-1 flex flex-wrap gap-3 text-[12px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <Clock className="size-3.5 text-teal-600" />
                            {reservation.time}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Users className="size-3.5 text-teal-600" />
                            {partyLabel}
                        </span>
                        {reservation.tables.length > 0 && (
                            <span>{tablesLabel}</span>
                        )}
                    </div>

                    {reservation.notes && (
                        <p className="mt-2 text-[12px] text-slate-600">
                            {reservation.notes}
                        </p>
                    )}
                </div>

                {canManage && !isTerminal && (
                    <div className="flex flex-wrap gap-1">
                        {reservation.status === 'pending' && (
                            <>
                                <Button
                                    size="sm"
                                    className="cursor-pointer gap-1 bg-teal-600 text-white hover:bg-teal-700"
                                    onClick={() =>
                                        act(
                                            `/reservas/${reservation.id}/confirm`,
                                        )
                                    }
                                >
                                    <Check className="size-3.5" />
                                    {labels.confirm}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="cursor-pointer border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() =>
                                        act(
                                            `/reservas/${reservation.id}/reject`,
                                        )
                                    }
                                >
                                    <X className="size-3.5" />
                                    {labels.reject}
                                </Button>
                            </>
                        )}
                        {reservation.status === 'confirmed' && (
                            <>
                                <Button
                                    size="sm"
                                    className="cursor-pointer gap-1 bg-brand-blue text-white hover:bg-brand-blue/90"
                                    onClick={() =>
                                        onSeat
                                            ? onSeat()
                                            : act(`/reservas/${reservation.id}/seat`)
                                    }
                                >
                                    {labels.seat}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={() =>
                                        act(
                                            `/reservas/${reservation.id}/no-show`,
                                        )
                                    }
                                >
                                    <UserX className="size-3.5" />
                                    {labels.noShow}
                                </Button>
                            </>
                        )}
                        {reservation.status === 'seated' && (
                            <Button
                                size="sm"
                                className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={() =>
                                    act(
                                        `/reservas/${reservation.id}/complete`,
                                    )
                                }
                            >
                                {labels.complete}
                            </Button>
                        )}
                        {['pending', 'confirmed'].includes(
                            reservation.status,
                        ) && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 cursor-pointer text-brand-blue"
                                onClick={onEdit}
                            >
                                <Pencil className="size-3.5" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}
