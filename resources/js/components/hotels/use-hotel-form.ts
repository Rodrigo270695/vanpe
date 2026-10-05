import { useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
    GeoOption,
    HotelLimits,
    HotelMediaRow,
    HotelRow,
} from '@/components/hotels/types';
import {
    isInsidePeru,
    isValidEmail,
    isValidWebsite,
    phoneErrorKey,
    rucErrorKey,
} from '@/components/hotels/validation';
import { useTranslations } from '@/hooks/use-translations';

type GeoListResponse = { data: GeoOption[] };

const EXCLUSIVE_REDES = 'ninguna';

/** Inertia 3 reemplaza los defaults de useForm tras un envío exitoso, así que reset() no sirve para limpiar. */
export function emptyHotelForm() {
    return {
        nombre: '',
        slug: '',
        ruc: '',
        resumen: '',
        descripcion: '',
        direccion: '',
        referencia: '',
        departamento_id: '' as string | number,
        provincia_id: '' as string | number,
        distrito_id: '' as string | number,
        latitud: '',
        longitud: '',
        telefono_reservas: '',
        email: '',
        website: '',
        check_in: '',
        check_out: '',
        tipos_habitacion: [] as string[],
        precio_desde: '',
        precio_hasta: '',
        moneda: 'PEN',
        clasificacion: '',
        servicios: [] as string[],
        medios_pago: [] as string[],
        cover: null as File | null,
        remove_cover: false,
        gallery: [] as File[],
        remove_media_ids: [] as string[],
        sistema_reservas: '',
        interes_whatsapp: '',
        redes_sociales: [] as string[],
        herramientas_interes: [] as string[],
        mayor_reto: '',
        sugerencias: '',
        destacado: false,
        estado: 'borrador',
    };
}

export type HotelFormData = ReturnType<typeof emptyHotelForm>;

export function hotelToFormData(hotel: HotelRow): HotelFormData {
    return {
        ...emptyHotelForm(),
        nombre: hotel.nombre,
        slug: hotel.slug,
        ruc: hotel.ruc ?? '',
        resumen: hotel.resumen ?? '',
        descripcion: hotel.descripcion ?? '',
        direccion: hotel.direccion ?? '',
        referencia: hotel.referencia ?? '',
        departamento_id: hotel.departamento_id ?? '',
        provincia_id: hotel.provincia_id ?? '',
        distrito_id: hotel.distrito_id ?? '',
        latitud: hotel.latitud !== null ? String(hotel.latitud) : '',
        longitud: hotel.longitud !== null ? String(hotel.longitud) : '',
        telefono_reservas: hotel.telefono_reservas ?? '',
        email: hotel.email ?? '',
        website: hotel.website ?? '',
        check_in: hotel.check_in ?? '',
        check_out: hotel.check_out ?? '',
        tipos_habitacion: hotel.tipos_habitacion ?? [],
        precio_desde: hotel.precio_desde !== null ? String(hotel.precio_desde) : '',
        precio_hasta: hotel.precio_hasta !== null ? String(hotel.precio_hasta) : '',
        moneda: hotel.moneda || 'PEN',
        clasificacion: hotel.clasificacion ?? '',
        servicios: hotel.servicios ?? [],
        medios_pago: hotel.medios_pago ?? [],
        sistema_reservas: hotel.sistema_reservas ?? '',
        interes_whatsapp: hotel.interes_whatsapp ?? '',
        redes_sociales: hotel.redes_sociales ?? [],
        herramientas_interes: hotel.herramientas_interes ?? [],
        mayor_reto: hotel.mayor_reto ?? '',
        sugerencias: hotel.sugerencias ?? '',
        destacado: hotel.destacado,
        estado: hotel.estado,
    };
}

export type TextFieldKey =
    | 'nombre'
    | 'slug'
    | 'ruc'
    | 'direccion'
    | 'referencia'
    | 'telefono_reservas'
    | 'email'
    | 'website'
    | 'check_in'
    | 'check_out'
    | 'precio_desde'
    | 'precio_hasta';

async function fetchGeo(url: string): Promise<GeoOption[]> {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const json = (await res.json()) as GeoListResponse;

    return json.data ?? [];
}

type UseHotelFormOptions = {
    hotel: HotelRow | null;
    limits: HotelLimits;
    /** Base de los endpoints de geo, p. ej. `/hoteles` o `/mi-hotel`. */
    geoBaseUrl: string;
    /** `always`: plataforma exige todo; `publish`: el dueño solo lo necesita para publicar. */
    strict: 'always' | 'publish';
};

export function useHotelForm({
    hotel,
    limits,
    geoBaseUrl,
    strict,
}: UseHotelFormOptions) {
    const { t } = useTranslations();
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const [provincias, setProvincias] = useState<GeoOption[]>([]);
    const [distritos, setDistritos] = useState<GeoOption[]>([]);
    const [loadingGeo, setLoadingGeo] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const existingCoverUrl = hotel?.imagen_portada_url ?? null;
    const existingMedia: HotelMediaRow[] = useMemo(() => hotel?.media ?? [], [hotel]);

    const form = useForm<HotelFormData>(
        hotel ? hotelToFormData(hotel) : emptyHotelForm(),
    );
    const { data, setData, errors, clearErrors, transform } = form;

    const provinciasUrl = (id: string | number) =>
        `${geoBaseUrl}/geo/provincias?departamento_id=${id}`;
    const distritosUrl = (id: string | number) =>
        `${geoBaseUrl}/geo/distritos?provincia_id=${id}`;

    const clearGalleryInput = () => {
        if (galleryInputRef.current) {
            galleryInputRef.current.value = '';
        }
    };

    const resetForm = () => {
        setData(emptyHotelForm());
        clearErrors();
        transform((payload) => payload);
        setProvincias([]);
        setDistritos([]);
        setTouched({});
        setSubmitAttempted(false);
        clearGalleryInput();
    };

    /** Rellena el formulario con el hotel y lo toma como estado limpio (sin cambios pendientes). */
    const fillFromHotel = (row: HotelRow) => {
        const next = hotelToFormData(row);
        form.setDefaults(next);
        setData(next);
        setTouched({});
        setSubmitAttempted(false);
        clearGalleryInput();
    };

    const loadGeoFor = async (row: HotelRow) => {
        const [provinciasRows, distritosRows] = await Promise.all([
            row.departamento_id
                ? fetchGeo(provinciasUrl(row.departamento_id))
                : Promise.resolve([]),
            row.provincia_id
                ? fetchGeo(distritosUrl(row.provincia_id))
                : Promise.resolve([]),
        ]);
        setProvincias(provinciasRows);
        setDistritos(distritosRows);
    };

    const onDepartamentoChange = async (value: string) => {
        setData((current) => ({
            ...current,
            departamento_id: Number(value),
            provincia_id: '',
            distrito_id: '',
        }));
        setDistritos([]);
        setLoadingGeo(true);

        try {
            setProvincias(await fetchGeo(provinciasUrl(value)));
        } finally {
            setLoadingGeo(false);
        }
    };

    const onProvinciaChange = async (value: string) => {
        setData((current) => ({
            ...current,
            provincia_id: Number(value),
            distrito_id: '',
        }));
        setLoadingGeo(true);

        try {
            setDistritos(await fetchGeo(distritosUrl(value)));
        } finally {
            setLoadingGeo(false);
        }
    };

    const galleryPreviews = useMemo(
        () => data.gallery.map((file) => URL.createObjectURL(file)),
        [data.gallery],
    );

    useEffect(
        () => () => {
            galleryPreviews.forEach((url) => URL.revokeObjectURL(url));
        },
        [galleryPreviews],
    );

    const visibleMedia = existingMedia.filter(
        (m) => !data.remove_media_ids.includes(m.id),
    );
    const remainingGallerySlots =
        limits.max_gallery - visibleMedia.length - data.gallery.length;
    const hasCover =
        data.cover !== null || (existingCoverUrl !== null && !data.remove_cover);
    const totalPhotos =
        (hasCover ? 1 : 0) + visibleMedia.length + data.gallery.length;

    const onRedesChange = (next: string[]) => {
        const added = next.find((v) => !data.redes_sociales.includes(v));

        if (added === EXCLUSIVE_REDES) {
            setData('redes_sociales', [EXCLUSIVE_REDES]);

            return;
        }

        setData(
            'redes_sociales',
            next.filter((v) => v !== EXCLUSIVE_REDES),
        );
    };

    const requiresFullProfile =
        strict === 'always' || data.estado === 'publicado';

    const clientErrors = useMemo(() => {
        const out: Record<string, string> = {};
        const required = (key: string, value: string) => {
            if (value.trim() === '') {
                out[key] = t('hotels.v_required', {
                    attribute: t(`hotels.attributes.${key}`),
                });
            }
        };

        required('nombre', data.nombre);

        if (requiresFullProfile) {
            required('direccion', data.direccion);
            required('ruc', data.ruc);
            required('telefono_reservas', data.telefono_reservas);
        }

        if (data.nombre.trim() !== '' && !/\p{L}/u.test(data.nombre)) {
            out.nombre = t('hotels.v_nombre_letters');
        }

        if (data.direccion.trim() !== '' && !/\p{L}/u.test(data.direccion)) {
            out.direccion = t('hotels.v_direccion_letters');
        }

        const rucKey = data.ruc === '' ? null : rucErrorKey(data.ruc);

        if (rucKey) {
            out.ruc = t(rucKey);
        }

        const phoneKey =
            data.telefono_reservas === '' ? null : phoneErrorKey(data.telefono_reservas);

        if (phoneKey) {
            out.telefono_reservas = t(phoneKey);
        }

        if (data.email.trim() !== '' && !isValidEmail(data.email)) {
            out.email = t('hotels.v_email');
        }

        if (data.website.trim() !== '' && !isValidWebsite(data.website.trim())) {
            out.website = t('hotels.v_website');
        }

        if (data.check_in !== '' && data.check_in === data.check_out) {
            out.check_out = t('hotels.v_checkout_same');
        }

        if (data.precio_desde !== '' && data.precio_hasta === '') {
            out.precio_hasta = t('hotels.v_required', {
                attribute: t('hotels.attributes.precio_hasta'),
            });
        } else if (data.precio_hasta !== '' && data.precio_desde === '') {
            out.precio_desde = t('hotels.v_required', {
                attribute: t('hotels.attributes.precio_desde'),
            });
        } else if (
            data.precio_desde !== '' &&
            Number(data.precio_hasta) < Number(data.precio_desde)
        ) {
            out.precio_hasta = t('hotels.price_range_invalid');
        }

        if (
            data.latitud !== '' &&
            data.longitud !== '' &&
            !isInsidePeru(Number(data.latitud), Number(data.longitud))
        ) {
            out.latitud = t('hotels.v_coords_peru');
        }

        return out;
    }, [data, requiresFullProfile, t]);

    const hasClientErrors = Object.keys(clientErrors).length > 0;

    const fieldError = (key: string): string | undefined =>
        (errors as Record<string, string | undefined>)[key] ??
        (touched[key] || submitAttempted ? clientErrors[key] : undefined);

    const touch = (key: string) => () =>
        setTouched((current) => (current[key] ? current : { ...current, [key]: true }));

    const setField = (key: TextFieldKey, value: string) => {
        setData(key, value);
        clearErrors(key);
    };

    /** Marca el intento de envío y devuelve true si el cliente no encontró errores. */
    const validateBeforeSubmit = (): boolean => {
        setSubmitAttempted(true);

        return !hasClientErrors;
    };

    return {
        form,
        galleryInputRef,
        geo: {
            provincias,
            distritos,
            loading: loadingGeo,
            onDepartamentoChange,
            onProvinciaChange,
        },
        photos: {
            existingCoverUrl,
            visibleMedia,
            galleryPreviews,
            remainingGallerySlots,
            totalPhotos,
        },
        clientErrors,
        hasClientErrors,
        requiresFullProfile,
        fieldError,
        touch,
        setField,
        onRedesChange,
        resetForm,
        fillFromHotel,
        loadGeoFor,
        validateBeforeSubmit,
    };
}

export type HotelFormController = ReturnType<typeof useHotelForm>;
