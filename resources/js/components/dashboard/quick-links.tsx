import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ChartCard } from '@/components/dashboard/chart-card';
import { cn } from '@/lib/utils';

export type QuickLinkItem = {
    href: string;
    label: string;
    icon: LucideIcon;
    color: string;
};

type QuickLinksProps = {
    title: string;
    links: QuickLinkItem[];
};

export function QuickLinks({ title, links }: QuickLinksProps) {
    return (
        <ChartCard title={title}>
            <div className="grid gap-2 sm:grid-cols-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                'flex items-center gap-3 rounded-xl border border-border/70 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex size-9 items-center justify-center rounded-lg',
                                    link.color,
                                )}
                            >
                                <Icon className="size-4" aria-hidden />
                            </span>
                            {link.label}
                        </Link>
                    );
                })}
            </div>
        </ChartCard>
    );
}
