export type SubscriptionPaymentAbilities = {
    create: boolean;
    update: boolean;
    delete: boolean;
};

export type SubscriptionPaymentRow = {
    id: string;
    subscription_id: string;
    tenant_id: string;
    tenant_name: string | null;
    tenant_slug: string | null;
    plan_name: string | null;
    plan_code: string | null;
    concept: string;
    amount: string;
    currency: string;
    status: string;
    gateway: string | null;
    gateway_ref: string | null;
    paid_at: string | null;
    period_from: string | null;
    period_to: string | null;
    created_at: string | null;
};

export type SubscriptionOption = {
    id: string;
    tenant_id: string;
    tenant_name: string | null;
    tenant_slug: string | null;
    plan_name: string | null;
    plan_code: string | null;
};

export type TenantOption = {
    id: string;
    nombre_comercial: string;
    slug: string;
};
