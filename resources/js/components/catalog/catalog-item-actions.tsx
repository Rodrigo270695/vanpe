import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CatalogItemActionsProps = {
    canUpdate?: boolean;
    canDelete?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    className?: string;
};

/** Editar (azul) / eliminar (rojo) — mismo criterio que la carta. */
export function CatalogItemActions({
    canUpdate = false,
    canDelete = false,
    onEdit,
    onDelete,
    className,
}: CatalogItemActionsProps) {
    if (!canUpdate && !canDelete) {
        return null;
    }

    return (
        <div
            className={cn(
                'flex shrink-0 gap-0.5 opacity-80 transition-opacity group-hover:opacity-100',
                className,
            )}
        >
            {canUpdate && (
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0 cursor-pointer text-brand-blue hover:bg-brand-blue/10 hover:text-brand-blue"
                    onClick={onEdit}
                >
                    <Pencil className="size-3.5" />
                </Button>
            )}
            {canDelete && (
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0 cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={onDelete}
                >
                    <Trash2 className="size-3.5" />
                </Button>
            )}
        </div>
    );
}
