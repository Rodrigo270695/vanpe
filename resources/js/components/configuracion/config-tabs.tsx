import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfigTabId =
    | 'general'
    | 'images'
    | 'tourist'
    | 'billing'
    | 'hours'
    | 'reservations'
    | 'publication';

export const CONFIG_TAB_IDS: ConfigTabId[] = [
    'general',
    'images',
    'tourist',
    'billing',
    'hours',
    'reservations',
    'publication',
];

export type ConfigTabItem = {
    id: ConfigTabId;
    label: string;
    icon: LucideIcon;
};

type ConfigTabsProps = {
    tabs: ConfigTabItem[];
    value: ConfigTabId;
    onChange: (id: ConfigTabId) => void;
};

export function ConfigTabs({ tabs, value, onChange }: ConfigTabsProps) {
    return (
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div
                className="flex min-w-max items-center gap-1 rounded-xl bg-muted/50 p-1"
                role="tablist"
                aria-label="Secciones de configuración"
            >
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = value === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onChange(tab.id)}
                            className={cn(
                                'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-all',
                                isActive
                                    ? 'bg-card text-brand-blue shadow-sm ring-1 ring-brand-blue/20'
                                    : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
                            )}
                        >
                            <Icon className="size-3.5 shrink-0" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function parseConfigTabFromUrl(): ConfigTabId {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');

    if (tab && CONFIG_TAB_IDS.includes(tab as ConfigTabId)) {
        return tab as ConfigTabId;
    }

    return 'general';
}

export function syncConfigTabToUrl(tab: ConfigTabId): void {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url);
}
