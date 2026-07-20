import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
    title: string;
    value: string | number;
    hint?: string;
    icon: LucideIcon;
    accent?: 'blue' | 'orange' | 'green' | 'purple' | 'teal' | 'amber';
    className?: string;
};

const accentStyles = {
    blue: 'bg-[#eef3fc] text-[#0744a9] dark:bg-brand-blue/20 dark:text-brand-blue-light',
    orange: 'bg-[#fff4e8] text-[#c45f00] dark:bg-brand-orange/20 dark:text-brand-orange-light',
    green: 'bg-[#ecfdf5] text-[#047857] dark:bg-emerald-500/20 dark:text-emerald-300',
    purple: 'bg-[#f3f0ff] text-[#6d28d9] dark:bg-violet-500/20 dark:text-violet-300',
    teal: 'bg-[#ecfeff] text-[#0e7490] dark:bg-cyan-500/15 dark:text-cyan-300',
    amber: 'bg-[#fffbeb] text-[#b45309] dark:bg-amber-400/15 dark:text-amber-300',
};

export function StatCard({
    title,
    value,
    hint,
    icon: Icon,
    accent = 'blue',
    className,
}: StatCardProps) {
    return (
        <Card className={cn('gap-0 py-0 shadow-sm', className)}>
            <CardContent className="flex items-start gap-4 p-5">
                <div
                    className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-xl',
                        accentStyles[accent],
                    )}
                >
                    <Icon className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                        {value}
                    </p>
                    {hint ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
