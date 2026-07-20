import type { SaleTicket } from '@/components/ventas/types';
import { useTranslations } from '@/hooks/use-translations';
import { formatCajaMoney, formatCajaDateTime } from '@/lib/caja-format';
import { type ThermalRollWidth, thermalWidthClass } from '@/lib/thermal-print';
import { cn } from '@/lib/utils';

type SalesTicketProps = {
    ticket: SaleTicket;
    width: ThermalRollWidth;
    className?: string;
    id?: string;
};

function formatTicketDate(
    iso: string | null,
    locale: string,
    timezone: string,
): string {
    return formatCajaDateTime(iso, locale, timezone);
}

export function SalesTicket({ ticket, width, className, id }: SalesTicketProps) {
    const { t, locale, timezone } = useTranslations();

    const methodLabel = (method: string) =>
        t(`caja.method_${method}` as 'caja.method_efectivo');

    const money = (amount: number) => formatCajaMoney(amount, ticket.currency);

    const customerLabel = ticket.customer?.nombre
        ? ticket.customer.nombre
        : ticket.order?.table
          ? `${t('caja.table', { number: ticket.order.table.number })}${
                ticket.order.table.area ? ` · ${ticket.order.table.area}` : ''
            }`
          : t('ventas.ticket_walkin_customer');

    const documentTitle = (() => {
        if (ticket.document_type === 'boleta') {
            return ticket.fel?.numero_completo
                ? t('ventas.ticket_boleta_title', { number: ticket.fel.numero_completo })
                : t('ventas.ticket_boleta_pending');
        }
        if (ticket.document_type === 'factura') {
            return ticket.fel?.numero_completo
                ? t('ventas.ticket_factura_title', { number: ticket.fel.numero_completo })
                : t('ventas.ticket_factura_pending');
        }
        return t('ventas.ticket_document_title');
    })();

    return (
        <div
            id={id}
            className={cn(
                'mx-auto border border-dashed border-slate-300 bg-white px-3 py-4 font-mono text-[11px] leading-relaxed text-slate-900 shadow-sm',
                thermalWidthClass(width),
                className,
            )}
        >
            <div className="text-center">
                {ticket.business.logo_url ? (
                    <img
                        src={ticket.business.logo_url}
                        alt=""
                        className="mx-auto mb-2 h-10 w-auto object-contain"
                    />
                ) : null}
                <p className="text-sm font-bold">{ticket.business.name}</p>
                {ticket.business.ruc ? (
                    <p className="text-[10px] text-slate-600">
                        {t('ventas.ticket_ruc')}: {ticket.business.ruc}
                    </p>
                ) : null}
                {ticket.business.address ? (
                    <p className="text-[10px] text-slate-600">{ticket.business.address}</p>
                ) : null}
                <p className="mt-2 text-[10px] uppercase tracking-wide">
                    {documentTitle}
                </p>
                <p className="mt-1 inline-block border border-slate-800 px-2 py-0.5 text-[10px] font-bold">
                    {ticket.estado === 'anulada'
                        ? t('ventas.ticket_voided_badge')
                        : t('ventas.ticket_paid_badge')}
                </p>
            </div>

            <div className="my-3 border-t border-dashed border-slate-400" />

            <p className="font-bold">{t('ventas.ticket_sale_section')}</p>
            <p>
                {t('ventas.ticket_sale_number')}: {ticket.numero}
            </p>
            <p>
                {t('ventas.ticket_sale_date')}: {formatTicketDate(ticket.created_at, locale, timezone)}
            </p>

            <div className="my-3 border-t border-dashed border-slate-400" />

            <p className="font-bold">{t('ventas.ticket_customer_section')}</p>
            <p>
                {t('ventas.ticket_customer')}: {customerLabel}
            </p>
            {ticket.customer?.num_doc ? (
                <p>
                    {ticket.customer.tipo_doc === 6
                        ? t('ventas.ticket_ruc')
                        : t('fel.field_dni')}
                    : {ticket.customer.num_doc}
                </p>
            ) : null}
            {ticket.order?.waiter ? (
                <p>
                    {t('ventas.ticket_waiter')}: {ticket.order.waiter.name}
                </p>
            ) : null}
            {ticket.cajero ? (
                <p>
                    {t('ventas.ticket_cashier')}: {ticket.cajero.name}
                </p>
            ) : null}
            {ticket.order ? (
                <p>
                    {t('caja.order', { number: ticket.order.number })}
                </p>
            ) : null}

            <div className="my-3 border-t border-dashed border-slate-400" />

            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-400">
                        <th className="py-1 pr-1">{t('ventas.ticket_col_product')}</th>
                        <th className="py-1 pr-1 text-right">{t('ventas.ticket_col_qty')}</th>
                        <th className="py-1 text-right">{t('ventas.ticket_col_subtotal')}</th>
                    </tr>
                </thead>
                <tbody>
                    {ticket.items.map((item, index) => (
                        <tr key={`${item.nombre}-${index}`} className="align-top">
                            <td className="py-1 pr-1">{item.nombre}</td>
                            <td className="py-1 pr-1 text-right">
                                {item.cantidad.toFixed(3)}
                            </td>
                            <td className="py-1 text-right">{money(item.subtotal)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="my-3 border-t border-dashed border-slate-400" />

            <div className="space-y-1 text-right">
                <p>
                    {t('ventas.ticket_subtotal_excl')}: {money(ticket.subtotal_sin_igv)}
                </p>
                {ticket.igv > 0 ? (
                    <p>
                        {t('ventas.ticket_igv', {
                            rate: ticket.tax_rate.toFixed(2),
                        })}
                        : {money(ticket.igv)}
                    </p>
                ) : null}
                {ticket.descuento > 0 ? (
                    <p>
                        {t('ventas.ticket_discount')}: -{money(ticket.descuento)}
                    </p>
                ) : null}
                <p className="text-sm font-bold">
                    {t('ventas.ticket_total')}: {money(ticket.total)}
                </p>
            </div>

            {ticket.payment ? (
                <>
                    <div className="my-3 border-t border-dashed border-slate-400" />
                    <p className="font-bold">{t('ventas.ticket_payment_section')}</p>
                    <p>
                        {t('ventas.ticket_payment_method')}:{' '}
                        {methodLabel(ticket.payment.metodo)}
                    </p>
                    {ticket.payment.referencia ? (
                        <p>
                            {t('ventas.ticket_voucher')}: {ticket.payment.referencia}
                        </p>
                    ) : null}
                    {ticket.payment.monto_recibido !== null ? (
                        <p>
                            {t('ventas.ticket_amount_received')}:{' '}
                            {money(ticket.payment.monto_recibido)}
                        </p>
                    ) : null}
                    {ticket.payment.vuelto !== null && ticket.payment.vuelto > 0 ? (
                        <p>
                            {t('ventas.ticket_change')}: {money(ticket.payment.vuelto)}
                        </p>
                    ) : null}
                </>
            ) : null}

            <div className="my-3 border-t border-dashed border-slate-400" />

            <p className="text-center text-[9px] text-slate-600">
                {ticket.document_type === 'nota_venta'
                    ? t('ventas.ticket_legal_note')
                    : ticket.fel?.estado === 'emitido'
                      ? t('ventas.ticket_fel_issued')
                      : t('ventas.ticket_fel_pending')}
            </p>
            {ticket.fel?.url_pdf ? (
                <p className="mt-1 text-center text-[9px] text-slate-600">
                    {t('ventas.ticket_pdf_available')}
                </p>
            ) : null}
            <p className="mt-2 text-center text-[9px] text-slate-500">
                {t('ventas.ticket_width_note', { width })}
            </p>
        </div>
    );
}
