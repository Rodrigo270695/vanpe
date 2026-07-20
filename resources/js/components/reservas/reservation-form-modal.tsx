import { useForm } from '@inertiajs/react';
import { CalendarClock } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    ReservationRow,
    ReservasAreaOption,
} from '@/components/reservas/types';
import { useTranslations } from '@/hooks/use-translations';

type ReservationFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reservation: ReservationRow | null;
    areas: ReservasAreaOption[];
    sources: string[];
    defaultDate?: string;
};

export function ReservationFormModal({
    open,
    onOpenChange,
    reservation,
    areas,
    sources,
    defaultDate,
}: ReservationFormModalProps) {
    const { t } = useTranslations();
    const isEditing = reservation !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            customer_name: '',
            customer_phone: '',
            date: defaultDate ?? '',
            time: '19:00',
            party_size: '2',
            notes: '',
            source: 'manual',
            table_ids: [] as string[],
        });

    useEffect(() => {
        if (open && reservation) {
            setData({
                customer_name: reservation.customer_name,
                customer_phone: reservation.customer_phone ?? '',
                date: reservation.date,
                time: reservation.time,
                party_size: String(reservation.party_size),
                notes: reservation.notes ?? '',
                source: reservation.source,
                table_ids: reservation.tables.map((tbl) => tbl.id),
            });
        }
        if (open && !reservation) {
            reset();
            if (defaultDate) {
                setData('date', defaultDate);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, reservation, defaultDate]);

    const canSubmit = useMemo(() => {
        const party = Number(data.party_size);
        return (
            data.customer_name.trim().length > 0 &&
            data.date !== '' &&
            data.time !== '' &&
            !Number.isNaN(party) &&
            party >= 1
        );
    }, [data]);

    const toggleTable = (tableId: string) => {
        setData(
            'table_ids',
            data.table_ids.includes(tableId)
                ? data.table_ids.filter((id) => id !== tableId)
                : [...data.table_ids, tableId],
        );
    };

    const sourceLabel = (source: string) =>
        t(`reservas.source_${source}` as 'reservas.source_manual');

    const submit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            put(`/reservas/${reservation.id}`, options);
        } else {
            post('/reservas', options);
        }
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                isEditing
                    ? t('reservas.edit_title')
                    : t('reservas.create_title')
            }
            description={t('reservas.form_hint')}
            icon={CalendarClock}
            submitLabel={
                isEditing
                    ? t('table.save_changes')
                    : t('reservas.create_submit')
            }
            onSubmit={submit}
            canSubmit={canSubmit}
            submitting={processing}
            onAfterClose={() => {
                reset();
                clearErrors();
            }}
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    label={t('reservas.field_customer_name')}
                    required
                    error={errors.customer_name}
                    className="sm:col-span-2"
                >
                    <Input
                        value={data.customer_name}
                        onChange={(e) =>
                            setData('customer_name', e.target.value)
                        }
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('reservas.field_customer_phone')}
                    error={errors.customer_phone}
                >
                    <Input
                        value={data.customer_phone}
                        onChange={(e) =>
                            setData('customer_phone', e.target.value)
                        }
                        className="bg-card"
                    />
                </FormField>

                {!isEditing && (
                    <FormField label={t('reservas.field_source')}>
                        <Select
                            value={data.source}
                            onValueChange={(v) => setData('source', v)}
                        >
                            <SelectTrigger className="w-full bg-card">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {sources
                                    .filter((s) => s !== 'app')
                                    .map((source) => (
                                        <SelectItem key={source} value={source}>
                                            {sourceLabel(source)}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                )}

                <FormField
                    label={t('reservas.field_date')}
                    required
                    error={errors.date}
                >
                    <Input
                        type="date"
                        value={data.date}
                        onChange={(e) => setData('date', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('reservas.field_time')}
                    required
                    error={errors.time}
                >
                    <Input
                        type="time"
                        value={data.time}
                        onChange={(e) => setData('time', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('reservas.field_party_size')}
                    required
                    error={errors.party_size}
                >
                    <Input
                        type="number"
                        min={1}
                        max={99}
                        value={data.party_size}
                        onChange={(e) => setData('party_size', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('reservas.field_notes')}
                    error={errors.notes}
                    className="sm:col-span-2"
                >
                    <Input
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('reservas.field_tables')}
                    className="sm:col-span-2"
                >
                    <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-border p-3">
                        {areas.length === 0 ? (
                            <p className="text-[13px] text-muted-foreground">
                                {t('reservas.no_tables')}
                            </p>
                        ) : (
                            areas.map((area) => (
                                <div key={area.id}>
                                    <p className="mb-1 text-[12px] font-medium text-muted-foreground">
                                        {area.name}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {area.tables.map((table) => (
                                            <label
                                                key={table.id}
                                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-[12px] has-checked:border-brand-blue/40 has-checked:bg-brand-blue/8"
                                            >
                                                <Checkbox
                                                    checked={data.table_ids.includes(
                                                        table.id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleTable(table.id)
                                                    }
                                                />
                                                {table.number}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </FormField>
            </div>
        </BaseModal>
    );
}
