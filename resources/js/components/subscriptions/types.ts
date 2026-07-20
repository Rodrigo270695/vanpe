export type SubscriptionAbilities = {
    create: boolean;
    update: boolean;
    delete: boolean;
};

export type TenantOption = {
    id: string;
    nombre_comercial: string;
    slug: string;
};

export type PlanOption = {
    id: string;
    name: string;
    code: string;
    monthly_price: string;
    yearly_price: string | null;
    reservation_commission: string;
    trial_days: number;
};

export type SubscriptionRow = {
    id: string;
    tenant_id: string;
    tenant_name: string | null;
    tenant_slug: string | null;
    tenant_status: string | null;
    plan_id: string;
    plan_name: string | null;
    plan_code: string | null;
    status: string;
    billing_cycle: string;
    current_price: string;
    reservation_commission: string;
    period_start: string | null;
    period_end: string | null;
    auto_renew: boolean;
    cancelled_at: string | null;
    created_at: string | null;
};
