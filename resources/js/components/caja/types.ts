export type CajaSessionSummary = {
    total_ventas: number;
    efectivo: number;
    tarjeta: number;
    yape: number;
    plin: number;
    transferencia: number;
    ventas_count: number;
};

export type CajaSession = {
    id: string;
    monto_apertura: number;
    monto_esperado_efectivo: number;
    total_ventas: number;
    abierta_en: string | null;
    cajero: { id: number; name: string } | null;
    summary: CajaSessionSummary | null;
};

export type CajaPendingOrder = {
    id: string;
    number: string;
    total: number;
    subtotal: number;
    discount: number;
    opened_at: string | null;
    table: { number: number; area: string | null } | null;
    waiter: { id: number; name: string } | null;
    items_count: number;
};

export type CajaAbilities = {
    manage: boolean;
};

export type CajaFelConfig = {
    enabled: boolean;
    issues_electronic_receipts: boolean;
    emite_comprobantes_sunat: boolean;
    apisunat_mode: 'sandbox' | 'produccion';
    has_boleta_series: boolean;
    has_factura_series: boolean;
    series: Array<{
        id: string;
        tipo_comprobante: number;
        tipo_label: string;
        serie: string;
        ambiente: 'sandbox' | 'produccion';
        proximo_numero_completo: string;
        proximo_correlativo: number;
        ultimo_correlativo: number;
        avance_correlativo: boolean;
    }>;
};

export type CajaHistorySession = {
    id: string;
    monto_apertura: number;
    monto_cierre: number;
    monto_esperado_efectivo: number;
    diferencia: number;
    total_ventas: number;
    abierta_en: string | null;
    cerrada_en: string | null;
    notas_cierre: string | null;
    cajero: { id: number; name: string } | null;
    summary: CajaSessionSummary;
};

export type CajaHistoryPaginator = {
    data: CajaHistorySession[];
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
