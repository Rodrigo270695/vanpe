import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileText,
    RefreshCw,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { SaleTicket } from '@/components/ventas/types';
import { FelDocumentBadges } from '@/components/fel/fel-document-badges';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslations } from '@/hooks/use-translations';
import { formatCajaMoney } from '@/lib/caja-format';
import { cn } from '@/lib/utils';

type FelEmissionStatusModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticket: SaleTicket;
    returnTo?: 'caja' | 'ventas';
};

function resolveFelState(ticket: SaleTicket): 'emitido' | 'rechazado' | 'pendiente' | 'sin_cpe' {
    const docEstado = ticket.fel?.estado;
    const saleEstado = ticket.fel_estado;

    if (docEstado === 'emitido' || saleEstado === 'emitido') {
        return 'emitido';
    }
    if (docEstado === 'rechazado' || saleEstado === 'rechazado') {
        return 'rechazado';
    }
    if (docEstado === 'pendiente' || saleEstado === 'pendiente_emision') {
        return 'pendiente';
    }

    return 'sin_cpe';
}

export function FelEmissionStatusModal({
    open,
    onOpenChange,
    ticket,
    returnTo = 'caja',
}: FelEmissionStatusModalProps) {
    const { t } = useTranslations();
    const [submitting, setSubmitting] = useState(false);

    const fel = ticket.fel;
    const state = resolveFelState(ticket);
    const hasPdf = Boolean(fel?.url_pdf_ticket ?? fel?.url_pdf);
    const errorMessage = fel?.error_mensaje?.trim();
    const canRetry = Boolean(ticket.can_emit_fel);

    const titleKey =
        ticket.document_type === 'factura'
            ? 'fel.cpe_modal_title_factura'
            : 'fel.cpe_modal_title_boleta';

    const retry = () => {
        setSubmitting(true);
        router.post(
            `/ventas/${ticket.id}/emitir-fel`,
            { return_to: returnTo },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const statusConfig = (() => {
        if (state === 'rechazado') {
            return {
                icon: XCircle,
                tone: 'border-red-200 bg-red-50 text-red-800',
                title: t('fel.emission_status_rejected_title'),
                description: t('fel.emission_status_rejected_description'),
            };
        }
        if (state === 'pendiente') {
            return {
                icon: Clock,
                tone: 'border-amber-200 bg-amber-50 text-amber-800',
                title: t('fel.emission_status_pending_title'),
                description: t('fel.emission_status_pending_description'),
            };
        }
        if (state === 'emitido' && !hasPdf) {
            return {
                icon: AlertTriangle,
                tone: 'border-amber-200 bg-amber-50 text-amber-800',
                title: t('fel.emission_status_no_pdf_title'),
                description: t('fel.emission_status_no_pdf_description'),
            };
        }

        return {
            icon: AlertTriangle,
            tone: 'border-slate-200 bg-slate-50 text-slate-700',
            title: t('fel.emission_status_unknown_title'),
            description: t('fel.emission_status_unknown_description'),
        };
    })();

    const StatusIcon = statusConfig.icon;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[92vh] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="shrink-0 border-b border-border bg-gradient-to-r from-brand-blue/[0.06] via-transparent to-brand-orange/[0.04] px-6 py-5">
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/15">
                            <FileText className="size-5" />
                        </span>
                        <div className="min-w-0 space-y-1">
                            <DialogTitle className="text-lg">
                                {fel?.numero_completo
                                    ? t(titleKey, { number: fel.numero_completo })
                                    : t('fel.emission_status_title')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('fel.emission_status_sale_paid', { number: ticket.numero })}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
                    <div
                        className={cn(
                            'flex gap-3 rounded-xl border p-4',
                            statusConfig.tone,
                        )}
                    >
                        <StatusIcon className="mt-0.5 size-5 shrink-0" />
                        <div className="min-w-0 space-y-1">
                            <p className="text-sm font-semibold">{statusConfig.title}</p>
                            <p className="text-sm opacity-90">{statusConfig.description}</p>
                        </div>
                    </div>

                    {fel ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <FelDocumentBadges document={fel} />
                            {state === 'emitido' ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                    <CheckCircle2 className="size-3" />
                                    {t('fel.status_emitido')}
                                </span>
                            ) : null}
                        </div>
                    ) : null}

                    {errorMessage ? (
                        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-700">
                                {t('fel.emission_error_label')}
                            </p>
                            <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-red-900">
                                {errorMessage}
                            </p>
                        </div>
                    ) : null}

                    <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div>
                                <dt className="text-xs text-muted-foreground">
                                    {t('ventas.col_total')}
                                </dt>
                                <dd className="font-semibold">
                                    {formatCajaMoney(ticket.total, ticket.currency)}
                                </dd>
                            </div>
                            {ticket.customer?.nombre ? (
                                <div className="col-span-2">
                                    <dt className="text-xs text-muted-foreground">
                                        {t('fel.col_customer')}
                                    </dt>
                                    <dd className="truncate font-medium">
                                        {ticket.customer.nombre}
                                        {ticket.customer.num_doc
                                            ? ` · ${ticket.customer.num_doc}`
                                            : ''}
                                    </dd>
                                </div>
                            ) : null}
                        </dl>
                    </div>

                    {!canRetry && state === 'rechazado' ? (
                        <p className="text-xs text-muted-foreground">
                            {t('fel.emission_retry_permission_hint')}
                        </p>
                    ) : null}
                </div>

                <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border bg-card px-6 py-4 sm:flex-row sm:justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        asChild
                    >
                        <a href="/facturacion/documentos?estado=rechazado">
                            <ExternalLink className="size-4" />
                            {t('fel.emission_go_documents')}
                        </a>
                    </Button>
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            {t('ventas.ticket_close')}
                        </Button>
                        {canRetry ? (
                            <Button
                                type="button"
                                className="gap-2"
                                disabled={submitting}
                                onClick={retry}
                            >
                                <RefreshCw
                                    className={cn('size-4', submitting && 'animate-spin')}
                                />
                                {t('fel.action_reemit')}
                            </Button>
                        ) : null}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
