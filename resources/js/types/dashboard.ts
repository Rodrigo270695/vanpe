export type DashboardCountPoint = {
    status: string;
    count: number;
};

export type DashboardDayPoint = {
    date: string;
    label: string;
    count: number;
};

export type DashboardMonthPoint = {
    month: string;
    label: string;
    count: number;
};

export type DashboardCartaStats = {
    categories: number;
    dishes: number;
    available: number;
    with_image: number;
    published: number;
    without_image: number;
    unpublished: number;
};

export type DashboardChecklistItem = {
    key: string;
    done: boolean;
    href: string;
};

export type DashboardUpcomingReservation = {
    id: string;
    code: string;
    customer_name: string;
    time: string;
    party_size: number;
    status: string;
    source: string;
};

export type DashboardSalesDayPoint = {
    date: string;
    label: string;
    count: number;
    amount: number;
};

export type DashboardPaymentMethodPoint = {
    method: string;
    total: number;
    count: number;
};

export type TenantDashboardProps = {
    kpis: {
        reservations_today: number;
        pending_approval: number;
        dishes: number;
        tables_occupied: number;
        tables_total: number;
        sales_today: number;
        revenue_today: number;
        average_ticket_today: number;
        orders_to_pay: number;
        cash_session_open: boolean;
    };
    charts: {
        reservations_by_day: DashboardDayPoint[];
        reservations_by_status: DashboardCountPoint[];
        tables_by_status: DashboardCountPoint[];
        carta: DashboardCartaStats;
        sales_by_day: DashboardSalesDayPoint[];
        sales_by_payment_method: DashboardPaymentMethodPoint[];
    };
    profile: {
        percent: number;
        checklist: DashboardChecklistItem[];
    };
    upcoming_today: DashboardUpcomingReservation[];
    settings: {
        reservations_enabled: boolean;
    };
    currency: string;
};

export type PlatformDashboardProps = {
    kpis: {
        restaurants_active: number;
        restaurants_trial: number;
        catalog_items: number;
        subscriptions_active: number;
        revenue_month: number;
        revenue_delta_percent: number | null;
        pending_proposals: number;
    };
    charts: {
        tenants_by_month: DashboardMonthPoint[];
        tenants_by_status: DashboardCountPoint[];
    };
    pending_proposals: Array<{
        id: string;
        type: string;
        suggested_name: string;
        tenant_name: string | null;
        created_at: string | null;
    }>;
};
