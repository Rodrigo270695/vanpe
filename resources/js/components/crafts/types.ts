export type CraftAbilities = {
    create: boolean;
    update: boolean;
    delete: boolean;
    publish: boolean;
    support_login: boolean;
};

export type CraftOptions = {
    estados: string[];
    redes_sociales: string[];
    redes_default: string[];
};

export type CraftLimits = {
    max_photos: number;
    min_photos_to_publish: number;
    max_price: number;
};

export type CraftMediaRow = {
    id: string;
    url: string;
    titulo: string | null;
    precio: number | null;
    sort_order: number;
};

export type CraftRedSocial = {
    red: string;
    url: string;
};

export type CraftRow = {
    id: string;
    tenant_id: string | null;
    tenant_name: string | null;
    tenant_slug: string | null;
    nombre: string;
    slug: string;
    descripcion: string | null;
    latitud: number | null;
    longitud: number | null;
    telefono_contacto: string | null;
    redes_sociales: CraftRedSocial[];
    imagen_portada_url: string | null;
    destacado: boolean;
    estado: string;
    publicado_en: string | null;
    media: CraftMediaRow[];
    created_at: string | null;
};
