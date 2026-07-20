import { Calendar, Check, ChevronsUpDown, X } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/use-translations';
import {
    type DateRange,
    type DateRangePreset,
    DATE_RANGE_PRESETS,
    detectPreset,
    formatDisplayDate,
    getPresetRange,
    rangeTriggerLabel,
    todayRange,
} from '@/lib/date-range';
import { cn } from '@/lib/utils';

type DateRangeFilterProps = {
    value: DateRange;
    onChange: (range: DateRange) => void;
    className?: string;
};

/** Mismo estilo del trigger que TableFilterSelect. */
const triggerClassName =
    'inline-flex h-9 min-w-[11.5rem] cursor-pointer items-center gap-2 rounded-lg border border-[#d0dbef] bg-[#f8fafd] px-3 text-[13px] font-medium text-foreground shadow-none ring-0 transition-colors hover:border-brand-blue/35 hover:bg-[#eef3fc] focus-visible:border-brand-blue/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/15';

export function DateRangeFilter({
    value,
    onChange,
    className,
}: DateRangeFilterProps) {
    const { t, locale } = useTranslations();
    const [open, setOpen] = useState(false);
    const [activePreset, setActivePreset] = useState<DateRangePreset>(() =>
        detectPreset(value),
    );
    const [customFrom, setCustomFrom] = useState(value.from);
    const [customTo, setCustomTo] = useState(value.to);

    useEffect(() => {
        setActivePreset(detectPreset(value));
        setCustomFrom(value.from);
        setCustomTo(value.to);
    }, [value.from, value.to]);

    const localeTag = locale === 'en' ? 'en-US' : 'es-PE';

    const triggerText = useMemo(
        () => rangeTriggerLabel(value, activePreset, localeTag),
        [value, activePreset, localeTag],
    );

    const presetLabel = (preset: DateRangePreset) =>
        t(`date_range.preset_${preset}` as 'date_range.preset_this_month');

    const applyPreset = (preset: DateRangePreset) => {
        setActivePreset(preset);

        if (preset === 'custom') {
            return;
        }

        const range = getPresetRange(preset);
        onChange(range);
        setOpen(false);
    };

    const applyCustom = () => {
        if (!customFrom || !customTo || customFrom > customTo) {
            return;
        }

        setActivePreset('custom');
        onChange({ from: customFrom, to: customTo });
        setOpen(false);
    };

    const resetToToday = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(todayRange());
    };

    const today = todayRange();
    const showReset =
        value.from !== today.from || value.to !== today.to;

    return (
        <div className={cn('inline-flex items-center gap-1', className)}>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className={triggerClassName}
                    >
                        <Calendar className="size-4 shrink-0 text-brand-blue" />
                        <span className="truncate">{triggerText}</span>
                        <ChevronsUpDown className="ml-1 size-3.5 shrink-0 text-muted-foreground" />
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="start"
                    className="w-[min(100vw-2rem,22rem)] rounded-lg border border-[#d0dbef] p-0 shadow-lg"
                >
                    <div className="py-1">
                        {DATE_RANGE_PRESETS.map((preset) => {
                            const range =
                                preset === 'custom'
                                    ? { from: customFrom, to: customTo }
                                    : getPresetRange(preset);
                            const selected = activePreset === preset;
                            const showRange = preset !== 'custom';

                            return (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => applyPreset(preset)}
                                    className={cn(
                                        'flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-[#eef3fc]',
                                        selected && 'bg-[#eef3fc]',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'min-w-0 flex-1 font-medium',
                                            selected
                                                ? 'text-brand-blue'
                                                : 'text-foreground',
                                        )}
                                    >
                                        {presetLabel(preset)}
                                    </span>
                                    {showRange && (
                                        <span className="shrink-0 text-[12px] text-muted-foreground">
                                            {formatDisplayDate(
                                                range.from,
                                                localeTag,
                                            )}
                                            {' – '}
                                            {formatDisplayDate(
                                                range.to,
                                                localeTag,
                                            )}
                                        </span>
                                    )}
                                    {selected && (
                                        <Check className="size-4 shrink-0 text-brand-blue" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {activePreset === 'custom' && (
                        <div className="border-t border-border/80 px-3 py-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="mb-1 block text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                                        {t('date_range.from')}
                                    </label>
                                    <Input
                                        type="date"
                                        value={customFrom}
                                        onChange={(e) =>
                                            setCustomFrom(e.target.value)
                                        }
                                        className="h-9 bg-card text-[13px]"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                                        {t('date_range.to')}
                                    </label>
                                    <Input
                                        type="date"
                                        value={customTo}
                                        onChange={(e) =>
                                            setCustomTo(e.target.value)
                                        }
                                        className="h-9 bg-card text-[13px]"
                                    />
                                </div>
                            </div>
                            <Button
                                type="button"
                                className="mt-3 h-9 w-full cursor-pointer"
                                onClick={applyCustom}
                                disabled={
                                    !customFrom ||
                                    !customTo ||
                                    customFrom > customTo
                                }
                            >
                                {t('date_range.apply')}
                            </Button>
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {showReset && (
                <button
                    type="button"
                    onClick={resetToToday}
                    className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[#d0dbef] bg-[#f8fafd] text-muted-foreground transition-colors hover:border-brand-blue/35 hover:bg-[#eef3fc] hover:text-foreground"
                    aria-label={t('date_range.clear')}
                >
                    <X className="size-3.5" />
                </button>
            )}
        </div>
    );
}
