import { useForm } from '@inertiajs/react';
import { ListChecks } from 'lucide-react';
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
    FeatureCatalogItem,
    PlanFeatureRow,
    PlanOption,
} from '@/components/plan-features/types';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type PlanFeatureFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    feature: PlanFeatureRow | null;
    plans: PlanOption[];
    catalog: FeatureCatalogItem[];
};

export function PlanFeatureFormModal({
    open,
    onOpenChange,
    feature,
    plans,
    catalog,
}: PlanFeatureFormModalProps) {
    const { t } = useTranslations();
    const isEditing = feature !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            plan_id: '',
            feature: '',
            value_int: 0,
            value_bool: false,
            value_str: '',
        });

    useEffect(() => {
        if (open && feature) {
            setData({
                plan_id: feature.plan_id,
                feature: feature.feature,
                value_int: feature.value_int ?? 0,
                value_bool: feature.value_bool ?? false,
                value_str: feature.value_str ?? '',
            });
        }
        if (open && !feature) {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, feature]);

    const meta = useMemo(
        () => catalog.find((c) => c.key === data.feature),
        [catalog, data.feature],
    );

    const canSubmit = useMemo(() => {
        if (!data.plan_id || !data.feature) return false;
        if (!meta) return false;

        if (meta.type === 'string') {
            return data.value_str.trim().length > 0;
        }

        return true;
    }, [data, meta]);

    const submit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            put(`/plan-features/${feature.id}`, options);
        } else {
            post('/plan-features', options);
        }
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                isEditing
                    ? t('plan_features.edit_title')
                    : t('plan_features.create_title')
            }
            description={t('plan_features.form_hint')}
            icon={ListChecks}
            submitLabel={
                isEditing
                    ? t('table.save_changes')
                    : t('plan_features.create_submit')
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
            <div className="grid gap-5">
                <FormField
                    label={t('plan_features.field_plan')}
                    required
                    error={errors.plan_id}
                >
                    <Select
                        value={data.plan_id}
                        onValueChange={(v) => setData('plan_id', v)}
                        disabled={isEditing}
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue
                                placeholder={t('plan_features.select_plan')}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {plans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                    {plan.name} ({plan.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField
                    label={t('plan_features.field_feature')}
                    required
                    error={errors.feature}
                >
                    <Select
                        value={data.feature}
                        onValueChange={(v) => {
                            setData('feature', v);
                            const item = catalog.find((c) => c.key === v);
                            if (item?.type === 'string' && item.options?.[0]) {
                                setData('value_str', item.options[0]);
                            }
                        }}
                        disabled={isEditing}
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue
                                placeholder={t('plan_features.select_feature')}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {catalog.map((item) => (
                                <SelectItem key={item.key} value={item.key}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                {meta?.type === 'int' && (
                    <FormField
                        label={t('plan_features.field_value')}
                        required
                        hint={`-1 = ${t('plan_features.unlimited')}`}
                        error={errors.value_int}
                    >
                        <Input
                            type="number"
                            value={data.value_int}
                            onChange={(e) =>
                                setData('value_int', Number(e.target.value))
                            }
                            className="bg-card"
                        />
                    </FormField>
                )}

                {meta?.type === 'bool' && (
                    <label
                        className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors',
                            data.value_bool
                                ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                                : 'border-border bg-card',
                        )}
                    >
                        <Checkbox
                            checked={data.value_bool}
                            onCheckedChange={(v) =>
                                setData('value_bool', v === true)
                            }
                        />
                        <span className="text-sm font-medium">
                            {t('plan_features.field_value')}
                        </span>
                    </label>
                )}

                {meta?.type === 'string' && (
                    <FormField
                        label={t('plan_features.field_value')}
                        required
                        error={errors.value_str}
                    >
                        <Select
                            value={data.value_str}
                            onValueChange={(v) => setData('value_str', v)}
                        >
                            <SelectTrigger className="w-full bg-card">
                                <SelectValue
                                    placeholder={t(
                                        'plan_features.select_value',
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {(meta.options ?? []).map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                )}
            </div>
        </BaseModal>
    );
}
