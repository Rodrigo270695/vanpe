export type CartaAbilities = {
    manage: boolean;
};

export type DishRow = {
    id: string;
    category_id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    available: boolean;
    publish_in_app: boolean;
    featured: boolean;
    sort_order: number;
    includes_menu_addons: boolean;
    includes_drink_in_price: boolean;
    is_drink: boolean;
};

export type CategoryRow = {
    id: string;
    name: string;
    description: string | null;
    sort_order: number;
    active: boolean;
    menu_role: string | null;
    system_key: string | null;
    is_system: boolean;
    dishes: DishRow[];
};

export type CartaStats = {
    categories: number;
    dishes: number;
    available_dishes: number;
    published_dishes: number;
};
