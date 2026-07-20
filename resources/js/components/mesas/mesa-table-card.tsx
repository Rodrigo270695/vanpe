import { Pencil, Trash2, Users } from 'lucide-react';
import { StatusPill } from '@/components/common/status-pill';
import { mesaStatusStyle } from '@/components/mesas/mesa-status';
import type { TableRow } from '@/components/mesas/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MesaTableCardProps = {
    table: TableRow;
    statusLabel: string;
    capacityLabel: string;
    inactiveLabel: string;
    canManage: boolean;
    onEdit: () => void;
    onDelete: () => void;
};

export function MesaTableCard({
    table,
    statusLabel,
    capacityLabel,
    inactiveLabel,
    canManage,
    onEdit,
    onDelete,
}: MesaTableCardProps) {
    const style = mesaStatusStyle(table.status);

    return (
        <article
            className={cn(
                'group relative flex flex-col gap-3 rounded-xl border p-3.5 transition-all duration-200',
                style.card,
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span
                        className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-xl font-mono text-[15px] font-bold',
                            style.numberBadge,
                        )}
                    >
                        {table.number}
                    </span>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
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
                        </div>
                        <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-slate-600">
                            <Users className="size-3.5 text-teal-600" />
                            {capacityLabel}
                        </p>
                    </div>
                </div>

                {canManage && (
                    <div className="flex shrink-0 gap-0.5 opacity-80 transition-opacity group-hover:opacity-100">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 cursor-pointer text-brand-blue hover:bg-brand-blue/10 hover:text-brand-blue"
                            onClick={onEdit}
                        >
                            <Pencil className="size-3.5" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={onDelete}
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    </div>
                )}
            </div>

            {!table.active && (
                <StatusPill variant="muted" className="w-fit">
                    {inactiveLabel}
                </StatusPill>
            )}
        </article>
    );
}
