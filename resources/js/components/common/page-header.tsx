import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type HeaderBadgeColor =
    | 'blue'
    | 'orange'
    | 'yellow'
    | 'green'
    | 'purple'
    | 'teal'
    | 'gray'
    | 'red';

export type HeaderBadge = {
    label: string;
    value?: string | number;
    color?: HeaderBadgeColor;
    icon?: LucideIcon;
};

export type HeaderAction = {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    disabled?: boolean;
};

type PageHeaderProps = {
    title: string;
    description?: string;
    badges?: HeaderBadge[];
    action?: HeaderAction;
    /** Acciones extra a la derecha (además o en lugar de `action`). */
    children?: ReactNode;
    className?: string;
};

const badgeColors: Record<HeaderBadgeColor, string> = {
    blue: 'bg-[#eef3fc] text-[#0744a9] ring-1 ring-[#c5d7f5] dark:bg-brand-blue/20 dark:text-brand-blue-light dark:ring-brand-blue/25',
    orange: 'bg-[#fff4e8] text-[#c45f00] ring-1 ring-[#f5d4b3] dark:bg-brand-orange/20 dark:text-brand-orange-light dark:ring-brand-orange/25',
    yellow: 'bg-[#fffbeb] text-[#b45309] ring-1 ring-[#fde68a] dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/25',
    green: 'bg-[#ecfdf5] text-[#047857] ring-1 ring-[#a7f3d0] dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/25',
    purple: 'bg-[#f3f0ff] text-[#6d28d9] ring-1 ring-[#ddd6fe] dark:bg-violet-500/20 dark:text-violet-300 dark:ring-violet-500/25',
    teal: 'bg-[#ecfeff] text-[#0e7490] ring-1 ring-[#a5f3fc] dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-500/25',
    gray: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-muted dark:text-muted-foreground dark:ring-border',
    red: 'bg-[#fef2f2] text-[#b91c1c] ring-1 ring-[#fecaca] dark:bg-red-500/20 dark:text-red-400 dark:ring-red-500/25',
};

/**
 * Cabecera reutilizable de página: título con acento de marca, descripción,
 * fila de badges de estado (con color e icono) y un botón de acción principal.
 */
export function PageHeader({
    title,
    description,
    badges = [],
    action,
    children,
    className,
}: PageHeaderProps) {
    return (
        <div
            className={cn(
                'flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between',
                className,
            )}
        >
            <div className="min-w-0 space-y-2">
                <h1 className="relative inline-block text-2xl font-bold tracking-tight text-foreground">
                    {title}
                    <span className="absolute -bottom-1 left-0 h-1 w-10 rounded-full bg-brand-cta" />
                </h1>

                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}

                {badges.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1.5">
                        {badges.map((badge, index) => {
                            const Icon = badge.icon;

                            return (
                                <span
                                    key={`${badge.label}-${index}`}
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                                        badgeColors[badge.color ?? 'gray'],
                                    )}
                                >
                                    {Icon && <Icon className="size-3.5" />}
                                    <span>{badge.label}</span>
                                    {badge.value !== undefined && (
                                        <span className="font-bold">
                                            {badge.value}
                                        </span>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>

            {(action || children) && (
                <div className="flex shrink-0 items-center gap-2">
                    {children}
                    {action && (
                        <Button
                            onClick={action.onClick}
                            disabled={action.disabled}
                            className="gap-2"
                        >
                            {action.icon && <action.icon className="size-4" />}
                            {action.label}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
