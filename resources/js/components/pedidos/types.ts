export type PedidosAbilities = {
    manage: boolean;
};

export type PedidosStats = {
    open_orders: number;
    tables_with_order: number;
};

export type PedidosTableRow = {
    id: string;
    number: string;
    capacity: number;
    status: string;
    active: boolean;
    open_order_id: string | null;
    open_order_status: string | null;
    open_order_total: number | null;
    kitchen_ready_count: number;
    kitchen_all_ready: boolean;
};

export type PedidosAreaRow = {
    id: string;
    name: string;
    tables: PedidosTableRow[];
};

export type OrderItemSelectionRow = {
    id: string;
    dish_id: string | null;
    step_name: string;
    step_slug: string;
    name: string;
    extra_price: number;
};

export type OrderItemRow = {
    id: string;
    item_type: 'simple' | 'daily_menu' | 'combo';
    dish_id: string | null;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
    kitchen_status: string;
    notes: string | null;
    includes_menu_addons: boolean;
    includes_drink_in_price: boolean;
    selections_complete: boolean;
    selections: OrderItemSelectionRow[];
};

export type OrderRow = {
    id: string;
    number: string;
    status: string;
    type: string;
    subtotal: number;
    discount: number;
    total: number;
    notes: string | null;
    opened_at: string | null;
    closed_at: string | null;
    is_editable: boolean;
    table: {
        id: string;
        number: string;
        area_name: string | null;
    } | null;
    waiter: {
        id: string;
        name: string;
    } | null;
    items: OrderItemRow[];
};

export type OrderDishRow = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
};

export type OrderCategoryRow = {
    id: string;
    name: string;
    dishes: OrderDishRow[];
};

export type MenuAddonDishRow = {
    id: string;
    name: string;
    category_name: string | null;
};

export type MenuAddonGroupRow = {
    name: string;
    dishes: Array<{ id: string; name: string }>;
};

export type MenuAddonsConfig = {
    entrada_groups: MenuAddonGroupRow[];
    bebida_groups: MenuAddonGroupRow[];
};
