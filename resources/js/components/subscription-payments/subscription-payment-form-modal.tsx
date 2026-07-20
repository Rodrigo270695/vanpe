import { useForm } from '@inertiajs/react';
import { Receipt } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    SubscriptionOption,
    SubscriptionPaymentRow,
} from '@/components/subscription-payments/types';
import { useTranslations } from '@/hooks/use-translations';

type SubscriptionPaymentFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payment: SubscriptionPaymentRow | null;
    subscriptions: SubscriptionOption[];
    concepts: string[];
    statuses: string[];
    gateways: string[];
};

function toDateInput(iso: string | null): string {
    if (!iso) return '';
    return iso.slice(0, 10);
}

export function SubscriptionPaymentFormModal({
    open,
    onOpenChange,
    payment,
    subscriptions,
    concepts,
    statuses,
    gateways,
}: SubscriptionPaymentFormModalProps) {
    const { t } = useTranslations();
    const isEditing = payment !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            subscription_id: '',
            tenant_id: '',
            concept: 'subscription',
            amount: '',
            currency: 'PEN',
            status: 'pending',
            gateway: '',
            gateway_ref: '',
            paid_at: '',
            period_from: '',
            period_to: '',
        });

    useEffect(() => {
        if (open && payment) {
            setData({
                subscription_id: payment.subscription_id,
                tenant_id: payment.tenant_id,
                concept: payment.concept,
                amount: String(payment.amount),
                currency: payment.currency,
                status: payment.status,
                gateway: payment.gateway ?? '',
                gateway_ref: payment.gateway_ref ?? '',
                paid_at: toDateInput(payment.paid_at),
                period_from: payment.period_from ?? '',
                period_to: payment.period_to ?? '',
            });
        }
        if (open && !payment) {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, payment]);

    const applySubscription = (subscriptionId: string) => {
        const sub = subscriptions.find((s) => s.id === subscriptionId);
        if (!sub) return;
        setData('subscription_id', subscriptionId);
        setData('tenant_id', sub.tenant_id);
    };

    const conceptLabel = (concept: string) =>
        t(
            `subscription_payments.concept_${concept}` as 'subscription_payments.concept_subscription',
        );

    const statusLabel = (status: string) =>
        t(
            `subscription_payments.status_${status}` as 'subscription_payments.status_pending',
        );

    const gatewayLabel = (gateway: string) =>
        t(
            `subscription_payments.gateway_${gateway}` as 'subscription_payments.gateway_culqi',
        );

    const canSubmit = useMemo(() => {
        const amountOk =
            data.amount !== '' &&
            !Number.isNaN(Number(data.amount)) &&
            Number(data.amount) >= 0;

        return (
            data.subscription_id !== '' &&
            data.tenant_id !== '' &&
            amountOk &&
            data.currency.trim().length === 3
        );
    }, [data]);

    const submit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            put(`/subscription-payments/${payment.id}`, options);
        } else {
            post('/subscription-payments', options);
        }
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                isEditing
                    ? t('subscription_payments.edit_title')
                    : t('subscription_payments.create_title')
            }
            description={t('subscription_payments.form_hint')}
            icon={Receipt}
            submitLabel={
                isEditing
                    ? t('table.save_changes')
                    : t('subscription_payments.create_submit')
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
                    label={t('subscription_payments.field_subscription')}
                    required
                    error={errors.subscription_id}
                    className="sm:col-span-2"
                >
                    <Select
                        value={data.subscription_id}
                        onValueChange={applySubscription}
                        disabled={isEditing}
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue
                                placeholder={t(
                                    'subscription_payments.select_subscription',
                                )}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {subscriptions.map((sub) => (
                                <SelectItem key={sub.id} value={sub.id}>
                                    {sub.tenant_name} · {sub.plan_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField label={t('subscription_payments.field_concept')} required>
                    <Select
                        value={data.concept}
                        onValueChange={(v) => setData('concept', v)}
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {concepts.map((concept) => (
                                <SelectItem key={concept} value={concept}>
                                    {conceptLabel(concept)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField label={t('subscription_payments.field_status')} required>
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
                    label={t('subscription_payments.field_amount')}
                    required
                    error={errors.amount}
                >
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.amount}
                        onChange={(e) => setData('amount', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('subscription_payments.field_currency')}
                    required
                    error={errors.currency}
                >
                    <Input
                        value={data.currency}
                        onChange={(e) =>
                            setData('currency', e.target.value.toUpperCase())
                        }
                        maxLength={3}
                        className="bg-card font-mono uppercase"
                    />
                </FormField>

                <FormField label={t('subscription_payments.field_gateway')}>
                    <Select
                        value={data.gateway || 'none'}
                        onValueChange={(v) =>
                            setData('gateway', v === 'none' ? '' : v)
                        }
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue
                                placeholder={t('subscription_payments.no_gateway')}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">
                                {t('subscription_payments.no_gateway')}
                            </SelectItem>
                            {gateways.map((gateway) => (
                                <SelectItem key={gateway} value={gateway}>
                                    {gatewayLabel(gateway)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField
                    label={t('subscription_payments.field_gateway_ref')}
                    error={errors.gateway_ref}
                >
                    <Input
                        value={data.gateway_ref}
                        onChange={(e) => setData('gateway_ref', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('subscription_payments.field_paid_at')}
                    error={errors.paid_at}
                >
                    <Input
                        type="date"
                        value={data.paid_at}
                        onChange={(e) => setData('paid_at', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('subscription_payments.field_period_from')}
                    error={errors.period_from}
                >
                    <Input
                        type="date"
                        value={data.period_from}
                        onChange={(e) => setData('period_from', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('subscription_payments.field_period_to')}
                    error={errors.period_to}
                >
                    <Input
                        type="date"
                        value={data.period_to}
                        onChange={(e) => setData('period_to', e.target.value)}
                        className="bg-card"
                    />
                </FormField>
            </div>
        </BaseModal>
    );
}
