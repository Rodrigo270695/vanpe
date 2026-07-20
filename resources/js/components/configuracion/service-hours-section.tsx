import { Clock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';
import type { ServiceHourRow } from '@/components/configuracion/types';

const WEEKDAY_KEYS = [
    'weekday_mon',
    'weekday_tue',
    'weekday_wed',
    'weekday_thu',
    'weekday_fri',
    'weekday_sat',
    'weekday_sun',
] as const;

type ServiceHoursSectionProps = {
    hours: ServiceHourRow[];
    onChange: (hours: ServiceHourRow[]) => void;
    disabled?: boolean;
    errors?: Record<string, string>;
};

export function ServiceHoursSection({
    hours,
    onChange,
    disabled = false,
    errors = {},
}: ServiceHoursSectionProps) {
    const { t } = useTranslations();

    const updateRow = (
        dayOfWeek: number,
        patch: Partial<ServiceHourRow>,
    ) => {
        onChange(
            hours.map((row) =>
                row.day_of_week === dayOfWeek ? { ...row, ...patch } : row,
            ),
        );
    };

    return (
        <div className="sm:col-span-2">
            <div className="overflow-hidden rounded-xl border border-[#d0dbef]">
                <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-[#d0dbef] bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>{t('configuracion.hours_day')}</span>
                    <span className="hidden w-28 text-center sm:block">
                        {t('configuracion.hours_opens')}
                    </span>
                    <span className="hidden w-28 text-center sm:block">
                        {t('configuracion.hours_closes')}
                    </span>
                    <span className="w-20 text-center">
                        {t('configuracion.hours_open')}
                    </span>
                </div>

                <ul className="divide-y divide-[#d0dbef]/80">
                    {hours.map((row, index) => {
                        const opensError =
                            errors[`service_hours.${index}.opens_at`];
                        const closesError =
                            errors[`service_hours.${index}.closes_at`];

                        return (
                            <li
                                key={row.day_of_week}
                                className={cn(
                                    'grid grid-cols-1 items-center gap-3 px-3 py-3 sm:grid-cols-[1fr_auto_auto_auto]',
                                    !row.active && 'bg-muted/20',
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Clock className="size-4 shrink-0 text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">
                                        {t(
                                            `configuracion.${WEEKDAY_KEYS[row.day_of_week]}`,
                                        )}
                                    </span>
                                    {!row.active && (
                                        <span className="text-[11px] text-muted-foreground">
                                            ({t('configuracion.hours_closed')})
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 sm:w-28">
                                    <span className="text-xs text-muted-foreground sm:hidden">
                                        {t('configuracion.hours_opens')}
                                    </span>
                                    <Input
                                        type="time"
                                        value={row.opens_at}
                                        onChange={(e) =>
                                            updateRow(row.day_of_week, {
                                                opens_at: e.target.value,
                                            })
                                        }
                                        disabled={disabled || !row.active}
                                        className={cn(
                                            'bg-card font-mono text-sm',
                                            opensError && 'border-destructive',
                                        )}
                                    />
                                </div>

                                <div className="flex items-center gap-2 sm:w-28">
                                    <span className="text-xs text-muted-foreground sm:hidden">
                                        {t('configuracion.hours_closes')}
                                    </span>
                                    <Input
                                        type="time"
                                        value={row.closes_at}
                                        onChange={(e) =>
                                            updateRow(row.day_of_week, {
                                                closes_at: e.target.value,
                                            })
                                        }
                                        disabled={disabled || !row.active}
                                        className={cn(
                                            'bg-card font-mono text-sm',
                                            closesError && 'border-destructive',
                                        )}
                                    />
                                </div>

                                <div className="flex justify-start sm:w-20 sm:justify-center">
                                    <Checkbox
                                        checked={row.active}
                                        onCheckedChange={(v) =>
                                            updateRow(row.day_of_week, {
                                                active: v === true,
                                            })
                                        }
                                        disabled={disabled}
                                        aria-label={t(
                                            'configuracion.hours_open',
                                        )}
                                    />
                                </div>

                                {(opensError || closesError) && (
                                    <p className="col-span-full text-[12px] text-destructive">
                                        {opensError ?? closesError}
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">
                {t('configuracion.section_hours_hint_detail')}
            </p>
        </div>
    );
}
