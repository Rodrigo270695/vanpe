import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';
import type { ComboboxOption } from '@/components/common/creatable-multi-combobox';

type CreatableComboboxProps = {
    options: ComboboxOption[];
    value: string;
    onChange: (id: string) => void;
    onCreate: (label: string) => Promise<ComboboxOption | null>;
    placeholder?: string;
    createLabel?: (query: string) => string;
    disabled?: boolean;
    error?: string;
    emptyHint?: string;
    clearable?: boolean;
};

export function CreatableCombobox({
    options,
    value,
    onChange,
    onCreate,
    placeholder,
    createLabel,
    disabled = false,
    error,
    emptyHint,
    clearable = true,
}: CreatableComboboxProps) {
    const { t } = useTranslations();
    const listId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [creating, setCreating] = useState(false);

    const selected = useMemo(
        () => options.find((opt) => opt.id === value) ?? null,
        [options, value],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((opt) => opt.label.toLowerCase().includes(q));
    }, [options, query]);

    const exactMatch = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return false;
        return options.some((opt) => opt.label.toLowerCase() === q);
    }, [options, query]);

    const canCreate = query.trim().length >= 2 && !exactMatch;

    useEffect(() => {
        const onPointerDown = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    const select = (id: string) => {
        onChange(id);
        setQuery('');
        setOpen(false);
    };

    const handleCreate = async () => {
        const label = query.trim();
        if (!canCreate || creating) return;
        setCreating(true);
        try {
            const created = await onCreate(label);
            if (created) {
                onChange(created.id);
                setQuery('');
                setOpen(false);
            }
        } finally {
            setCreating(false);
        }
    };

    return (
        <div ref={rootRef} className="relative space-y-1.5">
            <div
                className={cn(
                    'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-card px-2 py-1.5 transition-colors',
                    open && 'ring-2 ring-brand-blue/25 border-brand-blue/40',
                    error && 'border-destructive',
                    disabled && 'opacity-60',
                )}
                onClick={() => {
                    if (disabled) return;
                    setOpen(true);
                    inputRef.current?.focus();
                }}
            >
                {selected && query === '' && (
                    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-blue/10 px-2 py-0.5 text-[12px] font-medium text-brand-blue">
                        <span className="truncate">{selected.label}</span>
                        {clearable && !disabled && (
                            <button
                                type="button"
                                className="rounded-full p-0.5 hover:bg-brand-blue/15"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange('');
                                }}
                                aria-label={t('common.delete')}
                            >
                                <X className="size-3" />
                            </button>
                        )}
                    </span>
                )}
                <input
                    ref={inputRef}
                    value={query}
                    disabled={disabled}
                    placeholder={
                        selected && query === ''
                            ? ''
                            : (placeholder ?? t('tour_spots.combobox_placeholder'))
                    }
                    className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Backspace' && query === '' && value) {
                            onChange('');
                        }
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (canCreate) {
                                void handleCreate();
                            } else if (filtered[0]) {
                                select(filtered[0].id);
                            }
                        }
                        if (e.key === 'Escape') {
                            setOpen(false);
                        }
                    }}
                    aria-expanded={open}
                    aria-controls={listId}
                    role="combobox"
                />
                <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </div>

            {open && !disabled && (
                <div
                    id={listId}
                    className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg"
                    role="listbox"
                >
                    {filtered.length === 0 && !canCreate && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                            {emptyHint ?? t('tour_spots.combobox_empty')}
                        </p>
                    )}

                    {filtered.map((opt) => {
                        const checked = opt.id === value;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                role="option"
                                aria-selected={checked}
                                className={cn(
                                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-brand-blue/[0.06]',
                                    checked && 'bg-brand-blue/[0.08] text-brand-blue',
                                )}
                                onClick={() => select(opt.id)}
                            >
                                <Check
                                    className={cn(
                                        'size-4 shrink-0',
                                        checked ? 'opacity-100' : 'opacity-0',
                                    )}
                                />
                                <span className="truncate">{opt.label}</span>
                            </button>
                        );
                    })}

                    {canCreate && (
                        <button
                            type="button"
                            className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm font-medium text-brand-blue hover:bg-brand-blue/[0.06]"
                            disabled={creating}
                            onClick={() => void handleCreate()}
                        >
                            <Plus className="size-4 shrink-0" />
                            <span className="truncate">
                                {createLabel?.(query.trim()) ??
                                    t('tour_spots.combobox_create', {
                                        name: query.trim(),
                                    })}
                            </span>
                        </button>
                    )}
                </div>
            )}

            {error && (
                <p className="text-[12px] text-destructive">{error}</p>
            )}
        </div>
    );
}
