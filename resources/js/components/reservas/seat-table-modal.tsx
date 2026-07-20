import { useForm } from '@inertiajs/react';
import { Armchair } from 'lucide-react';
import type { ReservasAreaOption } from '@/components/reservas/types';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type SeatTableModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    submitUrl: string;
    areas: ReservasAreaOption[];
    partySize?: number;
    multiple?: boolean;
};

export function SeatTableModal({
    open,
    onOpenChange,
    title,
    description,
    submitUrl,
    areas,
    partySize,
    multiple = false,
}: SeatTableModalProps) {
    const { t } = useTranslations();

    const form = useForm<{ table_ids: string[]; table_id: string }>({
        table_ids: [],
        table_id: '',
    });

    const toggleTable = (tableId: string) => {
        if (multiple) {
            const next = form.data.table_ids.includes(tableId)
                ? form.data.table_ids.filter((id) => id !== tableId)
                : [...form.data.table_ids, tableId];
            form.setData('table_ids', next);
            return;
        }

        form.setData('table_id', tableId);
        form.setData('table_ids', [tableId]);
    };

    const submit = () => {
        if (multiple) {
            form.transform((data) => ({ table_ids: data.table_ids })).post(submitUrl, {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
            });
            return;
        }

        form.transform((data) => ({ table_id: data.table_id })).post(submitUrl, {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            },
        });
    };

    const selected = multiple
        ? form.data.table_ids
        : form.data.table_id
          ? [form.data.table_id]
          : [];

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            icon={Armchair}
            submitLabel={t('reservas.seat_confirm')}
            onSubmit={submit}
            submitting={form.processing}
        >
            <div className="space-y-4">
                {partySize ? (
                    <p className="text-sm text-muted-foreground">
                        {t('reservas.seat_party_hint', { count: partySize })}
                    </p>
                ) : null}

                {areas.map((area) => (
                    <div key={area.id} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {area.name}
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {area.tables.map((table) => {
                                const isSelected = selected.includes(table.id);
                                const isFree = ['free', 'reserved'].includes(table.status);

                                return (
                                    <label
                                        key={table.id}
                                        className={cn(
                                            'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors',
                                            !isFree && 'cursor-not-allowed opacity-50',
                                            isSelected
                                                ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                                                : 'border-border hover:bg-muted/40',
                                        )}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            disabled={!isFree}
                                            onCheckedChange={() => {
                                                if (isFree) {
                                                    toggleTable(table.id);
                                                }
                                            }}
                                        />
                                        <span className="font-medium">
                                            {t('caja.table', { number: table.number })}
                                        </span>
                                        <span className="ml-auto text-xs text-muted-foreground">
                                            {table.capacity}p
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {form.errors.table_id && (
                    <p className="text-sm text-red-600">{form.errors.table_id}</p>
                )}
                {form.errors.table_ids && (
                    <p className="text-sm text-red-600">{form.errors.table_ids}</p>
                )}
            </div>
        </BaseModal>
    );
}
