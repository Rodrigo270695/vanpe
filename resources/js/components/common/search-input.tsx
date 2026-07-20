import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type SearchInputProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

/** Filtro de búsqueda reutilizable con icono y botón para limpiar. */
export function SearchInput({
    value,
    onChange,
    placeholder,
    className,
}: SearchInputProps) {
    const { t } = useTranslations();

    return (
        <div className={cn('relative w-full sm:max-w-xs', className)}>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder ?? t('table.search_placeholder')}
                className="pl-9"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label={t('table.search_clear')}
                >
                    <X className="size-4" />
                </button>
            )}
        </div>
    );
}
