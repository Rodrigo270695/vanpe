import { Link } from '@inertiajs/react';
import { CheckCircle2, Circle } from 'lucide-react';
import { ChartCard } from '@/components/dashboard/chart-card';
import type { DashboardChecklistItem } from '@/types/dashboard';

type ProfileChecklistProps = {
    percent: number;
    items: DashboardChecklistItem[];
    title: string;
    subtitle: string;
    labelForKey: (key: string) => string;
};

export function ProfileChecklist({
    percent,
    items,
    title,
    subtitle,
    labelForKey,
}: ProfileChecklistProps) {
    return (
        <ChartCard title={title} description={subtitle}>
            <div className="space-y-4">
                <div>
                    <div className="mb-2 flex items-center justify-end text-sm">
                        <span className="font-semibold tabular-nums">{percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-brand-blue transition-all dark:bg-brand-blue-light"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
                <ul className="space-y-2">
                    {items.map((item) => (
                        <li key={item.key}>
                            <Link
                                href={item.href}
                                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60"
                            >
                                {item.done ? (
                                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                    <Circle className="size-4 shrink-0 text-muted-foreground" />
                                )}
                                <span
                                    className={
                                        item.done
                                            ? 'text-muted-foreground line-through'
                                            : ''
                                    }
                                >
                                    {labelForKey(item.key)}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </ChartCard>
    );
}
