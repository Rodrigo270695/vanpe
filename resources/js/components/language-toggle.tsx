import { Check, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

const localeNames: Record<string, string> = {
    es: 'Español',
    en: 'English',
};

const localeShort: Record<string, string> = {
    es: 'ES',
    en: 'EN',
};

export function LanguageToggle({ className }: { className?: string }) {
    const { locale, availableLocales, setLocale } = useTranslations();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn('h-9 gap-1.5 px-2', className)}
                >
                    <Languages className="size-5! opacity-80" />
                    <span className="text-sm font-medium">
                        {localeShort[locale] ?? locale.toUpperCase()}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                {availableLocales.map((code) => (
                    <DropdownMenuItem
                        key={code}
                        onClick={() => setLocale(code)}
                        className="cursor-pointer justify-between"
                    >
                        <span>{localeNames[code] ?? code}</span>
                        {locale === code && (
                            <Check className="size-4 opacity-80" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
