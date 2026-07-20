export type ReservationRow = {
    id: string;
    rsv_id: string | null;
    code: string;
    customer_name: string;
    customer_phone: string | null;
    date: string;
    time: string;
    party_size: number;
    notes: string | null;
    source: string;
    status: string;
    needs_approval: boolean;
    tables: Array<{ id: string; number: string }>;
};

export type ReservasAreaOption = {
    id: string;
    name: string;
    tables: Array<{
        id: string;
        number: string;
        capacity: number;
        status: string;
    }>;
};

export type ReservasStats = {
    total: number;
    pending: number;
    confirmed: number;
    seated: number;
};

export type ReservasFilters = {
    date_from: string;
    date_to: string;
    status: string;
};

export type ReservasAbilities = {
    manage: boolean;
};

export type WaitingListRow = {
    id: string;
    cliente_nombre: string;
    cliente_telefono: string | null;
    num_personas: number;
    hora_llegada: string | null;
    estado: string;
    notas: string | null;
    wait_minutes: number;
};

export type ReservasTimelineSlot = {
    hour: string;
    label: string;
    reservations: ReservationRow[];
};
