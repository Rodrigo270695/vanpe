import { useForm } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { CajaSession } from '@/components/caja/types';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/use-translations';
import { formatCajaMoney } from '@/lib/caja-format';
import { cn } from '@/lib/utils';

type CloseCashModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session: CajaSession | null;
    currency: string;
};

export function CloseCashModal({
    open,
    onOpenChange,
    session,
    currency,
}: CloseCashModalProps) {
    const { t } = useTranslations();
    const form = useForm({ monto_cierre: '', notas_cierre: '' });

    const expectedCash = session?.monto_esperado_efectivo ?? 0;

    const difference = useMemo(() => {
        const counted = Number(form.data.monto_cierre);

        if (!Number.isFinite(counted) || form.data.monto_cierre === '') {
            return null;
        }

        return Math.round((counted - expectedCash) * 100) / 100;
    }, [form.data.monto_cierre, expectedCash]);

    useEffect(() => {
        if (!open) {
            form.reset();
            form.clearErrors();
        }
    }, [open]);

    const submit = () => {
        form.post('/caja/close', {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('caja.close_title')}
            description={t('caja.close_description')}
            icon={Lock}
            submitLabel={t('caja.close_button')}
            onSubmit={submit}
            submitting={form.processing}
            canSubmit={form.data.monto_cierre !== ''}
        >
            <div className="space-y-4">
                <div className="rounded-xl bg-muted/50 p-3 text-sm">
                    <div className="flex justify-between">
                        <span>{t('caja.opening_fund')}</span>
                        <span>{formatCajaMoney(session?.monto_apertura ?? 0, currency)}</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                        <span>{t('caja.cash_in_drawer')}</span>
                        <span>
                            {formatCajaMoney(session?.summary?.efectivo ?? 0, currency)}
                        </span>
                    </div>
                    <div className="mt-2 flex justify-between font-semibold">
                        <span>{t('caja.expected_cash')}</span>
                        <span>{formatCajaMoney(expectedCash, currency)}</span>
                    </div>
                </div>

                <FormField
                    label={t('caja.closing_amount')}
                    error={form.errors.monto_cierre ?? form.errors.session}
                >
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.data.monto_cierre}
                        onChange={(e) => form.setData('monto_cierre', e.target.value)}
                    />
                </FormField>

                {difference !== null && (
                    <p
                        className={cn(
                            'text-sm font-medium',
                            difference === 0
                                ? 'text-emerald-600'
                                : difference > 0
                                  ? 'text-amber-600'
                                  : 'text-red-600',
                        )}
                    >
                        {t('caja.difference')}: {formatCajaMoney(difference, currency)}
                    </p>
                )}

                <FormField label={t('caja.closing_notes')}>
                    <Input
                        value={form.data.notas_cierre}
                        onChange={(e) => form.setData('notas_cierre', e.target.value)}
                    />
                </FormField>
            </div>
        </BaseModal>
    );
}
