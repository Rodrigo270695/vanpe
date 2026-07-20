import type { SaleTicket } from '@/components/ventas/types';
import { FelCpeModal } from '@/components/fel/fel-cpe-modal';
import { FelEmissionStatusModal } from '@/components/fel/fel-emission-status-modal';
import { SaleTicketModal } from '@/components/ventas/sale-ticket-modal';

type PostSaleDocumentModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticket: SaleTicket | null;
    autoPrint?: boolean;
    returnTo?: 'caja' | 'ventas';
};

function isFormalReceipt(ticket: SaleTicket | null): boolean {
    return ticket?.document_type === 'boleta' || ticket?.document_type === 'factura';
}

function hasFelPdf(ticket: SaleTicket): boolean {
    return Boolean(ticket.fel?.url_pdf_ticket ?? ticket.fel?.url_pdf);
}

function isFelEmitido(ticket: SaleTicket): boolean {
    return (
        ticket.fel_estado === 'emitido' ||
        ticket.fel?.estado === 'emitido'
    );
}

/** Boleta/factura emitida con PDF Lucode disponible. */
function shouldShowFelCpeModal(ticket: SaleTicket | null): boolean {
    if (!isFormalReceipt(ticket) || !ticket?.fel) {
        return false;
    }

    return isFelEmitido(ticket) && hasFelPdf(ticket);
}

/** Boleta/factura sin PDF o con error de emisión. */
function shouldShowFelStatusModal(ticket: SaleTicket | null): boolean {
    return isFormalReceipt(ticket) && Boolean(ticket?.fel);
}

export function PostSaleDocumentModal({
    open,
    onOpenChange,
    ticket,
    autoPrint = true,
    returnTo = 'caja',
}: PostSaleDocumentModalProps) {
    if (!ticket) {
        return null;
    }

    if (shouldShowFelCpeModal(ticket) && ticket.fel) {
        return (
            <FelCpeModal
                open={open}
                onOpenChange={onOpenChange}
                document={ticket.fel}
                documentType={ticket.document_type === 'factura' ? 'factura' : 'boleta'}
                autoPrint={autoPrint}
            />
        );
    }

    if (shouldShowFelStatusModal(ticket)) {
        return (
            <FelEmissionStatusModal
                open={open}
                onOpenChange={onOpenChange}
                ticket={ticket}
                returnTo={returnTo}
            />
        );
    }

    if (isFormalReceipt(ticket)) {
        return (
            <FelEmissionStatusModal
                open={open}
                onOpenChange={onOpenChange}
                ticket={ticket}
                returnTo={returnTo}
            />
        );
    }

    return (
        <SaleTicketModal open={open} onOpenChange={onOpenChange} ticket={ticket} />
    );
}

export {
    hasFelPdf,
    isFelEmitido,
    isFormalReceipt,
    shouldShowFelCpeModal,
    shouldShowFelStatusModal,
};
