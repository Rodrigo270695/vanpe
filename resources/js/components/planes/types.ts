export type PlanAbilities = {
    create: boolean;
    update: boolean;
    delete: boolean;
};

export type PlanRow = {
    id: string;
    code: string;
    name: string;
    description: string | null;
    badge: string | null;
    color_hex: string | null;
    monthly_price: string;
    yearly_price: string | null;
    trial_days: number;
    reservation_commission: string;
    sort_order: number;
    is_public: boolean;
    active: boolean;
    features_count: number;
    subscriptions_count: number;
    created_at: string | null;
};
