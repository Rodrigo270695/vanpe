export type TenantAbilities = {
    create: boolean;
    update: boolean;
    delete: boolean;
};

export type TenantRow = {
    id: string;
    slug: string;
    schema_name: string;
    subdomain_host: string;
    subdomain_url: string;
    razon_social: string;
    nombre_comercial: string;
    ruc: string | null;
    email_admin: string;
    telefono: string | null;
    direccion: string | null;
    estado: string;
    trial_ends_at: string | null;
    suspended_at: string | null;
    suspension_reason: string | null;
    cancelled_at: string | null;
    onboarding_completado: boolean;
    onboarding_paso: number;
    publicado: boolean;
    canal_adquisicion: string | null;
    plan_id: string | null;
    plan_name: string | null;
    plan_code: string | null;
    subscription_status: string | null;
    created_at: string | null;
};
