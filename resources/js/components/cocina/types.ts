export type CocinaAbilities = {
    manage: boolean;
};

export type CocinaStats = {
    orders: number;
    preparing: number;
    ready: number;
};

export type KitchenItemSelectionRow = {
    step_slug: string;
    name: string;
};

export type KitchenItemRow = {
    id: string;
    name: string;
    quantity: number;
    kitchen_status: 'preparing' | 'ready';
    notes: string | null;
    selections: KitchenItemSelectionRow[];
};

export type KitchenOrderRow = {
    id: string;
    number: string;
    opened_at: string | null;
    notes: string | null;
    table: {
        number: string;
        area_name: string | null;
    } | null;
    waiter: {
        name: string;
    } | null;
    items: KitchenItemRow[];
};
