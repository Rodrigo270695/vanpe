export type HotelAbilities = {
    create: boolean;
    update: boolean;
    delete: boolean;
    publish: boolean;
};

export type GeoOption = {
    id: number;
    name: string;
};

export type HotelOptions = {
    estados: string[];
    tipos_habitacion: string[];
    clasificaciones: string[];
    servicios: string[];
    medios_pago: string[];
    sistemas_reserva: string[];
    interes_whatsapp: string[];
    redes_sociales: string[];
    herramientas: string[];
};

export type HotelLimits = {
    min_photos_to_publish: number;
    max_gallery: number;
};

export type HotelMediaRow = {
    id: string;
    url: string;
    caption: string | null;
    sort_order: number;
    is_cover: boolean;
};

export type HotelRow = {
    id: string;
    tenant_id: string | null;
    tenant_name: string | null;
    tenant_slug: string | null;
    nombre: string;
    slug: string;
    ruc: string | null;
    resumen: string | null;
    descripcion: string | null;
    departamento_id: number | null;
    provincia_id: number | null;
    distrito_id: number | null;
    departamento_name: string | null;
    provincia_name: string | null;
    distrito_name: string | null;
    direccion: string | null;
    referencia: string | null;
    latitud: number | null;
    longitud: number | null;
    telefono_reservas: string | null;
    email: string | null;
    website: string | null;
    check_in: string | null;
    check_out: string | null;
    tipos_habitacion: string[];
    precio_desde: number | null;
    precio_hasta: number | null;
    moneda: string;
    clasificacion: string;
    servicios: string[];
    medios_pago: string[];
    imagen_portada_url: string | null;
    sistema_reservas: string | null;
    interes_whatsapp: string | null;
    redes_sociales: string[];
    herramientas_interes: string[];
    mayor_reto: string | null;
    sugerencias: string | null;
    destacado: boolean;
    estado: string;
    publicado_en: string | null;
    media: HotelMediaRow[];
    created_at: string | null;
};
