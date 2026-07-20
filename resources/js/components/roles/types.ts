export type RoleRow = {
    id: number;
    name: string;
    permissions_count: number;
    permissions: string[];
    is_core: boolean;
    is_protected: boolean;
    created_at: string | null;
};

export type RoleScope = 'platform' | 'tenant';

export type RoleAbilities = {
    create: boolean;
    update: boolean;
    delete: boolean;
    permissions: boolean;
};

export type PermissionItem = {
    name: string;
    label: string;
};

export type PermissionGroup = {
    key: string;
    label: string;
    permissions: PermissionItem[];
};
