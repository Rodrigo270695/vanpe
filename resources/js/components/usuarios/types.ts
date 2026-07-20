export type UserRow = {
    id: number;
    name: string;
    first_name: string | null;
    paternal_surname: string | null;
    maternal_surname: string | null;
    document_type: string | null;
    document_number: string | null;
    email: string;
    username: string | null;
    roles: string[];
    active: boolean;
    is_self: boolean;
    is_protected: boolean;
    is_pending: boolean;
    created_at: string | null;
};

export type UserScope = 'platform' | 'tenant';

export type UserAbilities = {
    create: boolean;
    update: boolean;
    delete: boolean;
    roles: boolean;
};
