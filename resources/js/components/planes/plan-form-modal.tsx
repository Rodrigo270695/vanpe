import { useForm } from '@inertiajs/react';
import { Layers } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { PlanRow } from '@/components/planes/types';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type PlanFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan: PlanRow | null;
};

const DEFAULT_COLOR = '#0744a9';

export function PlanFormModal({ open, onOpenChange, plan }: PlanFormModalProps) {
    const { t } = useTranslations();
    const isEditing = plan !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            description: '',
            badge: '',
            color_hex: DEFAULT_COLOR,
            monthly_price: '',
            yearly_price: '',
            trial_days: 14,
            reservation_commission: '0',
            is_public: true,
            active: true,
        });

    useEffect(() => {
        if (open && plan) {
            setData({
                name: plan.name,
                description: plan.description ?? '',
                badge: plan.badge ?? '',
                color_hex: plan.color_hex ?? DEFAULT_COLOR,
                monthly_price: String(plan.monthly_price),
                yearly_price: plan.yearly_price ? String(plan.yearly_price) : '',
                trial_days: plan.trial_days,
                reservation_commission: String(plan.reservation_commission),
                is_public: plan.is_public,
                active: plan.active,
            });
        }
        if (open && !plan) {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, plan]);

    const canSubmit = useMemo(() => {
        const nameOk = data.name.trim().length > 0;
        const monthlyOk =
            data.monthly_price !== '' &&
            !Number.isNaN(Number(data.monthly_price)) &&
            Number(data.monthly_price) >= 0;
        const commissionOk =
            data.reservation_commission !== '' &&
            !Number.isNaN(Number(data.reservation_commission)) &&
            Number(data.reservation_commission) >= 0;
        const trialOk =
            !Number.isNaN(data.trial_days) &&
            data.trial_days >= 0 &&
            data.trial_days <= 365;

        return nameOk && monthlyOk && commissionOk && trialOk;
    }, [data]);

    const submit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            put(`/planes/${plan.id}`, options);
        } else {
            post('/planes', options);
        }
    };

    const colorValue =
        /^#[0-9A-Fa-f]{6}$/.test(data.color_hex) ? data.color_hex : DEFAULT_COLOR;

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? t('plans.edit_title') : t('plans.create_title')}
            description={t('plans.form_hint')}
            icon={Layers}
            submitLabel={
                isEditing ? t('table.save_changes') : t('plans.create_submit')
            }
            onSubmit={submit}
            canSubmit={canSubmit}
            submitting={processing}
            size="xl"
            onAfterClose={() => {
                reset();
                clearErrors();
            }}
        >
            <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                    label={t('plans.field_name')}
                    htmlFor="plan-name"
                    required
                    error={errors.name}
                    className="sm:col-span-2"
                >
                    <Input
                        id="plan-name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder={t('plans.field_name_placeholder')}
                        autoFocus
                    />
                </FormField>

                <FormField
                    label={t('plans.field_description')}
                    htmlFor="plan-desc"
                    error={errors.description}
                    className="sm:col-span-2"
                >
                    <Input
                        id="plan-desc"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder={t('plans.field_description_placeholder')}
                    />
                </FormField>

                <FormField label={t('plans.field_badge')} htmlFor="plan-badge">
                    <Input
                        id="plan-badge"
                        value={data.badge}
                        onChange={(e) => setData('badge', e.target.value)}
                        placeholder={t('plans.field_badge_placeholder')}
                    />
                </FormField>

                <FormField
                    label={t('plans.field_color')}
                    error={errors.color_hex}
                >
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={colorValue}
                            onChange={(e) =>
                                setData('color_hex', e.target.value)
                            }
                            className="size-10 shrink-0 cursor-pointer rounded-lg border border-border bg-card p-1"
                            aria-label={t('plans.field_color')}
                        />
                        <Input
                            value={data.color_hex}
                            onChange={(e) =>
                                setData('color_hex', e.target.value)
                            }
                            placeholder={DEFAULT_COLOR}
                            className="font-mono"
                        />
                    </div>
                </FormField>

                <FormField
                    label={t('plans.field_monthly_price')}
                    required
                    error={errors.monthly_price}
                >
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.monthly_price}
                        onChange={(e) =>
                            setData('monthly_price', e.target.value)
                        }
                        placeholder="0.00"
                    />
                </FormField>

                <FormField label={t('plans.field_yearly_price')}>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.yearly_price}
                        onChange={(e) =>
                            setData('yearly_price', e.target.value)
                        }
                        placeholder={t('plans.field_yearly_optional')}
                    />
                </FormField>

                <FormField
                    label={t('plans.field_trial_days')}
                    required
                    error={errors.trial_days}
                >
                    <Input
                        type="number"
                        min="0"
                        max="365"
                        value={data.trial_days}
                        onChange={(e) =>
                            setData('trial_days', Number(e.target.value))
                        }
                    />
                </FormField>

                <FormField
                    label={t('plans.field_commission')}
                    required
                    error={errors.reservation_commission}
                >
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.reservation_commission}
                        onChange={(e) =>
                            setData('reservation_commission', e.target.value)
                        }
                        placeholder="0.00"
                    />
                </FormField>

                <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                    <ToggleCard
                        checked={data.is_public}
                        onChange={(v) => setData('is_public', v)}
                        label={t('plans.field_is_public')}
                        description={t('plans.field_is_public_hint')}
                    />
                    <ToggleCard
                        checked={data.active}
                        onChange={(v) => setData('active', v)}
                        label={t('plans.field_active')}
                        description={t('plans.field_active_hint')}
                    />
                </div>
            </div>
        </BaseModal>
    );
}

type ToggleCardProps = {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
    description: string;
};

function ToggleCard({
    checked,
    onChange,
    label,
    description,
}: ToggleCardProps) {
    return (
        <label
            className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                checked
                    ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                    : 'border-border bg-card hover:bg-muted/40',
            )}
        >
            <Checkbox
                checked={checked}
                onCheckedChange={(v) => onChange(v === true)}
                className="mt-0.5"
            />
            <span className="space-y-0.5">
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted-foreground">
                    {description}
                </span>
            </span>
        </label>
    );
}
