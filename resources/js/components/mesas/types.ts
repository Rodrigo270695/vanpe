export type MesasAbilities = {
    manage: boolean;
};

export type TableRow = {
    id: string;
    area_id: string;
    number: string;
    capacity: number;
    capacity_max: number | null;
    status: string;
    shape: string | null;
    reservable: boolean;
    active: boolean;
};

export type AreaRow = {
    id: string;
    name: string;
    description: string | null;
    sort_order: number;
    active: boolean;
    tables: TableRow[];
};

export type MesasStats = {
    areas: number;
    tables: number;
    active_tables: number;
};
