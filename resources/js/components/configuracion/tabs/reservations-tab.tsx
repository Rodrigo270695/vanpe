import { useForm } from '@inertiajs/react';
import { CalendarClock } from 'lucide-react';
import type { FormEvent } from 'react';
import { FormField } from '@/components/common/form-field';
import { ConfigSection } from '@/components/configuracion/config-section';
import { ConfigTabSaveFooter } from '@/components/configuracion/config-tab-save-footer';
import type { ConfigSettings } from '@/components/configuracion/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type ReservationsFormData = {
    reservations_enabled: boolean;
    reservation_duration_minutes: string;
    min_booking_hours_ahead: string;
    max_booking_days_ahead: string;
    no_show_tolerance_minutes: string;
};

type ReservationsTabProps = {
    settings: ConfigSettings;
    canManage: boolean;
};

export function ReservationsTab({ settings, canManage }: ReservationsTabProps) {
    const { t } = useTranslations();

    const { data, setData, put, processing, errors } =
        useForm<ReservationsFormData>({
            reservations_enabled: settings.reservations_enabled,
            reservation_duration_minutes: String(
                settings.reservation_duration_minutes,
            ),
            min_booking_hours_ahead: String(settings.min_booking_hours_ahead),
            max_booking_days_ahead: String(settings.max_booking_days_ahead),
            no_show_tolerance_minutes: String(
                settings.no_show_tolerance_minutes,
            ),
        });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put('/configuracion/reservations', { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-5">
            <ConfigSection
                title={t('configuracion.section_reservations')}
                description={t('configuracion.section_reservations_hint')}
                icon={<CalendarClock className="size-5" />}
                iconClass="bg-teal-100 text-teal-700 ring-teal-200/80"
                headerClass="bg-gradient-to-r from-teal-500/10 via-cyan-50/80 to-emerald-500/8"
            >
                <label
                    className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors sm:col-span-2',
                        data.reservations_enabled
                            ? 'border-teal-300/60 bg-teal-50/60'
                            : 'border-border bg-card',
                        !canManage && 'cursor-default opacity-70',
                    )}
                >
                    <Checkbox
                        checked={data.reservations_enabled}
                        onCheckedChange={(v) =>
                            setData('reservations_enabled', v === true)
                        }
                        disabled={!canManage}
                        className="mt-0.5"
                    />
                    <span className="block text-sm font-medium">
                        {t('configuracion.field_reservations_enabled')}
                    </span>
                </label>

                <FormField
                    label={t('configuracion.field_reservation_duration')}
                    required
                    error={errors.reservation_duration_minutes}
                >
                    <div className="relative">
                        <Input
                            type="number"
                            min={15}
                            max={480}
                            value={data.reservation_duration_minutes}
                            onChange={(e) =>
                                setData(
                                    'reservation_duration_minutes',
                                    e.target.value,
                                )
                            }
                            disabled={!canManage || !data.reservations_enabled}
                            className="bg-card pr-14 font-mono"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                            min
                        </span>
                    </div>
                </FormField>

                <FormField
                    label={t('configuracion.field_min_booking_hours')}
                    required
                    error={errors.min_booking_hours_ahead}
                >
                    <div className="relative">
                        <Input
                            type="number"
                            min={0}
                            max={168}
                            value={data.min_booking_hours_ahead}
                            onChange={(e) =>
                                setData(
                                    'min_booking_hours_ahead',
                                    e.target.value,
                                )
                            }
                            disabled={!canManage || !data.reservations_enabled}
                            className="bg-card pr-14 font-mono"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                            h
                        </span>
                    </div>
                </FormField>

                <FormField
                    label={t('configuracion.field_max_booking_days')}
                    required
                    error={errors.max_booking_days_ahead}
                >
                    <div className="relative">
                        <Input
                            type="number"
                            min={1}
                            max={365}
                            value={data.max_booking_days_ahead}
                            onChange={(e) =>
                                setData(
                                    'max_booking_days_ahead',
                                    e.target.value,
                                )
                            }
                            disabled={!canManage || !data.reservations_enabled}
                            className="bg-card pr-14 font-mono"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                            días
                        </span>
                    </div>
                </FormField>

                <FormField
                    label={t('configuracion.field_no_show_tolerance')}
                    required
                    error={errors.no_show_tolerance_minutes}
                >
                    <div className="relative">
                        <Input
                            type="number"
                            min={0}
                            max={120}
                            value={data.no_show_tolerance_minutes}
                            onChange={(e) =>
                                setData(
                                    'no_show_tolerance_minutes',
                                    e.target.value,
                                )
                            }
                            disabled={!canManage || !data.reservations_enabled}
                            className="bg-card pr-14 font-mono"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                            min
                        </span>
                    </div>
                </FormField>
            </ConfigSection>

            <ConfigTabSaveFooter canManage={canManage} processing={processing} />
        </form>
    );
}
