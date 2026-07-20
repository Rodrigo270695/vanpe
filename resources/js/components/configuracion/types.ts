export type ConfigProfile = {
    slug: string;
    subdomain_url: string;
    nombre_comercial: string;
    razon_social: string | null;
    ruc: string | null;
    telefono: string | null;
    email_admin: string | null;
    direccion: string | null;
    logo_url: string | null;
    portada_url: string | null;
    publicado: boolean;
    onboarding_paso: number;
};

export type VenuePhotoRow = {
    id: string;
    image_url: string;
    caption: string | null;
    sort_order: number;
};

export type ConfigVenue = {
    photos: VenuePhotoRow[];
    max_photos: number;
};

export type ConfigSettings = {
    currency: string;
    tax_rate: number;
    prices_include_tax: boolean;
    issues_electronic_receipts: boolean;
    emite_comprobantes_sunat: boolean;
    apisunat_mode: 'sandbox' | 'produccion';
    apisunat_configurado: boolean;
    reservations_enabled: boolean;
    reservation_duration_minutes: number;
    min_booking_hours_ahead: number;
    max_booking_days_ahead: number;
    no_show_tolerance_minutes: number;
    auto_publish: boolean;
};

export type FelSerieRow = {
    id: string;
    tipo_comprobante: number;
    tipo_label: string;
    serie: string;
    ambiente: 'sandbox' | 'produccion';
    ultimo_correlativo: number;
    proximo_correlativo: number;
    proximo_numero_completo: string;
    ultimo_emitido_sandbox?: number | null;
    avance_correlativo: boolean;
    activo: boolean;
    es_predeterminada: boolean;
    tiene_documentos: boolean;
    tiene_documentos_produccion?: boolean;
    puede_eliminar?: boolean;
};

export type ServiceHourRow = {
    day_of_week: number;
    opens_at: string;
    closes_at: string;
    active: boolean;
};

export type CatalogOption = {
    id: string;
    type: string;
    slug: string;
    name: string;
};

export type CatalogOptionsGrouped = Record<string, CatalogOption[]>;

export type CatalogProposalTenantRow = {
    id: string;
    type: string;
    suggested_name: string;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    created_at: string | null;
};

export type ConfigCatalog = {
    options: CatalogOptionsGrouped;
    selection_ids: string[];
    type_labels: Record<string, string>;
    proposals: CatalogProposalTenantRow[];
};

export type ConfigAbilities = {
    manage: boolean;
    invoicing?: boolean;
};
