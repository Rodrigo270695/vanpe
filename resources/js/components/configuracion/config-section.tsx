import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ConfigSectionProps = {
    title: string;
    description: string;
    icon: ReactNode;
    iconClass: string;
    headerClass: string;
    children: ReactNode;
    stack?: boolean;
};

export function ConfigSection({
    title,
    description,
    icon,
    iconClass,
    headerClass,
    children,
    stack = false,
}: ConfigSectionProps) {
    return (
        <section className="overflow-hidden rounded-2xl border border-[#d0dbef] bg-card shadow-sm">
            <div
                className={cn(
                    'flex items-start gap-3 border-b border-white/60 px-4 py-3.5',
                    headerClass,
                )}
            >
                <span
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl ring-1',
                        iconClass,
                    )}
                >
                    {icon}
                </span>
                <div>
                    <h2 className="text-[15px] font-semibold text-foreground">
                        {title}
                    </h2>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            <div
                className={cn(
                    'p-4',
                    stack
                        ? 'flex flex-col gap-4'
                        : 'grid gap-4 sm:grid-cols-2',
                )}
            >
                {children}
            </div>
        </section>
    );
}
