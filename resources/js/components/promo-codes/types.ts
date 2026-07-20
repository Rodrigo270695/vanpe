export type PromoCodeAbilities = {
    create: boolean;
    update: boolean;
    delete: boolean;
};

export type PromoCodeRow = {
    id: string;
    code: string;
    description: string | null;
    type: string;
    value: string;
    max_uses: number | null;
    uses: number;
    valid_from: string | null;
    valid_until: string | null;
    active: boolean;
    is_valid: boolean;
    created_at: string | null;
};
