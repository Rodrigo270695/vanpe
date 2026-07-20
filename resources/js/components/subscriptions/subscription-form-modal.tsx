import { useForm } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
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
    PlanOption,
    SubscriptionRow,
    TenantOption,
} from '@/components/subscriptions/types';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type SubscriptionFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subscription: SubscriptionRow | null;
    tenants: TenantOption[];
    plans: PlanOption[];
    statuses: string[];
    billingCycles: string[];
    subscribedTenantIds: string[];
};

function toDateInput(iso: string | null): string {
    if (!iso) return '';
    return iso.slice(0, 10);
}

export function SubscriptionFormModal({
    open,
    onOpenChange,
    subscription,
    tenants,
    plans,
    statuses,
    billingCycles,
    subscribedTenantIds,
}: SubscriptionFormModalProps) {
    const { t } = useTranslations();
    const isEditing = subscription !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            tenant_id: '',
            plan_id: '',
            status: 'trial',
            billing_cycle: 'monthly',
            current_price: '',
            reservation_commission: '',
            period_start: new Date().toISOString().slice(0, 10),
            period_end: new Date(Date.now() + 14 * 86400000)
                .toISOString()
                .slice(0, 10),
            auto_renew: true,
        });

    useEffect(() => {
        if (open && subscription) {
            setData({
                tenant_id: subscription.tenant_id,
                plan_id: subscription.plan_id,
                status: subscription.status,
                billing_cycle: subscription.billing_cycle,
                current_price: String(subscription.current_price),
                reservation_commission: String(
                    subscription.reservation_commission,
                ),
                period_start: toDateInput(subscription.period_start),
                period_end: toDateInput(subscription.period_end),
                auto_renew: subscription.auto_renew,
            });
        }
        if (open && !subscription) {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, subscription]);

    const applyPlanDefaults = (planId: string, cycle: string) => {
        const plan = plans.find((p) => p.id === planId);
        if (!plan) return;
        setData('plan_id', planId);
        setData(
            'current_price',
            String(
                cycle === 'yearly'
                    ? plan.yearly_price ?? Number(plan.monthly_price) * 12
                    : plan.monthly_price,
            ),
        );
        setData(
            'reservation_commission',
            String(plan.reservation_commission),
        );
    };

    const availableTenants = tenants.filter(
        (tenant) =>
            isEditing
                ? tenant.id === subscription?.tenant_id
                : !subscribedTenantIds.includes(tenant.id),
    );

    const canSubmit = useMemo(() => {
        const tenantOk = isEditing || data.tenant_id !== '';
        const planOk = data.plan_id !== '';
        const priceOk =
            data.current_price !== '' &&
            !Number.isNaN(Number(data.current_price)) &&
            Number(data.current_price) >= 0;
        const datesOk =
            data.period_start !== '' &&
            data.period_end !== '' &&
            data.period_end > data.period_start;

        return tenantOk && planOk && priceOk && datesOk;
    }, [data, isEditing]);

    const submit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            put(`/subscriptions/${subscription.id}`, options);
        } else {
            post('/subscriptions', options);
        }
    };

    const statusLabel = (status: string) =>
        t(`subscriptions.status_${status}` as 'subscriptions.status_trial');

    const cycleLabel = (cycle: string) =>
        t(
            cycle === 'yearly'
                ? 'subscriptions.cycle_yearly'
                : 'subscriptions.cycle_monthly',
        );

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                isEditing
                    ? t('subscriptions.edit_title')
                    : t('subscriptions.create_title')
            }
            description={t('subscriptions.form_hint')}
            icon={CreditCard}
            submitLabel={
                isEditing
                    ? t('table.save_changes')
                    : t('subscriptions.create_submit')
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
                    label={t('subscriptions.field_tenant')}
                    required={!isEditing}
                    error={errors.tenant_id}
                    className="sm:col-span-2"
                >
                    <Select
                        value={data.tenant_id}
                        onValueChange={(v) => setData('tenant_id', v)}
                        disabled={isEditing}
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue
                                placeholder={t('subscriptions.select_tenant')}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {availableTenants.map((tenant) => (
                                <SelectItem key={tenant.id} value={tenant.id}>
                                    {tenant.nombre_comercial} ({tenant.slug})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField
                    label={t('subscriptions.field_plan')}
                    required
                    error={errors.plan_id}
                >
                    <Select
                        value={data.plan_id}
                        onValueChange={(v) =>
                            applyPlanDefaults(v, data.billing_cycle)
                        }
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue
                                placeholder={t('subscriptions.select_plan')}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {plans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                    {plan.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField label={t('subscriptions.field_cycle')} required>
                    <Select
                        value={data.billing_cycle}
                        onValueChange={(v) => {
                            setData('billing_cycle', v);
                            if (data.plan_id) {
                                applyPlanDefaults(data.plan_id, v);
                            }
                        }}
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {billingCycles.map((cycle) => (
                                <SelectItem key={cycle} value={cycle}>
                                    {cycleLabel(cycle)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField label={t('subscriptions.field_status')} required>
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

                <FormField
                    label={t('subscriptions.field_price')}
                    required
                    error={errors.current_price}
                >
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.current_price}
                        onChange={(e) =>
                            setData('current_price', e.target.value)
                        }
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('subscriptions.field_period_start')}
                    required
                    error={errors.period_start}
                >
                    <Input
                        type="date"
                        value={data.period_start}
                        onChange={(e) =>
                            setData('period_start', e.target.value)
                        }
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('subscriptions.field_period_end')}
                    required
                    error={errors.period_end}
                >
                    <Input
                        type="date"
                        value={data.period_end}
                        onChange={(e) => setData('period_end', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <label
                    className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors sm:col-span-2',
                        data.auto_renew
                            ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                            : 'border-border bg-card',
                    )}
                >
                    <Checkbox
                        checked={data.auto_renew}
                        onCheckedChange={(v) =>
                            setData('auto_renew', v === true)
                        }
                        className="mt-0.5"
                    />
                    <span className="space-y-0.5">
                        <span className="block text-sm font-medium">
                            {t('subscriptions.field_auto_renew')}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                            {t('subscriptions.field_auto_renew_hint')}
                        </span>
                    </span>
                </label>
            </div>
        </BaseModal>
    );
}
