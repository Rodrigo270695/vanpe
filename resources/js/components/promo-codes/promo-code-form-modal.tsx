import { useForm } from '@inertiajs/react';
import { TicketPercent } from 'lucide-react';
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
import type { PromoCodeRow } from '@/components/promo-codes/types';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type PromoCodeFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    promoCode: PromoCodeRow | null;
    types: string[];
};

export function PromoCodeFormModal({
    open,
    onOpenChange,
    promoCode,
    types,
}: PromoCodeFormModalProps) {
    const { t } = useTranslations();
    const isEditing = promoCode !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            code: '',
            description: '',
            type: 'percentage',
            value: '',
            max_uses: '',
            valid_from: '',
            valid_until: '',
            active: true,
        });

    useEffect(() => {
        if (open && promoCode) {
            setData({
                code: promoCode.code,
                description: promoCode.description ?? '',
                type: promoCode.type,
                value: String(promoCode.value),
                max_uses:
                    promoCode.max_uses !== null
                        ? String(promoCode.max_uses)
                        : '',
                valid_from: promoCode.valid_from ?? '',
                valid_until: promoCode.valid_until ?? '',
                active: promoCode.active,
            });
        }
        if (open && !promoCode) {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, promoCode]);

    const typeLabel = (type: string) =>
        t(`promo_codes.type_${type}` as 'promo_codes.type_percentage');

    const canSubmit = useMemo(() => {
        const codeOk = data.code.trim().length > 0;
        const valueOk =
            data.value !== '' &&
            !Number.isNaN(Number(data.value)) &&
            Number(data.value) >= 0;

        return codeOk && valueOk && data.type !== '';
    }, [data]);

    const submit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            put(`/promo-codes/${promoCode.id}`, options);
        } else {
            post('/promo-codes', options);
        }
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                isEditing
                    ? t('promo_codes.edit_title')
                    : t('promo_codes.create_title')
            }
            description={t('promo_codes.form_hint')}
            icon={TicketPercent}
            submitLabel={
                isEditing
                    ? t('table.save_changes')
                    : t('promo_codes.create_submit')
            }
            onSubmit={submit}
            canSubmit={canSubmit}
            submitting={processing}
            size="lg"
            onAfterClose={() => {
                reset();
                clearErrors();
            }}
        >
            <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                    label={t('promo_codes.field_code')}
                    required
                    error={errors.code}
                >
                    <Input
                        value={data.code}
                        onChange={(e) =>
                            setData('code', e.target.value.toUpperCase())
                        }
                        className="bg-card font-mono uppercase"
                        disabled={isEditing}
                    />
                </FormField>

                <FormField label={t('promo_codes.field_type')} required>
                    <Select
                        value={data.type}
                        onValueChange={(v) => setData('type', v)}
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {types.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {typeLabel(type)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField
                    label={t('promo_codes.field_description')}
                    className="sm:col-span-2"
                    error={errors.description}
                >
                    <Input
                        value={data.description}
                        onChange={(e) =>
                            setData('description', e.target.value)
                        }
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('promo_codes.field_value')}
                    required
                    error={errors.value}
                >
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.value}
                        onChange={(e) => setData('value', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('promo_codes.field_max_uses')}
                    error={errors.max_uses}
                >
                    <Input
                        type="number"
                        min="1"
                        value={data.max_uses}
                        onChange={(e) => setData('max_uses', e.target.value)}
                        placeholder={t('promo_codes.unlimited')}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('promo_codes.field_valid_from')}
                    error={errors.valid_from}
                >
                    <Input
                        type="date"
                        value={data.valid_from}
                        onChange={(e) => setData('valid_from', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('promo_codes.field_valid_until')}
                    error={errors.valid_until}
                >
                    <Input
                        type="date"
                        value={data.valid_until}
                        onChange={(e) => setData('valid_until', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <label
                    className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors sm:col-span-2',
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
                    <span className="space-y-0.5">
                        <span className="block text-sm font-medium">
                            {t('promo_codes.field_active')}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                            {t('promo_codes.field_active_hint')}
                        </span>
                    </span>
                </label>
            </div>
        </BaseModal>
    );
}
