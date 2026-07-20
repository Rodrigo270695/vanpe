/** Paleta compartida para gráficos del dashboard. */
export const CHART_COLORS = {
    blue: '#0744a9',
    blueLight: '#3b82f6',
    orange: '#e85d04',
    green: '#059669',
    purple: '#7c3aed',
    teal: '#0d9488',
    amber: '#d97706',
    rose: '#e11d48',
    slate: '#64748b',
} as const;

export const RESERVATION_STATUS_COLORS: Record<string, string> = {
    pending: CHART_COLORS.amber,
    confirmed: CHART_COLORS.blue,
    seated: CHART_COLORS.teal,
    completed: CHART_COLORS.green,
    no_show: CHART_COLORS.rose,
    cancelled_customer: CHART_COLORS.slate,
    cancelled_restaurant: CHART_COLORS.slate,
};

export const TABLE_STATUS_COLORS: Record<string, string> = {
    free: CHART_COLORS.green,
    occupied: CHART_COLORS.orange,
    reserved: CHART_COLORS.blue,
    inactive: CHART_COLORS.slate,
};

export const TENANT_STATUS_COLORS: Record<string, string> = {
    trial: CHART_COLORS.amber,
    active: CHART_COLORS.green,
    suspended: CHART_COLORS.rose,
    cancelled: CHART_COLORS.slate,
};

export const PAYMENT_METHOD_COLORS: Record<string, string> = {
    efectivo: CHART_COLORS.green,
    tarjeta: CHART_COLORS.blue,
    yape: CHART_COLORS.purple,
    plin: CHART_COLORS.teal,
    transferencia: CHART_COLORS.slate,
};
