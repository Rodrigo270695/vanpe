import { useForm } from '@inertiajs/react';
import { Wallet } from 'lucide-react';
import { useEffect } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/use-translations';

type OpenCashModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function OpenCashModal({ open, onOpenChange }: OpenCashModalProps) {
    const { t } = useTranslations();
    const form = useForm({ monto_apertura: '0' });

    useEffect(() => {
        if (!open) {
            form.reset();
            form.clearErrors();
        }
    }, [open]);

    const submit = () => {
        form.post('/caja/open', {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('caja.open_title')}
            description={t('caja.open_description')}
            icon={Wallet}
            submitLabel={t('caja.open_button')}
            onSubmit={submit}
            submitting={form.processing}
            canSubmit={form.data.monto_apertura !== ''}
        >
            <FormField
                label={t('caja.opening_amount')}
                error={form.errors.monto_apertura ?? form.errors.session}
            >
                <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.data.monto_apertura}
                    onChange={(e) => form.setData('monto_apertura', e.target.value)}
                />
            </FormField>
        </BaseModal>
    );
}
