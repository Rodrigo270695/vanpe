import { FileText, Loader2, Printer, AlertTriangle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FelDocumentSummary } from '@/components/fel/types';
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
import { buildA4FromTicket, buildTicketFromA4, resolveFelPdfUrls } from '@/lib/fel-pdf';
import { cn } from '@/lib/utils';

type FelCpeModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    document: FelDocumentSummary | null;
    documentType?: 'boleta' | 'factura';
    autoPrint?: boolean;
};

export function FelCpeModal({
    open,
    onOpenChange,
    document,
    documentType = 'boleta',
    autoPrint = false,
}: FelCpeModalProps) {
    const { t } = useTranslations();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [pdfFormat, setPdfFormat] = useState<'ticket' | 'a4'>('ticket');
    const [iframeBust, setIframeBust] = useState(() => Date.now());
    const [iframeLoading, setIframeLoading] = useState(true);
    const autoPrintDone = useRef(false);

    const { ticket, a4 } = useMemo(
        () =>
            document
                ? resolveFelPdfUrls(
                      document.url_pdf,
                      document.url_pdf_ticket,
                      document.url_pdf_a4,
                  )
                : { ticket: null, a4: null },
        [document],
    );

    const iframeSrc = useMemo(() => {
        const baseUrl =
            pdfFormat === 'a4'
                ? a4 ?? (ticket ? buildA4FromTicket(ticket) : null)
                : ticket ?? (a4 ? buildTicketFromA4(a4) : null);

        if (!baseUrl) {
            return null;
        }

        const sep = baseUrl.includes('?') ? '&' : '?';

        return `${baseUrl}${sep}_pv=${iframeBust}`;
    }, [ticket, a4, pdfFormat, iframeBust]);

    useEffect(() => {
        if (open) {
            setIframeBust(Date.now());
            autoPrintDone.current = false;
        }
    }, [open, document?.id]);

    useEffect(() => {
        if (!open) {
            return;
        }

        setIframeLoading(Boolean(iframeSrc));
    }, [open, iframeSrc]);

    useEffect(() => {
        if (!open || !autoPrint || !iframeSrc || autoPrintDone.current) {
            return;
        }

        const timer = window.setTimeout(() => {
            const win = iframeRef.current?.contentWindow;
            if (win) {
                win.focus();
                win.print();
                autoPrintDone.current = true;
            }
        }, 1200);

        return () => window.clearTimeout(timer);
    }, [open, autoPrint, iframeSrc, iframeLoading]);

    const printFromIframe = () => {
        const win = iframeRef.current?.contentWindow;
        if (win) {
            win.focus();
            win.print();
        }
    };

    if (!document) {
        return null;
    }

    const titleKey =
        documentType === 'factura'
            ? 'fel.cpe_modal_title_factura'
            : 'fel.cpe_modal_title_boleta';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
                <DialogHeader className="shrink-0 border-b border-border bg-gradient-to-r from-brand-blue/[0.06] via-transparent to-brand-orange/[0.04] px-6 py-5">
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/15">
                            <FileText className="size-5" />
                        </span>
                        <div className="min-w-0 space-y-1">
                            <DialogTitle className="text-lg">
                                {t(titleKey, { number: document.numero_completo })}
                            </DialogTitle>
                            <DialogDescription>
                                {t('fel.cpe_modal_description')}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-muted/20 px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setPdfFormat('ticket')}
                            disabled={!ticket && !a4}
                            className={cn(
                                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                                pdfFormat === 'ticket'
                                    ? 'border-brand-blue bg-brand-blue text-white'
                                    : 'border-border bg-background hover:bg-muted/50',
                            )}
                        >
                            {t('fel.action_pdf_ticket')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setPdfFormat('a4')}
                            disabled={!a4 && !ticket}
                            className={cn(
                                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                                pdfFormat === 'a4'
                                    ? 'border-brand-blue bg-brand-blue text-white'
                                    : 'border-border bg-background hover:bg-muted/50',
                            )}
                        >
                            {t('fel.action_pdf_a4')}
                        </button>
                    </div>

                    <div className="relative min-h-[420px] overflow-hidden rounded-xl border bg-white shadow-inner">
                        {iframeLoading && iframeSrc ? (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                                <Loader2 className="size-8 animate-spin text-brand-blue" />
                            </div>
                        ) : null}
                        {iframeSrc ? (
                            <iframe
                                ref={iframeRef}
                                title={t('fel.cpe_iframe_title', {
                                    number: document.numero_completo,
                                })}
                                src={iframeSrc}
                                className="h-[min(70vh,640px)] w-full border-0 bg-white"
                                onLoad={() => setIframeLoading(false)}
                                onError={() => setIframeLoading(false)}
                            />
                        ) : (
                            <div className="flex h-[320px] flex-col items-center justify-center gap-3 p-6 text-center">
                                <AlertTriangle className="size-10 text-amber-500" />
                                <p className="text-sm text-muted-foreground">
                                    {t('fel.cpe_pdf_unavailable')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t('ventas.ticket_close')}
                    </Button>
                    <Button
                        type="button"
                        className="gap-2"
                        disabled={!iframeSrc}
                        onClick={printFromIframe}
                    >
                        <Printer className="size-4" />
                        {t('ventas.ticket_print')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
