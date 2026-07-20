import { Printer, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SaleTicket } from '@/components/ventas/types';
import { SalesTicket } from '@/components/ventas/sales-ticket';
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
import {
    THERMAL_WIDTHS,
    getThermalRollWidth,
    printSaleTicket,
    setThermalRollWidth,
    type ThermalRollWidth,
} from '@/lib/thermal-print';
import { cn } from '@/lib/utils';

type SaleTicketModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticket: SaleTicket | null;
};

export function SaleTicketModal({ open, onOpenChange, ticket }: SaleTicketModalProps) {
    const { t } = useTranslations();
    const [width, setWidth] = useState<ThermalRollWidth>(() => getThermalRollWidth());

    useEffect(() => {
        if (open) {
            setWidth(getThermalRollWidth());
        }
    }, [open]);

    const selectWidth = (next: ThermalRollWidth) => {
        setWidth(next);
        setThermalRollWidth(next);
    };

    if (!ticket) {
        return null;
    }

    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #sale-ticket-print, #sale-ticket-print * { visibility: visible !important; }
                    #sale-ticket-print {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                }
            `}</style>

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
                    onInteractOutside={(event) => event.preventDefault()}
                    onPointerDownOutside={(event) => event.preventDefault()}
                >
                    <DialogHeader className="shrink-0 border-b border-border bg-gradient-to-r from-brand-blue/[0.06] via-transparent to-brand-orange/[0.04] px-6 py-5">
                        <div className="flex items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/15">
                                <Receipt className="size-5" />
                            </span>
                            <div className="min-w-0 space-y-1">
                                <DialogTitle className="text-lg">
                                    {t('ventas.ticket_modal_title')}
                                </DialogTitle>
                                <DialogDescription>
                                    {t('ventas.ticket_modal_description')}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-muted/20 px-6 py-5">
                        <div className="rounded-xl border bg-card p-4">
                            <p className="mb-2 text-sm font-medium">
                                {t('ventas.ticket_roll_width')}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {THERMAL_WIDTHS.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => selectWidth(option)}
                                        className={cn(
                                            'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                                            width === option
                                                ? 'border-brand-blue bg-brand-blue text-white'
                                                : 'border-border bg-background hover:bg-muted/50',
                                        )}
                                    >
                                        {option} mm
                                    </button>
                                ))}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                {t('ventas.ticket_roll_hint')}
                            </p>
                        </div>

                        <SalesTicket
                            id="sale-ticket-print"
                            ticket={ticket}
                            width={width}
                        />
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
                            onClick={() => printSaleTicket()}
                        >
                            <Printer className="size-4" />
                            {t('ventas.ticket_print')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
