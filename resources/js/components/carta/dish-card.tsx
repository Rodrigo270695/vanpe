import { Pencil, Sparkles, Trash2 } from 'lucide-react';
import { StatusPill } from '@/components/common/status-pill';
import type { DishRow } from '@/components/carta/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type DishCardProps = {
    dish: DishRow;
    priceLabel: string;
    availableLabel: string;
    unavailableLabel: string;
    publishedLabel: string;
    featuredLabel: string;
    canManage: boolean;
    onEdit: () => void;
    onDelete: () => void;
};

export function DishCard({
    dish,
    priceLabel,
    availableLabel,
    unavailableLabel,
    publishedLabel,
    featuredLabel,
    canManage,
    onEdit,
    onDelete,
}: DishCardProps) {
    return (
        <article
            className={cn(
                'group relative flex flex-col gap-3 rounded-xl border p-3.5 transition-all duration-200',
                dish.available
                    ? 'border-orange-200/90 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 shadow-sm shadow-orange-100/50 hover:border-orange-300 hover:shadow-md'
                    : 'border-slate-200/90 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/40 opacity-80',
            )}
        >
            {dish.image_url && (
                <div className="overflow-hidden rounded-lg border border-orange-100/80 bg-white">
                    <img
                        src={dish.image_url}
                        alt=""
                        className="aspect-[16/10] w-full object-cover"
                    />
                </div>
            )}

            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {dish.featured && (
                            <StatusPill variant="amber" className="gap-0.5">
                                <Sparkles className="size-3" />
                                {featuredLabel}
                            </StatusPill>
                        )}
                        {dish.publish_in_app && (
                            <StatusPill variant="blue">
                                {publishedLabel}
                            </StatusPill>
                        )}
                        <StatusPill variant={dish.available ? 'green' : 'muted'}>
                            {dish.available ? availableLabel : unavailableLabel}
                        </StatusPill>
                    </div>

                    <h3 className="mt-2 line-clamp-2 text-[14px] font-semibold text-foreground">
                        {dish.name}
                    </h3>

                    {dish.description && (
                        <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                            {dish.description}
                        </p>
                    )}

                    <p className="mt-2 font-mono text-[15px] font-bold text-brand-orange">
                        {priceLabel}
                    </p>
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
        </article>
    );
}
