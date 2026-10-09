import { useForm } from '@inertiajs/react';
import { useMemo, useRef, useState } from 'react';
import type {
    CraftLimits,
    CraftOptions,
    CraftRedSocial,
    CraftRow,
} from '@/components/crafts/types';
import { isInsidePeru, phoneErrorKey } from '@/components/hotels/validation';
import { useTranslations } from '@/hooks/use-translations';

export type CraftPhotoItem = {
    /** Clave estable para React (id de BD o uuid local). */
    key: string;
    id: string | null;
    url: string;
    file: File | null;
    titulo: string;
    precio: string;
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MIN_DESCRIPTION = 10;

const RED_DOMAINS: Record<string, string[]> = {
    facebook: ['facebook.com', 'fb.com', 'fb.me'],
    instagram: ['instagram.com', 'instagr.am'],
    tiktok: ['tiktok.com'],
    youtube: ['youtube.com', 'youtu.be'],
};

const RED_HANDLE_BASE: Record<string, string> = {
    facebook: 'https://www.facebook.com/',
    instagram: 'https://www.instagram.com/',
    tiktok: 'https://www.tiktok.com/@',
    youtube: 'https://www.youtube.com/@',
};

/** "@usuario" → URL de la red; sin esquema → https://. */
export function normalizeRedUrl(red: string, value: string): string {
    const trimmed = value.trim();

    if (trimmed === '') {
        return '';
    }

    if (trimmed.startsWith('@') && RED_HANDLE_BASE[red]) {
        return RED_HANDLE_BASE[red] + trimmed.replace(/^@+/, '');
    }

    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Devuelve la clave de traducción del error o null si el enlace es válido. */
function redUrlErrorKey(red: string, value: string): string | null {
    let host: string;

    try {
        host = new URL(normalizeRedUrl(red, value)).hostname.toLowerCase();
    } catch {
        return 'crafts.v_red_url';
    }

    if (!/\.[a-z]{2,}$/i.test(host) || /\s/.test(value.trim())) {
        return 'crafts.v_red_url';
    }

    const domains = RED_DOMAINS[red];

    if (domains && !domains.some((d) => host === d || host.endsWith(`.${d}`))) {
        return 'crafts.v_red_domain';
    }

    return null;
}

function defaultRedes(options: CraftOptions): CraftRedSocial[] {
    return options.redes_default.map((red) => ({ red, url: '' }));
}

/** Inertia 3 reemplaza los defaults de useForm tras un envío exitoso, así que reset() no sirve para limpiar. */
export function emptyCraftForm(options: CraftOptions) {
    return {
        nombre: '',
        slug: '',
        descripcion: '',
        latitud: '',
        longitud: '',
        telefono_contacto: '',
        redes_sociales: defaultRedes(options),
        photos: [] as CraftPhotoItem[],
        remove_media_ids: [] as string[],
        destacado: false,
        estado: 'borrador',
    };
}

export type CraftFormData = ReturnType<typeof emptyCraftForm>;

export function craftToFormData(craft: CraftRow, options: CraftOptions): CraftFormData {
    const saved = craft.redes_sociales ?? [];
    const redes = [
        ...options.redes_default.map((red) => ({
            red,
            url: saved.find((row) => row.red === red)?.url ?? '',
        })),
        ...saved.filter((row) => !options.redes_default.includes(row.red)),
    ];

    return {
        ...emptyCraftForm(options),
        nombre: craft.nombre,
        slug: craft.slug,
        descripcion: craft.descripcion ?? '',
        latitud: craft.latitud !== null ? String(craft.latitud) : '',
        longitud: craft.longitud !== null ? String(craft.longitud) : '',
        telefono_contacto: craft.telefono_contacto ?? '',
        redes_sociales: redes,
        photos: craft.media.map((m) => ({
            key: m.id,
            id: m.id,
            url: m.url,
            file: null,
            titulo: m.titulo ?? '',
            precio: m.precio !== null ? String(m.precio) : '',
        })),
        destacado: craft.destacado,
        estado: craft.estado,
    };
}

/** Payload para el backend: sin vistas previas ni claves locales. */
export function craftPayload(data: CraftFormData) {
    return {
        ...data,
        redes_sociales: data.redes_sociales
            .filter((row) => row.url.trim() !== '')
            .map((row) => ({ red: row.red, url: normalizeRedUrl(row.red, row.url) })),
        photos: data.photos.map((p) => ({
            id: p.id,
            file: p.file,
            titulo: p.titulo,
            precio: p.precio,
        })),
    };
}

export type CraftTextFieldKey =
    | 'nombre'
    | 'slug'
    | 'descripcion'
    | 'telefono_contacto'
    | 'latitud'
    | 'longitud';

type UseCraftFormOptions = {
    craft: CraftRow | null;
    options: CraftOptions;
    limits: CraftLimits;
    /** `always`: plataforma exige todo; `publish`: el dueño solo lo necesita para publicar. */
    strict: 'always' | 'publish';
};

export function useCraftForm({ craft, options, limits, strict }: UseCraftFormOptions) {
    const { t } = useTranslations();
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);

    const form = useForm<CraftFormData>(
        craft ? craftToFormData(craft, options) : emptyCraftForm(options),
    );
    const { data, setData, errors, clearErrors, transform } = form;

    const revokePreviews = (photos: CraftPhotoItem[]) => {
        photos.forEach((p) => {
            if (p.file) {
                URL.revokeObjectURL(p.url);
            }
        });
    };

    const resetForm = () => {
        revokePreviews(data.photos);
        setData(emptyCraftForm(options));
        clearErrors();
        transform((payload) => payload);
        setTouched({});
        setSubmitAttempted(false);
        setPhotoError(null);
    };

    /** Rellena el formulario con la ficha y la toma como estado limpio (sin cambios pendientes). */
    const fillFromCraft = (row: CraftRow) => {
        revokePreviews(data.photos);
        const next = craftToFormData(row, options);
        form.setDefaults(next);
        setData(next);
        setTouched({});
        setSubmitAttempted(false);
        setPhotoError(null);
    };

    const remainingPhotoSlots = limits.max_photos - data.photos.length;

    const addPhotos = (files: File[]) => {
        setPhotoError(null);
        const valid: CraftPhotoItem[] = [];

        for (const file of files) {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                setPhotoError(t('crafts.v_image_type'));
                continue;
            }

            if (file.size > MAX_FILE_BYTES) {
                setPhotoError(t('crafts.v_image_weight'));
                continue;
            }

            valid.push({
                key: crypto.randomUUID(),
                id: null,
                url: URL.createObjectURL(file),
                file,
                titulo: '',
                precio: '',
            });
        }

        if (valid.length > remainingPhotoSlots) {
            setPhotoError(t('crafts.v_photos_max', { max: limits.max_photos }));
            revokePreviews(valid.slice(remainingPhotoSlots));
        }

        const accepted = valid.slice(0, Math.max(remainingPhotoSlots, 0));

        if (accepted.length > 0) {
            setData('photos', [...data.photos, ...accepted]);
            clearErrors('photos');
        }
    };

    const updatePhoto = (index: number, patch: Partial<Pick<CraftPhotoItem, 'titulo' | 'precio'>>) => {
        setData(
            'photos',
            data.photos.map((p, i) => (i === index ? { ...p, ...patch } : p)),
        );
        clearErrors(`photos.${index}.precio` as never);
    };

    const removePhoto = (index: number) => {
        const target = data.photos[index];

        if (!target) {
            return;
        }

        if (target.file) {
            URL.revokeObjectURL(target.url);
        }

        setData((current) => ({
            ...current,
            photos: current.photos.filter((_, i) => i !== index),
            remove_media_ids: target.id
                ? [...current.remove_media_ids, target.id]
                : current.remove_media_ids,
        }));
    };

    const movePhoto = (index: number, direction: -1 | 1) => {
        const to = index + direction;

        if (to < 0 || to >= data.photos.length) {
            return;
        }

        const next = [...data.photos];
        [next[index], next[to]] = [next[to], next[index]];
        setData('photos', next);
    };

    const setRedUrl = (index: number, url: string) => {
        setData(
            'redes_sociales',
            data.redes_sociales.map((row, i) => (i === index ? { ...row, url } : row)),
        );
        clearErrors(`redes_sociales.${index}.url` as never);
    };

    const setRedType = (index: number, red: string) => {
        setData(
            'redes_sociales',
            data.redes_sociales.map((row, i) => (i === index ? { ...row, red } : row)),
        );
    };

    const availableRedes = options.redes_sociales.filter(
        (red) => !data.redes_sociales.some((row) => row.red === red),
    );

    const addRed = () => {
        const red = availableRedes[0];

        if (red) {
            setData('redes_sociales', [...data.redes_sociales, { red, url: '' }]);
        }
    };

    const removeRed = (index: number) => {
        setData(
            'redes_sociales',
            data.redes_sociales.filter((_, i) => i !== index),
        );
    };

    const requiresFullProfile = strict === 'always' || data.estado === 'publicado';

    const clientErrors = useMemo(() => {
        const out: Record<string, string> = {};
        const requiredMsg = (key: string) =>
            t('crafts.v_required', { attribute: t(`crafts.attributes.${key}`) });

        if (data.nombre.trim() === '') {
            out.nombre = requiredMsg('nombre');
        } else if (!/\p{L}/u.test(data.nombre)) {
            out.nombre = t('crafts.v_nombre_letters');
        }

        if (data.descripcion.trim() === '') {
            if (requiresFullProfile) {
                out.descripcion = requiredMsg('descripcion');
            }
        } else if (data.descripcion.trim().length < MIN_DESCRIPTION) {
            out.descripcion = t('crafts.v_descripcion_min', { min: MIN_DESCRIPTION });
        }

        const phoneKey =
            data.telefono_contacto === '' ? null : phoneErrorKey(data.telefono_contacto);

        if (phoneKey) {
            out.telefono_contacto = t(phoneKey);
        }

        if ((data.latitud === '') !== (data.longitud === '')) {
            out.latitud = t('crafts.v_coords_pair');
        } else if (
            data.latitud !== '' &&
            !isInsidePeru(Number(data.latitud), Number(data.longitud))
        ) {
            out.latitud = t('crafts.v_coords_peru');
        }

        data.redes_sociales.forEach((row, i) => {
            if (row.url.trim() === '') {
                return;
            }

            const key = redUrlErrorKey(row.red, row.url);

            if (key) {
                out[`redes_sociales.${i}.url`] = t(key, { red: t(`crafts.red_${row.red}`) });
            }
        });

        data.photos.forEach((p, i) => {
            if (p.precio === '') {
                return;
            }

            const value = Number(p.precio);

            if (!Number.isFinite(value) || value < 0) {
                out[`photos.${i}.precio`] = t('crafts.v_price_number');
            } else if (value > limits.max_price) {
                out[`photos.${i}.precio`] = t('crafts.v_price_max');
            }
        });

        if (
            data.estado === 'publicado' &&
            data.photos.length < limits.min_photos_to_publish
        ) {
            out.photos = t('crafts.publish_photos_required', {
                min: limits.min_photos_to_publish,
            });
        }

        return out;
    }, [data, requiresFullProfile, limits, t]);

    const hasClientErrors = Object.keys(clientErrors).length > 0;

    const fieldError = (key: string): string | undefined =>
        (errors as Record<string, string | undefined>)[key] ??
        (touched[key] || submitAttempted ? clientErrors[key] : undefined);

    const touch = (key: string) => () =>
        setTouched((current) => (current[key] ? current : { ...current, [key]: true }));

    const setField = (key: CraftTextFieldKey, value: string) => {
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
        photoInputRef,
        photos: {
            remainingSlots: remainingPhotoSlots,
            error: photoError,
            add: addPhotos,
            update: updatePhoto,
            remove: removePhoto,
            move: movePhoto,
        },
        redes: {
            available: availableRedes,
            add: addRed,
            remove: removeRed,
            setUrl: setRedUrl,
            setType: setRedType,
        },
        clientErrors,
        hasClientErrors,
        requiresFullProfile,
        fieldError,
        touch,
        setField,
        resetForm,
        fillFromCraft,
        validateBeforeSubmit,
    };
}

export type CraftFormController = ReturnType<typeof useCraftForm>;
