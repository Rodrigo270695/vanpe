import { cn } from '@/lib/utils';

export type FilterTab = {
    id: string;
    label: string;
};

type TableFilterTabsProps = {
    tabs: FilterTab[];
    value: string;
    onChange: (id: string) => void;
    className?: string;
};

export function TableFilterTabs({
    tabs,
    value,
    onChange,
    className,
}: TableFilterTabsProps) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-1 rounded-xl bg-muted/50 p-1',
                className,
            )}
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        'rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                        value === tab.id
                            ? 'bg-card text-brand-blue shadow-sm ring-1 ring-brand-blue/20'
                            : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
