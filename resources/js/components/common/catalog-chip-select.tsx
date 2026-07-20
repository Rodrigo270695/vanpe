import { cn } from '@/lib/utils';
import type { CatalogTypeTheme } from '@/lib/catalog-visual';

export type CatalogChipOption = {
    id: string;
    name: string;
};

type CatalogChipSelectProps = {
    label: string;
    options: CatalogChipOption[];
    value: string[];
    onChange: (ids: string[]) => void;
    disabled?: boolean;
    theme?: CatalogTypeTheme;
};

export function CatalogChipSelect({
    label,
    options,
    value,
    onChange,
    disabled = false,
    theme,
}: CatalogChipSelectProps) {
    const toggle = (id: string) => {
        if (disabled) return;
        onChange(
            value.includes(id)
                ? value.filter((item) => item !== id)
                : [...value, id],
        );
    };

    return (
        <div className="space-y-2">
            {label ? (
                <p className="text-[13px] font-medium text-foreground">{label}</p>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
                {options.map((option) => {
                    const selected = value.includes(option.id);
                    return (
                        <button
                            key={option.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggle(option.id)}
                            className={cn(
                                'rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors',
                                selected && theme
                                    ? cn(theme.card, 'font-semibold text-foreground')
                                    : selected
                                      ? 'border-brand-blue/40 bg-brand-blue/10 text-brand-blue'
                                      : 'border-[#d0dbef] bg-card text-muted-foreground hover:border-brand-blue/25 hover:bg-muted/40',
                                disabled && 'cursor-default opacity-60',
                                !disabled && 'cursor-pointer',
                            )}
                        >
                            {option.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
