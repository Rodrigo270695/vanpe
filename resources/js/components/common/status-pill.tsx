import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatusPillVariant =
    | 'neutral'
    | 'blue'
    | 'muted'
    | 'green'
    | 'amber'
    | 'violet';

type StatusPillProps = {
    children: ReactNode;
    variant?: StatusPillVariant;
    className?: string;
};

/** Badge compacto y sobrio para tablas SaaS. */
export function StatusPill({
    children,
    variant = 'neutral',
    className,
}: StatusPillProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                variant === 'blue' &&
                    'bg-[#eef3fc] text-[#0744a9] ring-[#d0dbef]',
                variant === 'neutral' &&
                    'bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:ring-slate-700',
                variant === 'muted' &&
                    'bg-muted/50 text-muted-foreground ring-border',
                variant === 'green' &&
                    'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
                variant === 'amber' &&
                    'bg-amber-50 text-amber-900 ring-amber-200/80',
                variant === 'violet' &&
                    'bg-violet-50 text-violet-800 ring-violet-200/80',
                className,
            )}
        >
            {children}
        </span>
    );
}
