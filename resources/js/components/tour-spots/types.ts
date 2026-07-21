export type TourSpotAbilities = {
    create: boolean;
    update: boolean;
    delete: boolean;
    publish: boolean;
};

export type TourCategoryOption = {
    id: string;
    slug: string;
    name: string;
    name_es: string;
    name_en: string;
    icon: string | null;
    color_hex: string | null;
    sort_order: number;
    active: boolean;
};

export type CatalogOption = {
    id: string;
    type: string;
    slug: string;
    name: string;
};

export type GeoOption = {
    id: number;
    name: string;
};

export type TourSpotHourRow = {
    day_of_week: number;
    opens_at: string;
    closes_at: string;
    active: boolean;
};

export type TourSpotMediaRow = {
    id: string;
    url: string;
    caption: string | null;
    sort_order: number;
    is_cover: boolean;
};

export type TourSpotRow = {
    id: string;
    nombre: string;
    slug: string;
    resumen: string | null;
    descripcion: string | null;
    departamento_id: number;
    provincia_id: number;
    distrito_id: number;
    departamento_name: string | null;
    provincia_name: string | null;
    distrito_name: string | null;
    direccion: string | null;
    referencia: string | null;
    latitud: number | null;
    longitud: number | null;
    telefono: string | null;
    whatsapp: string | null;
    website: string | null;
    email: string | null;
    es_gratuito: boolean;
    precio_entrada_desde: number | null;
    precio_entrada_hasta: number | null;
    moneda: string;
    requiere_reserva: boolean;
    dificultad_acceso: string;
    vialidad_principal: string | null;
    tiempo_acceso_min: number | null;
    distancia_acceso_km: number | null;
    acceso_notas: string | null;
    estacionamiento: string;
    accesible_movilidad_reducida: boolean | null;
    mejor_epoca: string | null;
    duracion_visita_min: number | null;
    horario_texto: string | null;
    tips: { es?: string[]; en?: string[] } | string[] | null;
    imagen_portada_url: string | null;
    destacado: boolean;
    estado: string;
    publicado_en: string | null;
    category_ids: string[];
    primary_category_id: string | null;
    primary_category_name: string | null;
    access_mode_ids: string[];
    hours: TourSpotHourRow[];
    media: TourSpotMediaRow[];
    created_at: string | null;
};
