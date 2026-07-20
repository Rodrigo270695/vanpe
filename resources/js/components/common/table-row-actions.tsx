import type { LucideIcon } from 'lucide-react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

export type TableRowActionItem = {
    key: string;
    label?: string;
    icon?: LucideIcon;
    onClick?: () => void;
    disabled?: boolean;
    hidden?: boolean;
    variant?: 'default' | 'destructive';
    /** Texto informativo (no clickeable) al final del menú. */
    hint?: string;
};

type TableRowActionsProps = {
    items: TableRowActionItem[];
    className?: string;
};

/**
 * Menú de acciones (⋮) unificado para todas las tablas del panel.
 */
export function TableRowActions({ items, className }: TableRowActionsProps) {
    const { t } = useTranslations();

    const visible = items.filter((item) => !item.hidden);
    const actionable = visible.filter((item) => item.label && item.onClick);
    const hints = visible.filter((item) => item.hint);

    if (actionable.length === 0 && hints.length === 0) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'size-8 cursor-pointer text-muted-foreground transition-colors hover:bg-brand-blue/10 hover:text-brand-blue',
                        className,
                    )}
                    aria-label={t('table.actions')}
                >
                    <MoreHorizontal className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
                {actionable.map((item) => {
                    const Icon = item.icon;
                    return (
                        <DropdownMenuItem
                            key={item.key}
                            variant={item.variant}
                            disabled={item.disabled}
                            onClick={item.onClick}
                            className="cursor-pointer gap-2.5 py-2"
                        >
                            {Icon && <Icon className="size-4" />}
                            {item.label}
                        </DropdownMenuItem>
                    );
                })}
                {hints.length > 0 && actionable.length > 0 && (
                    <DropdownMenuSeparator />
                )}
                {hints.map((item) => {
                    const Icon = item.icon;
                    return (
                        <DropdownMenuItem
                            key={item.key}
                            disabled
                            className="cursor-default gap-2.5 py-2 text-xs text-muted-foreground"
                        >
                            {Icon && <Icon className="size-3.5" />}
                            {item.hint}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
