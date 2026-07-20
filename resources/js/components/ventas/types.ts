import type { FelDocumentSummary } from '@/components/fel/types';

export type SaleTicketBusiness = {
    name: string;
    legal_name: string | null;
    ruc: string | null;
    address: string | null;
    logo_url: string | null;
};

export type SaleTicketItem = {
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
};

export type SaleTicketPayment = {
    metodo: string;
    monto: number;
    referencia: string | null;
    monto_recibido: number | null;
    vuelto: number | null;
    recibido_en: string | null;
};

export type SaleTicket = {
    id: string;
    numero: string;
    document_type: 'nota_venta' | 'boleta' | 'factura';
    fel_estado?: string;
    estado: string;
    created_at: string | null;
    currency: string;
    tax_rate: number;
    subtotal: number;
    subtotal_sin_igv: number;
    igv: number;
    descuento: number;
    total: number;
    prices_include_tax: boolean;
    business: SaleTicketBusiness;
    cajero: { id: number; name: string } | null;
    customer?: {
        tipo_doc: number | null;
        num_doc: string | null;
        nombre: string | null;
        direccion: string | null;
    } | null;
    fel?: FelDocumentSummary | null;
    order: {
        number: string;
        table: { number: number; area: string | null } | null;
        waiter: { id: number; name: string } | null;
    } | null;
    items: SaleTicketItem[];
    payment: SaleTicketPayment | null;
    can_emit_fel?: boolean;
};

export type VentasFilters = {
    date_from: string;
    date_to: string;
    estado?: string;
    metodo?: string;
};

export type VentasStats = {
    filtered_total: number;
};

export type SaleListRow = {
    id: string;
    numero: string;
    estado: string;
    tipo_comprobante: string;
    fel_estado: string;
    total: number;
    created_at: string | null;
    anulada_en?: string | null;
    motivo_anulacion?: string | null;
    cajero: { id: number; name: string } | null;
    anulado_por?: { id: number; name: string } | null;
    metodo: string | null;
    order_number: string | null;
    table: { number: number } | null;
    fel?: FelDocumentSummary | null;
    can_void?: boolean;
    can_emit_fel?: boolean;
};

export type SalesPaginator = {
    data: SaleListRow[];
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
    meta?: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
};
