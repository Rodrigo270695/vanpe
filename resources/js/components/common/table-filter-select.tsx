import type { LucideIcon } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type FilterSelectTone =
    | 'blue'
    | 'green'
    | 'orange'
    | 'purple'
    | 'gray'
    | 'muted';

export type FilterSelectOption = {
    value: string;
    label: string;
    icon?: LucideIcon;
    tone?: FilterSelectTone;
};

type TableFilterSelectProps = {
    value: string;
    onChange: (value: string) => void;
    options: FilterSelectOption[];
    placeholder?: string;
    className?: string;
    triggerClassName?: string;
};

const toneClasses: Record<FilterSelectTone, string> = {
    blue: 'text-brand-blue',
    green: 'text-emerald-600 dark:text-emerald-400',
    orange: 'text-amber-600 dark:text-amber-400',
    purple: 'text-violet-600 dark:text-violet-400',
    gray: 'text-slate-500 dark:text-slate-400',
    muted: 'text-muted-foreground',
};

/**
 * Select de filtro reutilizable con iconos y estilo VanPe.
 * Pensado para estado, visibilidad y otros filtros de tablas.
 */
export function TableFilterSelect({
    value,
    onChange,
    options,
    placeholder,
    className,
    triggerClassName,
}: TableFilterSelectProps) {
    return (
        <div className={className}>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                    size="sm"
                    className={cn(
                        'h-9 min-w-[11.5rem] cursor-pointer rounded-lg border-border bg-card px-3 text-[13px] shadow-none ring-0 transition-colors hover:border-brand-blue/40 hover:bg-muted/50 focus-visible:border-brand-blue/40 focus-visible:ring-2 focus-visible:ring-brand-blue/15 dark:border-white/12 dark:bg-white/5 dark:hover:bg-white/10',
                        triggerClassName,
                    )}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent
                    align="end"
                    className="min-w-[12rem] rounded-lg border-border p-1 shadow-lg dark:border-white/12"
                >
                    {options.map((option) => {
                        const Icon = option.icon;
                        return (
                            <SelectItem
                                key={option.value}
                                value={option.value}
                                className="cursor-pointer rounded-md py-2 pr-8 text-[13px] focus:bg-brand-blue/10 focus:text-brand-blue dark:focus:bg-brand-blue/25 dark:focus:text-sky-300"
                            >
                                <span className="flex items-center gap-2.5">
                                    {Icon && (
                                        <Icon
                                            className={cn(
                                                'size-3.5 shrink-0',
                                                toneClasses[
                                                    option.tone ?? 'muted'
                                                ],
                                            )}
                                        />
                                    )}
                                    {option.label}
                                </span>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
}
