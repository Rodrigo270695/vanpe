import type { LucideIcon } from 'lucide-react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

const modeIcons: Record<Appearance, LucideIcon> = {
    light: Sun,
    dark: Moon,
    system: Monitor,
};

export function AppearanceToggle({ className }: { className?: string }) {
    const { appearance, updateAppearance } = useAppearance();
    const { t } = useTranslations();
    const TriggerIcon = modeIcons[appearance];

    const modes: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: t('settings.appearance.light') },
        { value: 'dark', icon: Moon, label: t('settings.appearance.dark') },
        {
            value: 'system',
            icon: Monitor,
            label: t('settings.appearance.system'),
        },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn('h-9 gap-1.5 px-2', className)}
                    aria-label={t('settings.appearance.title')}
                >
                    <TriggerIcon className="size-5! opacity-80" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                {modes.map(({ value, icon: Icon, label }) => (
                    <DropdownMenuItem
                        key={value}
                        onClick={() => updateAppearance(value)}
                        className="cursor-pointer justify-between gap-2"
                    >
                        <span className="inline-flex items-center gap-2">
                            <Icon className="size-4 opacity-80" />
                            {label}
                        </span>
                        {appearance === value && (
                            <Check className="size-4 opacity-80" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
