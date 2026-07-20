import { useForm } from '@inertiajs/react';
import {
    Banknote,
    CreditCard,
    FileText,
    Loader2,
    Receipt,
    Search,
    Smartphone,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CajaFelConfig, CajaPendingOrder } from '@/components/caja/types';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/use-translations';
import { formatCajaMoney } from '@/lib/caja-format';
import { cn } from '@/lib/utils';

type ChargeMethod = 'efectivo' | 'tarjeta' | 'yape' | 'plin';
type DocumentType = 'nota_venta' | 'boleta' | 'factura';

const METHOD_OPTIONS: Array<{
    id: ChargeMethod;
    icon: typeof Banknote;
}> = [
    { id: 'efectivo', icon: Banknote },
    { id: 'tarjeta', icon: CreditCard },
    { id: 'yape', icon: Smartphone },
    { id: 'plin', icon: Smartphone },
];

type ChargeOrderModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: CajaPendingOrder | null;
    currency: string;
    fel: CajaFelConfig;
};

export function ChargeOrderModal({
    open,
    onOpenChange,
    order,
    currency,
    fel,
}: ChargeOrderModalProps) {
    const { t } = useTranslations();
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const lastLookupDocRef = useRef('');

    const puedeEmitirSunat =
        fel.issues_electronic_receipts &&
        fel.emite_comprobantes_sunat &&
        fel.enabled;

    const puedeBoleta = puedeEmitirSunat && fel.has_boleta_series;
    const puedeFactura = puedeEmitirSunat && fel.has_factura_series;

    const form = useForm({
        metodo: 'efectivo' as ChargeMethod,
        referencia: '',
        monto_recibido: '',
        tipo_comprobante: 'nota_venta' as DocumentType,
        cliente_tipo_doc: '' as string,
        cliente_num_doc: '',
        cliente_nombre: '',
        cliente_direccion: '',
    });

    useEffect(() => {
        if (!open) {
            form.setData({
                metodo: 'efectivo',
                referencia: '',
                monto_recibido: '',
                tipo_comprobante: 'nota_venta',
                cliente_tipo_doc: '',
                cliente_num_doc: '',
                cliente_nombre: '',
                cliente_direccion: '',
            });
            form.clearErrors();
            setLookupError(null);
            lastLookupDocRef.current = '';
        }
    }, [open]);

    useEffect(() => {
        if (form.data.metodo !== 'efectivo') {
            form.setData('monto_recibido', '');
        }
    }, [form.data.metodo]);

    useEffect(() => {
        if (form.data.tipo_comprobante === 'nota_venta') {
            form.setData({
                ...form.data,
                cliente_tipo_doc: '',
                cliente_num_doc: '',
                cliente_nombre: '',
                cliente_direccion: '',
            });
        } else if (form.data.tipo_comprobante === 'factura') {
            form.setData('cliente_tipo_doc', '6');
        } else if (form.data.tipo_comprobante === 'boleta') {
            form.setData('cliente_tipo_doc', '1');
        }
        setLookupError(null);
        lastLookupDocRef.current = '';
    }, [form.data.tipo_comprobante]);

    const submit = () => {
        if (!order) {
            return;
        }

        form.post(`/caja/cobrar/${order.id}`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    const methodLabel = (method: ChargeMethod) =>
        t(`caja.method_${method}` as 'caja.method_efectivo');

    const needsReference = form.data.metodo !== 'efectivo';
    const isCash = form.data.metodo === 'efectivo';
    const isBoleta = form.data.tipo_comprobante === 'boleta';
    const isFactura = form.data.tipo_comprobante === 'factura';
    const needsCustomer = isBoleta || isFactura;

    const lookupDocument = async (digitsOverride?: string) => {
        const digits = (digitsOverride ?? form.data.cliente_num_doc).replace(/\D/g, '');
        const docLength = isFactura ? 11 : 8;

        if (digits.length !== docLength) {
            if (isFactura) {
                setLookupError(t('fel.ruc_length'));
            } else {
                setLookupError(t('fel.dni_length'));
            }
            return;
        }

        setLookupLoading(true);
        setLookupError(null);

        try {
            const url = isFactura
                ? `/documento/ruc/${digits}`
                : `/documento/dni/${digits}`;
            const response = await fetch(url, {
                headers: { Accept: 'application/json' },
            });
            const json = (await response.json()) as {
                success: boolean;
                message?: string;
                data?: Record<string, string>;
            };

            if (!response.ok || !json.success || !json.data) {
                setLookupError(json.message ?? t('fel.lookup_failed'));
                return;
            }

            if (isFactura) {
                form.setData({
                    ...form.data,
                    cliente_nombre:
                        json.data.razon_social ??
                        json.data.nombre ??
                        form.data.cliente_nombre,
                    cliente_direccion:
                        json.data.direccion ?? form.data.cliente_direccion,
                });
            } else {
                const fullName =
                    json.data.full_name ??
                    ([
                        json.data.first_name,
                        json.data.paternal_surname,
                        json.data.maternal_surname,
                    ]
                        .filter(Boolean)
                        .join(' ') || form.data.cliente_nombre);

                form.setData({
                    ...form.data,
                    cliente_nombre: fullName,
                });
            }
        } catch {
            setLookupError(t('fel.lookup_failed'));
        } finally {
            setLookupLoading(false);
        }
    };

    useEffect(() => {
        if (!open || !needsCustomer || lookupLoading) {
            return;
        }

        const digits = form.data.cliente_num_doc.replace(/\D/g, '');
        const targetLength = isFactura ? 11 : 8;

        if (digits.length < targetLength) {
            lastLookupDocRef.current = '';
            return;
        }

        if (digits.length !== targetLength || digits === lastLookupDocRef.current) {
            return;
        }

        lastLookupDocRef.current = digits;
        void lookupDocument(digits);
    }, [
        open,
        needsCustomer,
        isFactura,
        form.data.cliente_num_doc,
        lookupLoading,
    ]);

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('caja.charge_title')}
            description={
                order
                    ? `${t('caja.order', { number: order.number })} · ${formatCajaMoney(order.total, currency)}`
                    : undefined
            }
            icon={Receipt}
            submitLabel={t('caja.charge_confirm')}
            onSubmit={submit}
            submitting={form.processing}
        >
            <div className="space-y-4">
                <FormField label={t('fel.document_type')} error={form.errors.tipo_comprobante}>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <button
                            type="button"
                            onClick={() => form.setData('tipo_comprobante', 'nota_venta')}
                            className={cn(
                                'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                                form.data.tipo_comprobante === 'nota_venta'
                                    ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                                    : 'border-border hover:bg-muted/50',
                            )}
                        >
                            <FileText className="size-4 shrink-0" />
                            <span className="font-medium">{t('fel.doc_nota_venta')}</span>
                        </button>
                        {puedeBoleta ? (
                            <button
                                type="button"
                                onClick={() => form.setData('tipo_comprobante', 'boleta')}
                                className={cn(
                                    'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                                    form.data.tipo_comprobante === 'boleta'
                                        ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                                        : 'border-border hover:bg-muted/50',
                                )}
                            >
                                <Receipt className="size-4 shrink-0" />
                                <span className="font-medium">{t('fel.doc_boleta')}</span>
                            </button>
                        ) : null}
                        {puedeFactura ? (
                            <button
                                type="button"
                                onClick={() => form.setData('tipo_comprobante', 'factura')}
                                className={cn(
                                    'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                                    form.data.tipo_comprobante === 'factura'
                                        ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                                        : 'border-border hover:bg-muted/50',
                                )}
                            >
                                <FileText className="size-4 shrink-0" />
                                <span className="font-medium">{t('fel.doc_factura')}</span>
                            </button>
                        ) : null}
                    </div>
                    {!puedeEmitirSunat && fel.issues_electronic_receipts && !fel.emite_comprobantes_sunat ? (
                        <p className="mt-1.5 text-xs text-amber-700">
                            {t('fel.apisunat_required_hint')}
                        </p>
                    ) : null}
                    {puedeEmitirSunat && !puedeBoleta && !puedeFactura ? (
                        <p className="mt-1.5 text-xs text-amber-700">
                            {t('fel.no_default_series_hint', {
                                ambiente: t(
                                    `fel.mode_${fel.apisunat_mode}_short` as 'fel.mode_sandbox_short',
                                ),
                            })}
                        </p>
                    ) : null}
                    {!fel.enabled && fel.emite_comprobantes_sunat ? (
                        <p className="mt-1.5 text-xs text-amber-700">
                            {t('fel.apisunat_required_hint')}
                        </p>
                    ) : null}
                </FormField>

                {needsCustomer ? (
                    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
                        <p className="text-sm font-medium">{t('fel.customer_section')}</p>

                        <FormField
                            label={isFactura ? t('fel.field_ruc') : t('fel.field_dni')}
                            error={form.errors.cliente_num_doc}
                        >
                            <div className="flex gap-2">
                                <Input
                                    value={form.data.cliente_num_doc}
                                    onChange={(e) =>
                                        form.setData(
                                            'cliente_num_doc',
                                            e.target.value.replace(/\D/g, '').slice(0, isFactura ? 11 : 8),
                                        )
                                    }
                                    placeholder={isFactura ? '20123456789' : '12345678'}
                                    className="font-mono"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    disabled={lookupLoading}
                                    onClick={() => void lookupDocument()}
                                    title={t('fel.lookup_button')}
                                >
                                    {lookupLoading ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Search className="size-4" />
                                    )}
                                </Button>
                            </div>
                            {isBoleta ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('fel.boleta_dni_optional')}
                                </p>
                            ) : null}
                            {lookupError ? (
                                <p className="mt-1 text-xs text-red-600">{lookupError}</p>
                            ) : null}
                        </FormField>

                        <FormField
                            label={t('fel.field_name')}
                            error={form.errors.cliente_nombre}
                        >
                            <Input
                                value={form.data.cliente_nombre}
                                onChange={(e) => form.setData('cliente_nombre', e.target.value)}
                                placeholder={t('fel.field_name_placeholder')}
                            />
                        </FormField>

                        {isFactura ? (
                            <FormField
                                label={t('fel.field_address')}
                                error={form.errors.cliente_direccion}
                            >
                                <Input
                                    value={form.data.cliente_direccion}
                                    onChange={(e) =>
                                        form.setData('cliente_direccion', e.target.value)
                                    }
                                    placeholder={t('fel.field_address_placeholder')}
                                />
                            </FormField>
                        ) : null}
                    </div>
                ) : null}

                <FormField label={t('caja.payment_method')} error={form.errors.metodo}>
                    <div className="grid grid-cols-2 gap-2">
                        {METHOD_OPTIONS.map(({ id, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => form.setData('metodo', id)}
                                className={cn(
                                    'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                                    form.data.metodo === id
                                        ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                                        : 'border-border hover:bg-muted/50',
                                )}
                            >
                                <Icon className="size-4 shrink-0" />
                                <span className="font-medium">{methodLabel(id)}</span>
                            </button>
                        ))}
                    </div>
                </FormField>

                {isCash && (
                    <FormField
                        label={t('caja.amount_received')}
                        error={form.errors.monto_recibido}
                    >
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.data.monto_recibido}
                            onChange={(e) =>
                                form.setData('monto_recibido', e.target.value)
                            }
                            placeholder={t('caja.amount_received_placeholder')}
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            {t('caja.amount_received_hint')}
                        </p>
                    </FormField>
                )}

                {needsReference && (
                    <FormField
                        label={t('caja.reference')}
                        error={form.errors.referencia}
                    >
                        <Input
                            value={form.data.referencia}
                            onChange={(e) => form.setData('referencia', e.target.value)}
                            placeholder={t('caja.reference_placeholder')}
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            {t('caja.reference_hint')}
                        </p>
                    </FormField>
                )}

                {form.errors.order && (
                    <p className="text-sm text-red-600">{form.errors.order}</p>
                )}
                {form.errors.session && (
                    <p className="text-sm text-red-600">{form.errors.session}</p>
                )}
            </div>
        </BaseModal>
    );
}
