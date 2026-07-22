import { useForm } from '@inertiajs/react';
import { ImagePlus, MapPin, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { CreatableCombobox } from '@/components/common/creatable-combobox';
import { CreatableMultiCombobox } from '@/components/common/creatable-multi-combobox';
import { FormField } from '@/components/common/form-field';
import { ImageUploadField } from '@/components/common/image-upload-field';
import { ServiceHoursSection } from '@/components/configuracion/service-hours-section';
import type { ServiceHourRow } from '@/components/configuracion/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    CatalogOption,
    GeoOption,
    TourCategoryOption,
    TourSpotHourRow,
    TourSpotMediaRow,
    TourSpotRow,
} from '@/components/tour-spots/types';
import { useTranslations } from '@/hooks/use-translations';
import { getCsrfToken } from '@/lib/csrf';
import { cn } from '@/lib/utils';

type TourSpotFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    spot: TourSpotRow | null;
    categories: TourCategoryOption[];
    accessModes: CatalogOption[];
    roadTypes: CatalogOption[];
    inclusions: CatalogOption[];
    departamentos: GeoOption[];
    defaultHours: TourSpotHourRow[];
    estados: string[];
    dificultades: string[];
    estacionamientos: string[];
    canPublish: boolean;
    onCategoriesChange: (categories: TourCategoryOption[]) => void;
    onAccessModesChange: (modes: CatalogOption[]) => void;
    onRoadTypesChange: (types: CatalogOption[]) => void;
    onInclusionsChange: (items: CatalogOption[]) => void;
};

type GeoListResponse = { data: GeoOption[] };

const MAX_GALLERY = 8;

function tipsToText(tips: TourSpotRow['tips']): string {
    if (!tips) return '';
    if (Array.isArray(tips)) return tips.join('\n');
    return (tips.es ?? []).join('\n');
}

function SectionTitle({ children }: { children: string }) {
    return (
        <h3 className="border-b border-border/80 pb-2 text-sm font-semibold text-brand-blue">
            {children}
        </h3>
    );
}

export function TourSpotFormModal({
    open,
    onOpenChange,
    spot,
    categories,
    accessModes,
    roadTypes,
    inclusions,
    departamentos,
    defaultHours,
    estados,
    dificultades,
    estacionamientos,
    canPublish,
    onCategoriesChange,
    onAccessModesChange,
    onRoadTypesChange,
    onInclusionsChange,
}: TourSpotFormModalProps) {
    const { t } = useTranslations();
    const isEditing = spot !== null;
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const [provincias, setProvincias] = useState<GeoOption[]>([]);
    const [distritos, setDistritos] = useState<GeoOption[]>([]);
    const [loadingGeo, setLoadingGeo] = useState(false);
    const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
    const [existingMedia, setExistingMedia] = useState<TourSpotMediaRow[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    const {
        data,
        setData,
        post,
        transform,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        nombre: '',
        slug: '',
        resumen: '',
        descripcion: '',
        departamento_id: '' as string | number,
        provincia_id: '' as string | number,
        distrito_id: '' as string | number,
        direccion: '',
        referencia: '',
        latitud: '',
        longitud: '',
        telefono: '',
        whatsapp: '',
        website: '',
        email: '',
        es_gratuito: false,
        precio_entrada_desde: '',
        precio_entrada_hasta: '',
        moneda: 'PEN',
        requiere_reserva: false,
        dificultad_acceso: 'facil',
        vialidad_principal: '',
        tiempo_acceso_min: '',
        distancia_acceso_km: '',
        acceso_notas: '',
        estacionamiento: 'desconocido',
        accesible_movilidad_reducida: false,
        mejor_epoca: '',
        duracion_visita_min: '',
        horario_texto: '',
        tips: '',
        cover: null as File | null,
        remove_cover: false,
        gallery: [] as File[],
        remove_media_ids: [] as string[],
        destacado: false,
        estado: 'borrador',
        category_ids: [] as string[],
        primary_category_id: '',
        access_mode_ids: [] as string[],
        inclusion_ids: [] as string[],
        hours: defaultHours as ServiceHourRow[],
    });

    const loadProvincias = async (departamentoId: number | string) => {
        if (!departamentoId) {
            setProvincias([]);
            return;
        }
        setLoadingGeo(true);
        try {
            const res = await fetch(
                `/centros-turisticos/geo/provincias?departamento_id=${departamentoId}`,
                { headers: { Accept: 'application/json' } },
            );
            const json = (await res.json()) as GeoListResponse;
            setProvincias(json.data ?? []);
        } finally {
            setLoadingGeo(false);
        }
    };

    const loadDistritos = async (provinciaId: number | string) => {
        if (!provinciaId) {
            setDistritos([]);
            return;
        }
        setLoadingGeo(true);
        try {
            const res = await fetch(
                `/centros-turisticos/geo/distritos?provincia_id=${provinciaId}`,
                { headers: { Accept: 'application/json' } },
            );
            const json = (await res.json()) as GeoListResponse;
            setDistritos(json.data ?? []);
        } finally {
            setLoadingGeo(false);
        }
    };

    useEffect(() => {
        if (!open) return;

        if (spot) {
            setExistingCoverUrl(spot.imagen_portada_url);
            setExistingMedia(spot.media ?? []);
            setData({
                nombre: spot.nombre,
                slug: spot.slug,
                resumen: spot.resumen ?? '',
                descripcion: spot.descripcion ?? '',
                departamento_id: spot.departamento_id,
                provincia_id: spot.provincia_id,
                distrito_id: spot.distrito_id,
                direccion: spot.direccion ?? '',
                referencia: spot.referencia ?? '',
                latitud: spot.latitud !== null ? String(spot.latitud) : '',
                longitud: spot.longitud !== null ? String(spot.longitud) : '',
                telefono: spot.telefono ?? '',
                whatsapp: spot.whatsapp ?? '',
                website: spot.website ?? '',
                email: spot.email ?? '',
                es_gratuito: spot.es_gratuito,
                precio_entrada_desde:
                    spot.precio_entrada_desde !== null
                        ? String(spot.precio_entrada_desde)
                        : '',
                precio_entrada_hasta:
                    spot.precio_entrada_hasta !== null
                        ? String(spot.precio_entrada_hasta)
                        : '',
                moneda: spot.moneda || 'PEN',
                requiere_reserva: spot.requiere_reserva,
                dificultad_acceso: spot.dificultad_acceso,
                vialidad_principal: spot.vialidad_principal ?? '',
                tiempo_acceso_min:
                    spot.tiempo_acceso_min !== null
                        ? String(spot.tiempo_acceso_min)
                        : '',
                distancia_acceso_km:
                    spot.distancia_acceso_km !== null
                        ? String(spot.distancia_acceso_km)
                        : '',
                acceso_notas: spot.acceso_notas ?? '',
                estacionamiento: spot.estacionamiento,
                accesible_movilidad_reducida:
                    spot.accesible_movilidad_reducida === true,
                mejor_epoca: spot.mejor_epoca ?? '',
                duracion_visita_min:
                    spot.duracion_visita_min !== null
                        ? String(spot.duracion_visita_min)
                        : '',
                horario_texto: spot.horario_texto ?? '',
                tips: tipsToText(spot.tips),
                cover: null,
                remove_cover: false,
                gallery: [],
                remove_media_ids: [],
                destacado: spot.destacado,
                estado: spot.estado,
                category_ids: spot.category_ids,
                primary_category_id: spot.primary_category_id ?? '',
                access_mode_ids: spot.access_mode_ids,
                inclusion_ids: spot.inclusion_ids ?? [],
                hours: (spot.hours?.length ? spot.hours : defaultHours) as ServiceHourRow[],
            });
            void loadProvincias(spot.departamento_id).then(() =>
                loadDistritos(spot.provincia_id),
            );
        } else {
            reset();
            setData('hours', defaultHours as ServiceHourRow[]);
            setExistingCoverUrl(null);
            setExistingMedia([]);
            setProvincias([]);
            setDistritos([]);
        }
        setGalleryPreviews([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, spot]);

    useEffect(() => {
        const urls = data.gallery.map((file) => URL.createObjectURL(file));
        setGalleryPreviews(urls);
        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [data.gallery]);

    const canSubmit = useMemo(() => {
        return (
            data.nombre.trim().length > 0 &&
            Boolean(data.departamento_id) &&
            Boolean(data.provincia_id) &&
            Boolean(data.distrito_id) &&
            data.estado !== ''
        );
    }, [data]);

    const categoryOptions = useMemo(
        () => categories.map((c) => ({ id: c.id, label: c.name })),
        [categories],
    );

    const accessOptions = useMemo(
        () => accessModes.map((m) => ({ id: m.id, label: m.name })),
        [accessModes],
    );

    const roadOptions = useMemo(
        () => roadTypes.map((m) => ({ id: m.slug, label: m.name })),
        [roadTypes],
    );

    const inclusionOptions = useMemo(
        () => inclusions.map((m) => ({ id: m.id, label: m.name })),
        [inclusions],
    );

    const visibleMedia = existingMedia.filter(
        (m) => !data.remove_media_ids.includes(m.id),
    );

    const remainingGallerySlots =
        MAX_GALLERY - visibleMedia.length - data.gallery.length;

    const createCategory = async (name: string) => {
        const res = await fetch('/centros-turisticos/categories', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({ name }),
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { data: TourCategoryOption };
        onCategoriesChange([...categories, json.data]);
        return { id: json.data.id, label: json.data.name };
    };

    const createAccessMode = async (name: string) => {
        const res = await fetch('/centros-turisticos/access-modes', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({ name }),
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { data: CatalogOption };
        const exists = accessModes.some((m) => m.id === json.data.id);
        if (!exists) {
            onAccessModesChange([...accessModes, json.data]);
        }
        return { id: json.data.id, label: json.data.name };
    };

    const createRoadType = async (name: string) => {
        const res = await fetch('/centros-turisticos/road-types', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({ name }),
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { data: CatalogOption };
        const exists = roadTypes.some((m) => m.id === json.data.id);
        if (!exists) {
            onRoadTypesChange([...roadTypes, json.data]);
        }
        return { id: json.data.slug, label: json.data.name };
    };

    const createInclusion = async (name: string) => {
        const res = await fetch('/centros-turisticos/inclusions', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({ name }),
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { data: CatalogOption };
        const exists = inclusions.some((m) => m.id === json.data.id);
        if (!exists) {
            onInclusionsChange([...inclusions, json.data]);
        }
        return { id: json.data.id, label: json.data.name };
    };

    const onCategoryIdsChange = (ids: string[]) => {
        const primary =
            ids.includes(data.primary_category_id) && data.primary_category_id
                ? data.primary_category_id
                : (ids[0] ?? '');
        setData((current) => ({
            ...current,
            category_ids: ids,
            primary_category_id: primary,
        }));
    };

    const submit = () => {
        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            transform((payload) => ({
                ...payload,
                _method: 'put',
            }));
            post(`/centros-turisticos/${spot.id}`, options);
            return;
        }

        transform((payload) => payload);
        post('/centros-turisticos', options);
    };

    const availableEstados = canPublish
        ? estados
        : estados.filter((e) => e !== 'publicado');

    const hourErrors = useMemo(() => {
        const mapped: Record<string, string> = {};
        Object.entries(errors).forEach(([key, value]) => {
            if (key.startsWith('hours.')) {
                mapped[key.replace(/^hours\./, 'service_hours.')] = value;
            }
        });
        return mapped;
    }, [errors]);

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                isEditing
                    ? t('tour_spots.edit_title')
                    : t('tour_spots.create_title')
            }
            description={t('tour_spots.form_hint')}
            icon={MapPin}
            submitLabel={
                isEditing
                    ? t('table.save_changes')
                    : t('tour_spots.create_submit')
            }
            onSubmit={submit}
            canSubmit={canSubmit}
            submitting={processing}
            size="xl"
            contentClassName="sm:max-w-4xl"
            onAfterClose={() => {
                reset();
                clearErrors();
                transform((payload) => payload);
                setProvincias([]);
                setDistritos([]);
                setExistingCoverUrl(null);
                setExistingMedia([]);
                setGalleryPreviews([]);
            }}
        >
            <div className="space-y-6">
                <section className="space-y-3">
                    <SectionTitle>{t('tour_spots.section_identity')}</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            label={t('tour_spots.field_nombre')}
                            required
                            error={errors.nombre}
                        >
                            <Input
                                value={data.nombre}
                                onChange={(e) => setData('nombre', e.target.value)}
                                className="bg-card"
                            />
                        </FormField>
                        <FormField label={t('tour_spots.field_slug')} error={errors.slug}>
                            <Input
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                className="bg-card font-mono text-[13px]"
                                placeholder="auto"
                            />
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_resumen')}
                            className="sm:col-span-2"
                            error={errors.resumen}
                        >
                            <Input
                                value={data.resumen}
                                onChange={(e) => setData('resumen', e.target.value)}
                                className="bg-card"
                                maxLength={300}
                            />
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_descripcion')}
                            className="sm:col-span-2"
                            error={errors.descripcion}
                        >
                            <textarea
                                value={data.descripcion}
                                onChange={(e) =>
                                    setData('descripcion', e.target.value)
                                }
                                rows={3}
                                className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                            />
                        </FormField>
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionTitle>{t('tour_spots.section_photos')}</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            label={t('tour_spots.field_cover')}
                            error={errors.cover}
                        >
                            <ImageUploadField
                                value={data.cover}
                                existingUrl={existingCoverUrl}
                                removed={data.remove_cover}
                                onFileChange={(file) => {
                                    setData('cover', file);
                                    setData('remove_cover', false);
                                }}
                                onRemove={() => {
                                    setData('cover', null);
                                    setData('remove_cover', true);
                                }}
                                layout="compact"
                                previewAspect="video"
                            />
                        </FormField>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">
                                {t('tour_spots.field_gallery')}
                            </p>
                            <p className="text-[12px] text-muted-foreground">
                                {t('tour_spots.field_gallery_hint', {
                                    max: MAX_GALLERY,
                                })}
                            </p>

                            <div className="grid grid-cols-3 gap-2">
                                {visibleMedia.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group relative overflow-hidden rounded-lg border border-border"
                                    >
                                        <img
                                            src={item.url}
                                            alt=""
                                            className="aspect-square w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                            onClick={() =>
                                                setData('remove_media_ids', [
                                                    ...data.remove_media_ids,
                                                    item.id,
                                                ])
                                            }
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                ))}

                                {galleryPreviews.map((url, index) => (
                                    <div
                                        key={`new-${index}`}
                                        className="group relative overflow-hidden rounded-lg border border-brand-blue/30"
                                    >
                                        <img
                                            src={url}
                                            alt=""
                                            className="aspect-square w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                            onClick={() =>
                                                setData(
                                                    'gallery',
                                                    data.gallery.filter(
                                                        (_, i) => i !== index,
                                                    ),
                                                )
                                            }
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                ))}

                                {remainingGallerySlots > 0 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            galleryInputRef.current?.click()
                                        }
                                        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#d0dbef] bg-muted/20 text-muted-foreground transition-colors hover:bg-white/60"
                                    >
                                        <ImagePlus className="size-5 text-brand-orange" />
                                        <span className="text-[11px]">
                                            {t('tour_spots.add_photo')}
                                        </span>
                                    </button>
                                )}
                            </div>

                            <input
                                ref={galleryInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                className="sr-only"
                                onChange={(e) => {
                                    const files = Array.from(
                                        e.target.files ?? [],
                                    );
                                    if (files.length === 0) return;
                                    const next = [...data.gallery, ...files].slice(
                                        0,
                                        MAX_GALLERY - visibleMedia.length,
                                    );
                                    setData('gallery', next);
                                    e.target.value = '';
                                }}
                            />
                            {errors.gallery && (
                                <p className="text-[12px] text-destructive">
                                    {errors.gallery}
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionTitle>{t('tour_spots.section_location')}</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <FormField
                            label={t('tour_spots.field_departamento')}
                            required
                            error={errors.departamento_id}
                        >
                            <Select
                                value={
                                    data.departamento_id
                                        ? String(data.departamento_id)
                                        : undefined
                                }
                                onValueChange={(v) => {
                                    setData('departamento_id', Number(v));
                                    setData('provincia_id', '');
                                    setData('distrito_id', '');
                                    setDistritos([]);
                                    void loadProvincias(v);
                                }}
                            >
                                <SelectTrigger className="w-full bg-card">
                                    <SelectValue
                                        placeholder={t(
                                            'tour_spots.select_placeholder',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {departamentos.map((row) => (
                                        <SelectItem
                                            key={row.id}
                                            value={String(row.id)}
                                        >
                                            {row.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_provincia')}
                            required
                            error={errors.provincia_id}
                        >
                            <Select
                                value={
                                    data.provincia_id
                                        ? String(data.provincia_id)
                                        : undefined
                                }
                                onValueChange={(v) => {
                                    setData('provincia_id', Number(v));
                                    setData('distrito_id', '');
                                    void loadDistritos(v);
                                }}
                                disabled={!data.departamento_id || loadingGeo}
                            >
                                <SelectTrigger className="w-full bg-card">
                                    <SelectValue
                                        placeholder={t(
                                            'tour_spots.select_placeholder',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {provincias.map((row) => (
                                        <SelectItem
                                            key={row.id}
                                            value={String(row.id)}
                                        >
                                            {row.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_distrito')}
                            required
                            error={errors.distrito_id}
                        >
                            <Select
                                value={
                                    data.distrito_id
                                        ? String(data.distrito_id)
                                        : undefined
                                }
                                onValueChange={(v) =>
                                    setData('distrito_id', Number(v))
                                }
                                disabled={!data.provincia_id || loadingGeo}
                            >
                                <SelectTrigger className="w-full bg-card">
                                    <SelectValue
                                        placeholder={t(
                                            'tour_spots.select_placeholder',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {distritos.map((row) => (
                                        <SelectItem
                                            key={row.id}
                                            value={String(row.id)}
                                        >
                                            {row.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_direccion')}
                            className="sm:col-span-2"
                            error={errors.direccion}
                        >
                            <Input
                                value={data.direccion}
                                onChange={(e) =>
                                    setData('direccion', e.target.value)
                                }
                                className="bg-card"
                            />
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_referencia')}
                            error={errors.referencia}
                        >
                            <Input
                                value={data.referencia}
                                onChange={(e) =>
                                    setData('referencia', e.target.value)
                                }
                                className="bg-card"
                            />
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_latitud')}
                            error={errors.latitud}
                        >
                            <Input
                                type="number"
                                step="0.000001"
                                value={data.latitud}
                                onChange={(e) =>
                                    setData('latitud', e.target.value)
                                }
                                className="bg-card"
                            />
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_longitud')}
                            error={errors.longitud}
                        >
                            <Input
                                type="number"
                                step="0.000001"
                                value={data.longitud}
                                onChange={(e) =>
                                    setData('longitud', e.target.value)
                                }
                                className="bg-card"
                            />
                        </FormField>
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionTitle>{t('tour_spots.section_taxonomy')}</SectionTitle>
                    <FormField
                        label={t('tour_spots.field_categories')}
                        error={errors.category_ids}
                    >
                        <CreatableMultiCombobox
                            options={categoryOptions}
                            value={data.category_ids}
                            onChange={onCategoryIdsChange}
                            onCreate={createCategory}
                            placeholder={t('tour_spots.combobox_categories_ph')}
                        />
                    </FormField>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            label={t('tour_spots.field_primary_category')}
                            error={errors.primary_category_id}
                        >
                            <Select
                                value={data.primary_category_id || undefined}
                                onValueChange={(v) =>
                                    setData('primary_category_id', v)
                                }
                                disabled={data.category_ids.length === 0}
                            >
                                <SelectTrigger className="w-full bg-card">
                                    <SelectValue
                                        placeholder={t(
                                            'tour_spots.select_placeholder',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories
                                        .filter((c) =>
                                            data.category_ids.includes(c.id),
                                        )
                                        .map((cat) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={cat.id}
                                            >
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_vialidad')}
                            error={errors.vialidad_principal}
                        >
                            <CreatableCombobox
                                options={roadOptions}
                                value={data.vialidad_principal}
                                onChange={(slug) =>
                                    setData('vialidad_principal', slug)
                                }
                                onCreate={createRoadType}
                                placeholder={t('tour_spots.combobox_road_ph')}
                            />
                        </FormField>
                    </div>
                    <FormField
                        label={t('tour_spots.field_access_modes')}
                        error={errors.access_mode_ids}
                    >
                        <CreatableMultiCombobox
                            options={accessOptions}
                            value={data.access_mode_ids}
                            onChange={(ids) => setData('access_mode_ids', ids)}
                            onCreate={createAccessMode}
                            placeholder={t('tour_spots.combobox_access_ph')}
                        />
                    </FormField>
                    <FormField
                        label={t('tour_spots.field_inclusions')}
                        error={errors.inclusion_ids}
                    >
                        <CreatableMultiCombobox
                            options={inclusionOptions}
                            value={data.inclusion_ids}
                            onChange={(ids) => setData('inclusion_ids', ids)}
                            onCreate={createInclusion}
                            placeholder={t('tour_spots.combobox_inclusion_ph')}
                        />
                    </FormField>
                    <label
                        className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                            data.accesible_movilidad_reducida
                                ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                                : 'border-border bg-card',
                        )}
                    >
                        <Checkbox
                            checked={data.accesible_movilidad_reducida}
                            onCheckedChange={(v) =>
                                setData(
                                    'accesible_movilidad_reducida',
                                    v === true,
                                )
                            }
                            className="mt-0.5"
                        />
                        <span className="text-sm font-medium">
                            {t('tour_spots.field_accesible_movilidad')}
                        </span>
                    </label>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <FormField label={t('tour_spots.field_dificultad')}>
                            <Select
                                value={data.dificultad_acceso}
                                onValueChange={(v) =>
                                    setData('dificultad_acceso', v)
                                }
                            >
                                <SelectTrigger className="w-full bg-card">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {dificultades.map((row) => (
                                        <SelectItem key={row} value={row}>
                                            {t(
                                                `tour_spots.dificultad_${row}` as 'tour_spots.dificultad_facil',
                                            )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_tiempo_acceso')}
                            error={errors.tiempo_acceso_min}
                        >
                            <Input
                                type="number"
                                min="0"
                                value={data.tiempo_acceso_min}
                                onChange={(e) =>
                                    setData('tiempo_acceso_min', e.target.value)
                                }
                                className="bg-card"
                            />
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_distancia_acceso')}
                            error={errors.distancia_acceso_km}
                        >
                            <Input
                                type="number"
                                step="0.1"
                                min="0"
                                value={data.distancia_acceso_km}
                                onChange={(e) =>
                                    setData(
                                        'distancia_acceso_km',
                                        e.target.value,
                                    )
                                }
                                className="bg-card"
                            />
                        </FormField>
                        <FormField label={t('tour_spots.field_estacionamiento')}>
                            <Select
                                value={data.estacionamiento}
                                onValueChange={(v) =>
                                    setData('estacionamiento', v)
                                }
                            >
                                <SelectTrigger className="w-full bg-card">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {estacionamientos.map((row) => (
                                        <SelectItem key={row} value={row}>
                                            {t(
                                                `tour_spots.estacionamiento_${row}` as 'tour_spots.estacionamiento_ninguno',
                                            )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_acceso_notas')}
                            className="sm:col-span-2"
                            error={errors.acceso_notas}
                        >
                            <textarea
                                value={data.acceso_notas}
                                onChange={(e) =>
                                    setData('acceso_notas', e.target.value)
                                }
                                rows={2}
                                className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                            />
                        </FormField>
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionTitle>{t('tour_spots.section_hours')}</SectionTitle>
                    <p className="text-[12px] text-muted-foreground">
                        {t('tour_spots.section_hours_hint')}
                    </p>
                    <ServiceHoursSection
                        hours={data.hours}
                        onChange={(hours) => setData('hours', hours)}
                        errors={hourErrors}
                    />
                    <FormField
                        label={t('tour_spots.field_horario')}
                        error={errors.horario_texto}
                    >
                        <Input
                            value={data.horario_texto}
                            onChange={(e) =>
                                setData('horario_texto', e.target.value)
                            }
                            className="bg-card"
                            placeholder={t('tour_spots.field_horario_hint')}
                        />
                    </FormField>
                </section>

                <section className="space-y-3">
                    <SectionTitle>{t('tour_spots.section_practical')}</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors sm:col-span-3',
                                data.es_gratuito
                                    ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                                    : 'border-border bg-card',
                            )}
                        >
                            <Checkbox
                                checked={data.es_gratuito}
                                onCheckedChange={(v) =>
                                    setData('es_gratuito', v === true)
                                }
                                className="mt-0.5"
                            />
                            <span className="text-sm font-medium">
                                {t('tour_spots.field_es_gratuito')}
                            </span>
                        </label>
                        <FormField
                            label={t('tour_spots.field_precio_desde')}
                            error={errors.precio_entrada_desde}
                        >
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.precio_entrada_desde}
                                onChange={(e) =>
                                    setData(
                                        'precio_entrada_desde',
                                        e.target.value,
                                    )
                                }
                                className="bg-card"
                                disabled={data.es_gratuito}
                            />
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_precio_hasta')}
                            error={errors.precio_entrada_hasta}
                        >
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.precio_entrada_hasta}
                                onChange={(e) =>
                                    setData(
                                        'precio_entrada_hasta',
                                        e.target.value,
                                    )
                                }
                                className="bg-card"
                                disabled={data.es_gratuito}
                            />
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_mejor_epoca')}
                            error={errors.mejor_epoca}
                        >
                            <Input
                                value={data.mejor_epoca}
                                onChange={(e) =>
                                    setData('mejor_epoca', e.target.value)
                                }
                                className="bg-card"
                            />
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_duracion')}
                            error={errors.duracion_visita_min}
                        >
                            <Input
                                type="number"
                                min="0"
                                value={data.duracion_visita_min}
                                onChange={(e) =>
                                    setData(
                                        'duracion_visita_min',
                                        e.target.value,
                                    )
                                }
                                className="bg-card"
                            />
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_telefono')}
                            error={errors.telefono}
                        >
                            <Input
                                value={data.telefono}
                                onChange={(e) =>
                                    setData('telefono', e.target.value)
                                }
                                className="bg-card"
                            />
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_whatsapp')}
                            error={errors.whatsapp}
                        >
                            <Input
                                value={data.whatsapp}
                                onChange={(e) =>
                                    setData('whatsapp', e.target.value)
                                }
                                className="bg-card"
                            />
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_website')}
                            error={errors.website}
                        >
                            <Input
                                value={data.website}
                                onChange={(e) =>
                                    setData('website', e.target.value)
                                }
                                className="bg-card"
                            />
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_tips')}
                            className="sm:col-span-3"
                            error={errors.tips}
                        >
                            <textarea
                                value={data.tips}
                                onChange={(e) =>
                                    setData('tips', e.target.value)
                                }
                                rows={3}
                                className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                            />
                        </FormField>
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionTitle>{t('tour_spots.section_publish')}</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            label={t('tour_spots.field_estado')}
                            required
                            error={errors.estado}
                        >
                            <Select
                                value={data.estado}
                                onValueChange={(v) => setData('estado', v)}
                            >
                                <SelectTrigger className="w-full bg-card">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableEstados.map((row) => (
                                        <SelectItem key={row} value={row}>
                                            {t(
                                                `tour_spots.estado_${row}` as 'tour_spots.estado_borrador',
                                            )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                                data.destacado
                                    ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                                    : 'border-border bg-card',
                            )}
                        >
                            <Checkbox
                                checked={data.destacado}
                                onCheckedChange={(v) =>
                                    setData('destacado', v === true)
                                }
                                className="mt-0.5"
                            />
                            <span className="space-y-0.5">
                                <span className="block text-sm font-medium">
                                    {t('tour_spots.field_destacado')}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    {t('tour_spots.field_destacado_hint')}
                                </span>
                            </span>
                        </label>
                    </div>
                </section>
            </div>
        </BaseModal>
    );
}
