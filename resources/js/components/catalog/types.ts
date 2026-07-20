export type CatalogItemRow = {
    id: string;
    type: string;
    slug: string;
    name: string;
    name_es: string;
    name_en: string;
    icon: string | null;
    sort_order: number;
    active: boolean;
};

export type CatalogProposalRow = {
    id: string;
    tenant_id: string;
    tenant_name: string | null;
    tenant_slug: string | null;
    type: string;
    suggested_name: string;
    status: 'pending' | 'approved' | 'rejected';
    catalog_item_id: string | null;
    reviewed_by_name: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
    created_at: string | null;
};

export type CatalogAbilities = {
    create: boolean;
    update: boolean;
    delete: boolean;
    proposals: boolean;
};
