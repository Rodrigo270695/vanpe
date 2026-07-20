import { useForm } from '@inertiajs/react';
import { Utensils } from 'lucide-react';
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
import type { AreaRow, TableRow } from '@/components/mesas/types';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type TableFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    table: TableRow | null;
    areas: AreaRow[];
    statuses: string[];
    defaultAreaId?: string;
};

export function TableFormModal({
    open,
    onOpenChange,
    table,
    areas,
    statuses,
    defaultAreaId,
}: TableFormModalProps) {
    const { t } = useTranslations();
    const isEditing = table !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            area_id: defaultAreaId ?? '',
            number: '',
            capacity: '4',
            capacity_max: '',
            status: 'free',
            reservable: true,
            active: true,
        });

    useEffect(() => {
        if (open && table) {
            setData({
                area_id: table.area_id,
                number: table.number,
                capacity: String(table.capacity),
                capacity_max:
                    table.capacity_max !== null ? String(table.capacity_max) : '',
                status: table.status,
                reservable: table.reservable,
                active: table.active,
            });
        }
        if (open && !table) {
            reset();
            if (defaultAreaId) {
                setData('area_id', defaultAreaId);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, table, defaultAreaId]);

    const statusLabel = (status: string) =>
        t(`mesas.status_${status}` as 'mesas.status_free');

    const canSubmit = useMemo(() => {
        const capacity = Number(data.capacity);
        return (
            data.area_id !== '' &&
            data.number.trim().length > 0 &&
            !Number.isNaN(capacity) &&
            capacity >= 1
        );
    }, [data]);

    const submit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            put(`/mesas/tables/${table.id}`, options);
        } else {
            post('/mesas/tables', options);
        }
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                isEditing
                    ? t('mesas.edit_table_title')
                    : t('mesas.create_table_title')
            }
            description={t('mesas.table_form_hint')}
            icon={Utensils}
            submitLabel={
                isEditing
                    ? t('table.save_changes')
                    : t('mesas.create_table_submit')
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
                    label={t('mesas.field_area')}
                    required
                    error={errors.area_id}
                    className="sm:col-span-2"
                >
                    <Select
                        value={data.area_id}
                        onValueChange={(v) => setData('area_id', v)}
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue placeholder={t('mesas.select_area')} />
                        </SelectTrigger>
                        <SelectContent>
                            {areas.map((area) => (
                                <SelectItem key={area.id} value={area.id}>
                                    {area.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField
                    label={t('mesas.field_table_number')}
                    required
                    error={errors.number}
                >
                    <Input
                        value={data.number}
                        onChange={(e) => setData('number', e.target.value)}
                        className="bg-card font-mono"
                    />
                </FormField>

                <FormField
                    label={t('mesas.field_capacity')}
                    required
                    error={errors.capacity}
                >
                    <Input
                        type="number"
                        min={1}
                        max={99}
                        value={data.capacity}
                        onChange={(e) => setData('capacity', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                {isEditing && (
                    <FormField label={t('mesas.field_status')} className="sm:col-span-2">
                        <Select
                            value={data.status}
                            onValueChange={(v) => setData('status', v)}
                        >
                            <SelectTrigger className="w-full bg-card">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {statusLabel(status)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                )}

                <label
                    className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                        data.reservable
                            ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                            : 'border-border bg-card',
                    )}
                >
                    <Checkbox
                        checked={data.reservable}
                        onCheckedChange={(v) => setData('reservable', v === true)}
                        className="mt-0.5"
                    />
                    <span className="block text-sm font-medium">
                        {t('mesas.field_reservable')}
                    </span>
                </label>

                <label
                    className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                        data.active
                            ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                            : 'border-border bg-card',
                    )}
                >
                    <Checkbox
                        checked={data.active}
                        onCheckedChange={(v) => setData('active', v === true)}
                        className="mt-0.5"
                    />
                    <span className="block text-sm font-medium">
                        {t('mesas.field_table_active')}
                    </span>
                </label>
            </div>
        </BaseModal>
    );
}
