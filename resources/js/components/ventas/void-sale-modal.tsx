import { router } from '@inertiajs/react';
import { Ban } from 'lucide-react';
import { useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type VoidSaleModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    saleId: string;
    saleNumber: string;
};

export function VoidSaleModal({
    open,
    onOpenChange,
    saleId,
    saleNumber,
}: VoidSaleModalProps) {
    const { t } = useTranslations();
    const [motivo, setMotivo] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const reset = () => {
        setMotivo('');
        setSubmitting(false);
    };

    const submit = () => {
        setSubmitting(true);
        router.post(
            `/ventas/${saleId}/anular`,
            { motivo: motivo.trim() },
            {
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('ventas.void_modal_title')}
            description={t('ventas.void_modal_description', { number: saleNumber })}
            icon={Ban}
            iconClassName="text-rose-600 bg-rose-50 dark:bg-rose-500/15"
            submitLabel={t('ventas.void_confirm')}
            submitVariant="destructive"
            canSubmit={motivo.trim().length >= 5}
            submitting={submitting}
            onSubmit={submit}
            onAfterClose={reset}
        >
            <div className="space-y-2">
                <Label htmlFor="void-motivo">{t('ventas.void_reason_label')}</Label>
                <textarea
                    id="void-motivo"
                    value={motivo}
                    onChange={(event) => setMotivo(event.target.value)}
                    placeholder={t('ventas.void_reason_placeholder')}
                    rows={4}
                    maxLength={500}
                    className={cn(
                        'border-input placeholder:text-muted-foreground flex min-h-[96px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm',
                        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                    )}
                />
            </div>
        </BaseModal>
    );
}
