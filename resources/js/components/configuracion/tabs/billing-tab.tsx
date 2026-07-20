import { useForm } from '@inertiajs/react';
import { CheckCircle2, Eye, EyeOff, KeyRound, Receipt } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { FormField } from '@/components/common/form-field';
import { ConfigSection } from '@/components/configuracion/config-section';
import { ConfigTabSaveFooter } from '@/components/configuracion/config-tab-save-footer';
import { FelSeriesSection } from '@/components/configuracion/fel-series-section';
import type { ConfigSettings, FelSerieRow } from '@/components/configuracion/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type BillingFormData = {
    currency: string;
    issues_electronic_receipts: boolean;
    tax_rate: string;
    prices_include_tax: boolean;
    emite_comprobantes_sunat: boolean;
    apisunat_mode: 'sandbox' | 'produccion';
    apisunat_token: string;
    clear_apisunat: boolean;
};

type BillingTabProps = {
    settings: ConfigSettings;
    felSeries: FelSerieRow[];
    canManage: boolean;
    canInvoicing: boolean;
};

export function BillingTab({
    settings,
    felSeries,
    canManage,
    canInvoicing,
}: BillingTabProps) {
    const { t } = useTranslations();
    const [showToken, setShowToken] = useState(false);
    const [clearApisunat, setClearApisunat] = useState(false);

    const { data, setData, put, processing, errors } = useForm<BillingFormData>({
        currency: settings.currency,
        issues_electronic_receipts: settings.issues_electronic_receipts,
        tax_rate: String(
            settings.issues_electronic_receipts ? settings.tax_rate : 0,
        ),
        prices_include_tax: settings.prices_include_tax,
        emite_comprobantes_sunat: settings.emite_comprobantes_sunat,
        apisunat_mode: settings.apisunat_mode ?? 'sandbox',
        apisunat_token: '',
        clear_apisunat: false,
    });

    const taxPreset = (() => {
        const rate = Number(data.tax_rate);
        if (Math.abs(rate - 10.5) < 0.001) return '10.5';
        if (Math.abs(rate - 18) < 0.001) return '18';
        return 'custom';
    })();

    const handleReceiptsToggle = (enabled: boolean) => {
        setData({
            ...data,
            issues_electronic_receipts: enabled,
            emite_comprobantes_sunat: enabled ? data.emite_comprobantes_sunat : false,
            tax_rate: enabled
                ? data.tax_rate === '0' || data.tax_rate === ''
                    ? '10.5'
                    : data.tax_rate
                : '0',
        });
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put('/configuracion/billing', {
            preserveScroll: true,
            transform: (formData) => ({
                ...formData,
                clear_apisunat: clearApisunat,
            }),
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-5">
            <ConfigSection
                title={t('configuracion.section_billing')}
                description={t('configuracion.section_billing_hint')}
                icon={<Receipt className="size-5" />}
                iconClass="bg-amber-100 text-amber-800 ring-amber-200/80"
                headerClass="bg-gradient-to-r from-amber-500/10 via-orange-50/80 to-yellow-500/8"
            >
                <FormField
                    label={t('configuracion.field_currency')}
                    required
                    error={errors.currency}
                >
                    <Select
                        value={data.currency}
                        onValueChange={(v) => setData('currency', v)}
                        disabled={!canManage}
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PEN">
                                {t('configuracion.currency_pen')}
                            </SelectItem>
                            <SelectItem value="USD">
                                {t('configuracion.currency_usd')}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </FormField>

                <div className="sm:col-span-2" />

                <label
                    className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors sm:col-span-2',
                        data.issues_electronic_receipts
                            ? 'border-amber-300/60 bg-amber-50/60'
                            : 'border-border bg-card',
                        !canManage && 'cursor-default opacity-70',
                    )}
                >
                    <Checkbox
                        checked={data.issues_electronic_receipts}
                        onCheckedChange={(v) => handleReceiptsToggle(v === true)}
                        disabled={!canManage}
                        className="mt-0.5"
                    />
                    <span className="space-y-1">
                        <span className="block text-sm font-medium">
                            {t('configuracion.field_issues_electronic_receipts')}
                        </span>
                        <span className="block text-[12px] text-muted-foreground">
                            {t('configuracion.field_issues_electronic_receipts_hint')}
                        </span>
                    </span>
                </label>

                {!data.issues_electronic_receipts && (
                    <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-[13px] text-muted-foreground sm:col-span-2">
                        {t('configuracion.no_receipts_hint')}
                    </p>
                )}

                {data.issues_electronic_receipts && (
                    <>
                        <FormField
                            label={t('configuracion.field_tax_preset')}
                            required
                            className="sm:col-span-2"
                        >
                            <Select
                                value={taxPreset}
                                onValueChange={(v) => {
                                    if (v === '10.5' || v === '18') {
                                        setData('tax_rate', v);
                                    }
                                }}
                                disabled={!canManage}
                            >
                                <SelectTrigger className="w-full bg-card">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10.5">
                                        {t('configuracion.tax_preset_mype')}
                                    </SelectItem>
                                    <SelectItem value="18">
                                        {t('configuracion.tax_preset_standard')}
                                    </SelectItem>
                                    <SelectItem value="custom">
                                        {t('configuracion.tax_preset_custom')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="mt-2 text-[12px] text-muted-foreground">
                                {t('configuracion.tax_mype_hint')}
                            </p>
                        </FormField>

                        <FormField
                            label={t('configuracion.field_tax_rate')}
                            required
                            error={errors.tax_rate}
                        >
                            <div className="relative">
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.01"
                                    value={data.tax_rate}
                                    onChange={(e) =>
                                        setData('tax_rate', e.target.value)
                                    }
                                    disabled={!canManage || taxPreset !== 'custom'}
                                    className="bg-card pr-8 font-mono"
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                                    %
                                </span>
                            </div>
                        </FormField>

                        <label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors sm:col-span-2',
                                data.prices_include_tax
                                    ? 'border-amber-300/60 bg-amber-50/60'
                                    : 'border-border bg-card',
                                !canManage && 'cursor-default opacity-70',
                            )}
                        >
                            <Checkbox
                                checked={data.prices_include_tax}
                                onCheckedChange={(v) =>
                                    setData('prices_include_tax', v === true)
                                }
                                disabled={!canManage}
                                className="mt-0.5"
                            />
                            <span className="block text-sm font-medium">
                                {t('configuracion.field_prices_include_tax')}
                            </span>
                        </label>

                        <label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors sm:col-span-2',
                                data.emite_comprobantes_sunat
                                    ? 'border-emerald-300/60 bg-emerald-50/60'
                                    : 'border-border bg-card',
                                !canManage && 'cursor-default opacity-70',
                            )}
                        >
                            <Checkbox
                                checked={data.emite_comprobantes_sunat}
                                onCheckedChange={(v) =>
                                    setData('emite_comprobantes_sunat', v === true)
                                }
                                disabled={!canManage}
                                className="mt-0.5"
                            />
                            <span className="space-y-1">
                                <span className="block text-sm font-medium">
                                    {t('fel.enable_sunat')}
                                </span>
                                <span className="block text-[12px] text-muted-foreground">
                                    {t('fel.enable_sunat_hint')}
                                </span>
                            </span>
                        </label>

                        {data.emite_comprobantes_sunat ? (
                            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 sm:col-span-2">
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <KeyRound className="size-4" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold">
                                            {t('fel.apisunat_title')}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {t('fel.apisunat_hint')}
                                        </p>
                                    </div>
                                    {settings.apisunat_configurado && !clearApisunat ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                                            <CheckCircle2 className="size-3" />
                                            {t('fel.apisunat_configured')}
                                        </span>
                                    ) : null}
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <FormField
                                        label={t('fel.apisunat_mode')}
                                        error={errors.apisunat_mode}
                                    >
                                        <Select
                                            value={data.apisunat_mode}
                                            onValueChange={(v) =>
                                                setData(
                                                    'apisunat_mode',
                                                    v as 'sandbox' | 'produccion',
                                                )
                                            }
                                            disabled={!canManage}
                                        >
                                            <SelectTrigger className="bg-card">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sandbox">
                                                    {t('fel.apisunat_sandbox')}
                                                </SelectItem>
                                                <SelectItem value="produccion">
                                                    {t('fel.apisunat_production')}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormField>

                                    <FormField
                                        label={
                                            settings.apisunat_configurado
                                                ? t('fel.apisunat_token_new')
                                                : t('fel.apisunat_token')
                                        }
                                        error={errors.apisunat_token}
                                        className="sm:col-span-2"
                                    >
                                        <div className="relative">
                                            <Input
                                                type={showToken ? 'text' : 'password'}
                                                value={data.apisunat_token}
                                                onChange={(e) =>
                                                    setData('apisunat_token', e.target.value)
                                                }
                                                placeholder={
                                                    settings.apisunat_configurado
                                                        ? '••••••••••••••••'
                                                        : 'eyJhbGciOiJIUzI1NiIs...'
                                                }
                                                disabled={!canManage || clearApisunat}
                                                autoComplete="off"
                                                className="bg-card pr-10 font-mono text-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowToken((v) => !v)}
                                                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                                            >
                                                {showToken ? (
                                                    <EyeOff className="size-4" />
                                                ) : (
                                                    <Eye className="size-4" />
                                                )}
                                            </button>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {t('fel.apisunat_token_hint')}
                                        </p>
                                    </FormField>
                                </div>

                                {settings.apisunat_configurado && canManage ? (
                                    <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={clearApisunat}
                                            onCheckedChange={(v) =>
                                                setClearApisunat(v === true)
                                            }
                                        />
                                        {t('fel.apisunat_clear')}
                                    </label>
                                ) : null}
                            </div>
                        ) : null}

                        {data.emite_comprobantes_sunat && canInvoicing ? (
                            <FelSeriesSection
                                series={felSeries}
                                canManage={canManage && canInvoicing}
                            />
                        ) : null}
                    </>
                )}
            </ConfigSection>

            <ConfigTabSaveFooter canManage={canManage} processing={processing} />
        </form>
    );
}
