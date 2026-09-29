import { useForm } from '@inertiajs/react';
import { BedDouble, Check, ImagePlus, Star, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { ImageUploadField } from '@/components/common/image-upload-field';
import { LocationMapPicker } from '@/components/configuracion/location-map-picker';
import type {
    GeoOption,
    HotelLimits,
    HotelMediaRow,
    HotelOptions,
    HotelRow,
} from '@/components/hotels/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type HotelFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hotel: HotelRow | null;
    departamentos: GeoOption[];
    options: HotelOptions;
    limits: HotelLimits;
    canPublish: boolean;
    mapboxToken: string | null;
};

type GeoListResponse = { data: GeoOption[] };

const EXCLUSIVE_REDES = 'ninguna';

async function fetchGeo(url: string): Promise<GeoOption[]> {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const json = (await res.json()) as GeoListResponse;

    return json.data ?? [];
}

function SectionTitle({ children }: { children: string }) {
    return (
        <h3 className="border-b border-border/80 pb-2 text-sm font-semibold text-brand-blue">
            {children}
        </h3>
    );
}

function MultiChoiceGrid({
    values,
    selected,
    labelFor,
    onChange,
    columns = 'sm:grid-cols-2',
}: {
    values: string[];
    selected: string[];
    labelFor: (value: string) => string;
    onChange: (next: string[]) => void;
    columns?: string;
}) {
    const toggle = (value: string, checked: boolean) => {
        onChange(
            checked
                ? values.filter((v) => v === value || selected.includes(v))
                : selected.filter((v) => v !== value),
        );
    };

    return (
        <div className={cn('grid gap-2', columns)}>
            {values.map((value) => {
                const active = selected.includes(value);

                return (
                    <label
                        key={value}
                        className={cn(
                            'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                            active
                                ? 'border-brand-blue/40 bg-brand-blue/[0.06] font-medium'
                                : 'border-border bg-card hover:bg-muted/30',
                        )}
                    >
                        <Checkbox
                            checked={active}
                            onCheckedChange={(v) => toggle(value, v === true)}
                        />
                        <span>{labelFor(value)}</span>
                    </label>
                );
            })}
        </div>
    );
}

function SingleChoiceGrid({
    values,
    selected,
    labelFor,
    onChange,
    columns = 'sm:grid-cols-2',
}: {
    values: string[];
    selected: string;
    labelFor: (value: string) => string;
    onChange: (next: string) => void;
    columns?: string;
}) {
    return (
        <div className={cn('grid gap-2', columns)}>
            {values.map((value) => {
                const active = selected === value;

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onChange(value)}
                        className={cn(
                            'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                            active
                                ? 'border-brand-blue/40 bg-brand-blue/[0.06] font-medium'
                                : 'border-border bg-card hover:bg-muted/30',
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-4 shrink-0 items-center justify-center rounded-full border',
                                active
                                    ? 'border-brand-blue bg-brand-blue text-white'
                                    : 'border-input',
                            )}
                        >
                            {active && <Check className="size-3" />}
                        </span>
                        <span>{labelFor(value)}</span>
                    </button>
                );
            })}
        </div>
    );
}

function ClassificationPicker({
    values,
    selected,
    onChange,
    labelFor,
    noCategoryHint,
}: {
    values: string[];
    selected: string;
    onChange: (next: string) => void;
    labelFor: (value: string) => string;
    noCategoryHint: string;
}) {
    return (
        <div className="grid gap-2 sm:grid-cols-3">
            {values.map((value) => {
                const active = selected === value;
                const stars = Number.parseInt(value, 10);
                const hasStars = Number.isFinite(stars) && stars > 0;

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onChange(value)}
                        className={cn(
                            'flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                            active
                                ? 'border-brand-orange/50 bg-brand-orange/[0.08] font-medium'
                                : 'border-border bg-card hover:bg-muted/30',
                            !hasStars && 'sm:col-span-3',
                        )}
                    >
                        {hasStars ? (
                            <span className="flex items-center gap-0.5 text-brand-orange">
                                {Array.from({ length: stars }).map((_, i) => (
                                    <Star key={i} className="size-4 fill-current" />
                                ))}
                            </span>
                        ) : null}
                        <span>{labelFor(value)}</span>
                        {!hasStars && (
                            <span className="text-xs font-normal text-muted-foreground">
                                {noCategoryHint}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

function Textarea({
    value,
    onChange,
    rows = 3,
    maxLength,
}: {
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    maxLength?: number;
}) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            maxLength={maxLength}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
    );
}

export function HotelFormModal({
    open,
    onOpenChange,
    hotel,
    departamentos,
    options,
    limits,
    canPublish,
    mapboxToken,
}: HotelFormModalProps) {
    const { t } = useTranslations();
    const isEditing = hotel !== null;
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const [provincias, setProvincias] = useState<GeoOption[]>([]);
    const [distritos, setDistritos] = useState<GeoOption[]>([]);
    const [loadingGeo, setLoadingGeo] = useState(false);
    const existingCoverUrl = hotel?.imagen_portada_url ?? null;
    const existingMedia: HotelMediaRow[] = useMemo(() => hotel?.media ?? [], [hotel]);

    const { data, setData, post, transform, processing, errors, reset, clearErrors } =
        useForm({
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
        });

    const loadProvincias = async (departamentoId: string) => {
        setLoadingGeo(true);

        try {
            setProvincias(
                await fetchGeo(`/hoteles/geo/provincias?departamento_id=${departamentoId}`),
            );
        } finally {
            setLoadingGeo(false);
        }
    };

    const loadDistritos = async (provinciaId: string) => {
        setLoadingGeo(true);

        try {
            setDistritos(await fetchGeo(`/hoteles/geo/distritos?provincia_id=${provinciaId}`));
        } finally {
            setLoadingGeo(false);
        }
    };

    const loadGeoForHotel = async (row: HotelRow) => {
        const [provinciasRows, distritosRows] = await Promise.all([
            row.departamento_id
                ? fetchGeo(`/hoteles/geo/provincias?departamento_id=${row.departamento_id}`)
                : Promise.resolve([]),
            row.provincia_id
                ? fetchGeo(`/hoteles/geo/distritos?provincia_id=${row.provincia_id}`)
                : Promise.resolve([]),
        ]);
        setProvincias(provinciasRows);
        setDistritos(distritosRows);
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        if (hotel) {
            setData({
                nombre: hotel.nombre,
                slug: hotel.slug,
                ruc: hotel.ruc,
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
                precio_desde:
                    hotel.precio_desde !== null ? String(hotel.precio_desde) : '',
                precio_hasta:
                    hotel.precio_hasta !== null ? String(hotel.precio_hasta) : '',
                moneda: hotel.moneda || 'PEN',
                clasificacion: hotel.clasificacion ?? '',
                servicios: hotel.servicios ?? [],
                medios_pago: hotel.medios_pago ?? [],
                cover: null,
                remove_cover: false,
                gallery: [],
                remove_media_ids: [],
                sistema_reservas: hotel.sistema_reservas ?? '',
                interes_whatsapp: hotel.interes_whatsapp ?? '',
                redes_sociales: hotel.redes_sociales ?? [],
                herramientas_interes: hotel.herramientas_interes ?? [],
                mayor_reto: hotel.mayor_reto ?? '',
                sugerencias: hotel.sugerencias ?? '',
                destacado: hotel.destacado,
                estado: hotel.estado,
            });
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void loadGeoForHotel(hotel);
        } else {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, hotel]);

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

    const submit = () => {
        const requestOptions = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            transform((payload) => ({ ...payload, _method: 'put' }));
            post(`/hoteles/${hotel.id}`, requestOptions);

            return;
        }

        transform((payload) => payload);
        post('/hoteles', requestOptions);
    };

    const availableEstados = canPublish
        ? options.estados
        : options.estados.filter((e) => e !== 'publicado');

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? t('hotels.edit_title') : t('hotels.create_title')}
            description={t('hotels.form_hint', {
                min: limits.min_photos_to_publish,
            })}
            icon={BedDouble}
            submitLabel={
                isEditing ? t('table.save_changes') : t('hotels.create_submit')
            }
            onSubmit={submit}
            canSubmit={data.nombre.trim().length > 0}
            submitting={processing}
            size="xl"
            contentClassName="sm:max-w-4xl"
            onAfterClose={() => {
                reset();
                clearErrors();
                transform((payload) => payload);
                setProvincias([]);
                setDistritos([]);
            }}
        >
            <div className="space-y-6">
                <section className="space-y-3">
                    <SectionTitle>{t('hotels.section_general')}</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            label={t('hotels.field_nombre')}
                            required
                            error={errors.nombre}
                        >
                            <Input
                                value={data.nombre}
                                onChange={(e) => setData('nombre', e.target.value)}
                                placeholder={t('hotels.field_nombre_ph')}
                                className="bg-card"
                                maxLength={150}
                            />
                        </FormField>
                        <FormField
                            label={t('hotels.field_ruc')}
                            required
                            error={errors.ruc}
                        >
                            <Input
                                value={data.ruc}
                                onChange={(e) =>
                                    setData(
                                        'ruc',
                                        e.target.value.replace(/\D/g, '').slice(0, 11),
                                    )
                                }
                                inputMode="numeric"
                                placeholder={t('hotels.field_ruc_ph')}
                                className="bg-card font-mono"
                            />
                        </FormField>
                        <FormField
                            label={t('hotels.field_direccion')}
                            required
                            error={errors.direccion}
                        >
                            <Input
                                value={data.direccion}
                                onChange={(e) => setData('direccion', e.target.value)}
                                className="bg-card"
                                maxLength={255}
                            />
                        </FormField>
                        <FormField
                            label={t('hotels.field_referencia')}
                            error={errors.referencia}
                        >
                            <Input
                                value={data.referencia}
                                onChange={(e) => setData('referencia', e.target.value)}
                                placeholder={t('hotels.field_referencia_ph')}
                                className="bg-card"
                                maxLength={255}
                            />
                        </FormField>
                        <FormField
                            label={t('hotels.field_telefono')}
                            required
                            error={errors.telefono_reservas}
                        >
                            <Input
                                value={data.telefono_reservas}
                                onChange={(e) =>
                                    setData('telefono_reservas', e.target.value)
                                }
                                inputMode="tel"
                                className="bg-card"
                                maxLength={20}
                            />
                        </FormField>
                        <FormField label={t('hotels.field_email')} error={errors.email}>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="bg-card"
                            />
                        </FormField>
                        <FormField
                            label={t('hotels.field_check_in')}
                            error={errors.check_in}
                        >
                            <Input
                                type="time"
                                value={data.check_in}
                                onChange={(e) => setData('check_in', e.target.value)}
                                className="bg-card"
                            />
                        </FormField>
                        <FormField
                            label={t('hotels.field_check_out')}
                            error={errors.check_out}
                        >
                            <Input
                                type="time"
                                value={data.check_out}
                                onChange={(e) => setData('check_out', e.target.value)}
                                className="bg-card"
                            />
                        </FormField>
                        <FormField
                            label={t('hotels.field_website')}
                            error={errors.website}
                        >
                            <Input
                                value={data.website}
                                onChange={(e) => setData('website', e.target.value)}
                                className="bg-card"
                            />
                        </FormField>
                        <FormField label={t('hotels.field_slug')} error={errors.slug}>
                            <Input
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                className="bg-card font-mono text-[13px]"
                                placeholder="auto"
                            />
                        </FormField>
                        <FormField
                            label={t('hotels.field_resumen')}
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
                            label={t('hotels.field_descripcion')}
                            className="sm:col-span-2"
                            error={errors.descripcion}
                        >
                            <Textarea
                                value={data.descripcion}
                                onChange={(v) => setData('descripcion', v)}
                            />
                        </FormField>
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionTitle>{t('hotels.section_rooms')}</SectionTitle>
                    <FormField
                        label={t('hotels.field_tipos_habitacion')}
                        required
                        error={errors.tipos_habitacion}
                    >
                        <MultiChoiceGrid
                            values={options.tipos_habitacion}
                            selected={data.tipos_habitacion}
                            labelFor={(v) => t(`hotels.tipo_${v}`)}
                            onChange={(next) => setData('tipos_habitacion', next)}
                            columns="sm:grid-cols-3"
                        />
                    </FormField>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            label={`${t('hotels.field_precio_desde')} (S/)`}
                            error={errors.precio_desde}
                        >
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.precio_desde}
                                onChange={(e) => setData('precio_desde', e.target.value)}
                                className="bg-card"
                            />
                        </FormField>
                        <FormField
                            label={`${t('hotels.field_precio_hasta')} (S/)`}
                            error={errors.precio_hasta}
                        >
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.precio_hasta}
                                onChange={(e) => setData('precio_hasta', e.target.value)}
                                className="bg-card"
                            />
                        </FormField>
                    </div>
                    <FormField
                        label={t('hotels.field_clasificacion')}
                        required
                        error={errors.clasificacion}
                    >
                        <ClassificationPicker
                            values={options.clasificaciones}
                            selected={data.clasificacion}
                            onChange={(v) => setData('clasificacion', v)}
                            labelFor={(v) => t(`hotels.clasificacion_${v}`)}
                            noCategoryHint={t('hotels.clasificacion_sin_categoria_hint')}
                        />
                    </FormField>
                </section>

                <section className="space-y-3">
                    <SectionTitle>{t('hotels.section_services')}</SectionTitle>
                    <FormField
                        label={t('hotels.field_servicios')}
                        required
                        error={errors.servicios}
                    >
                        <MultiChoiceGrid
                            values={options.servicios}
                            selected={data.servicios}
                            labelFor={(v) => t(`hotels.servicio_${v}`)}
                            onChange={(next) => setData('servicios', next)}
                            columns="sm:grid-cols-2 lg:grid-cols-3"
                        />
                    </FormField>
                </section>

                <section className="space-y-3">
                    <SectionTitle>{t('hotels.section_payments')}</SectionTitle>
                    <FormField
                        label={t('hotels.field_medios_pago')}
                        required
                        error={errors.medios_pago}
                    >
                        <MultiChoiceGrid
                            values={options.medios_pago}
                            selected={data.medios_pago}
                            labelFor={(v) => t(`hotels.pago_${v}`)}
                            onChange={(next) => setData('medios_pago', next)}
                        />
                    </FormField>
                </section>

                <section className="space-y-3">
                    <SectionTitle>{t('hotels.section_photos')}</SectionTitle>
                    <p
                        className={cn(
                            'text-[12px]',
                            totalPhotos >= limits.min_photos_to_publish
                                ? 'text-muted-foreground'
                                : 'text-brand-orange',
                        )}
                    >
                        {t('hotels.section_photos_hint', {
                            min: limits.min_photos_to_publish,
                        })}{' '}
                        ({totalPhotos}/{limits.min_photos_to_publish})
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label={t('hotels.field_cover')} error={errors.cover}>
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
                                {t('hotels.field_gallery')}
                            </p>
                            <p className="text-[12px] text-muted-foreground">
                                {t('hotels.field_gallery_hint', {
                                    max: limits.max_gallery,
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
                                        onClick={() => galleryInputRef.current?.click()}
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
                                    const files = Array.from(e.target.files ?? []);

                                    if (files.length === 0) {
return;
}

                                    const next = [...data.gallery, ...files].slice(
                                        0,
                                        limits.max_gallery - visibleMedia.length,
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
                    <SectionTitle>{t('hotels.section_location')}</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <FormField
                            label={t('hotels.field_departamento')}
                            error={errors.departamento_id}
                        >
                            <Select
                                value={
                                    data.departamento_id
                                        ? String(data.departamento_id)
                                        : undefined
                                }
                                onValueChange={(v) => {
                                    setData((current) => ({
                                        ...current,
                                        departamento_id: Number(v),
                                        provincia_id: '',
                                        distrito_id: '',
                                    }));
                                    setDistritos([]);
                                    void loadProvincias(v);
                                }}
                            >
                                <SelectTrigger className="w-full bg-card">
                                    <SelectValue
                                        placeholder={t('hotels.select_placeholder')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {departamentos.map((row) => (
                                        <SelectItem key={row.id} value={String(row.id)}>
                                            {row.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField
                            label={t('hotels.field_provincia')}
                            error={errors.provincia_id}
                        >
                            <Select
                                value={
                                    data.provincia_id
                                        ? String(data.provincia_id)
                                        : undefined
                                }
                                onValueChange={(v) => {
                                    setData((current) => ({
                                        ...current,
                                        provincia_id: Number(v),
                                        distrito_id: '',
                                    }));
                                    void loadDistritos(v);
                                }}
                                disabled={!data.departamento_id || loadingGeo}
                            >
                                <SelectTrigger className="w-full bg-card">
                                    <SelectValue
                                        placeholder={t('hotels.select_placeholder')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {provincias.map((row) => (
                                        <SelectItem key={row.id} value={String(row.id)}>
                                            {row.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField
                            label={t('hotels.field_distrito')}
                            error={errors.distrito_id}
                        >
                            <Select
                                value={
                                    data.distrito_id ? String(data.distrito_id) : undefined
                                }
                                onValueChange={(v) => setData('distrito_id', Number(v))}
                                disabled={!data.provincia_id || loadingGeo}
                            >
                                <SelectTrigger className="w-full bg-card">
                                    <SelectValue
                                        placeholder={t('hotels.select_placeholder')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {distritos.map((row) => (
                                        <SelectItem key={row.id} value={String(row.id)}>
                                            {row.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField
                            label={t('hotels.field_map')}
                            hint={t('hotels.map_hint')}
                            error={errors.latitud ?? errors.longitud}
                            className="sm:col-span-3"
                        >
                            <LocationMapPicker
                                token={mapboxToken}
                                value={{
                                    latitud:
                                        data.latitud !== '' ? Number(data.latitud) : null,
                                    longitud:
                                        data.longitud !== ''
                                            ? Number(data.longitud)
                                            : null,
                                    direccion: data.direccion || undefined,
                                }}
                                onChange={(next) => {
                                    setData((current) => ({
                                        ...current,
                                        latitud:
                                            next.latitud != null
                                                ? String(next.latitud)
                                                : '',
                                        longitud:
                                            next.longitud != null
                                                ? String(next.longitud)
                                                : '',
                                        direccion:
                                            next.direccion && !current.direccion
                                                ? String(next.direccion)
                                                : current.direccion,
                                    }));
                                }}
                                searchPlaceholder={t('hotels.map_search_placeholder')}
                                hint={t('hotels.map_hint')}
                            />
                        </FormField>
                    </div>
                </section>

                <section className="space-y-4">
                    <SectionTitle>{t('hotels.section_diagnosis')}</SectionTitle>
                    <FormField
                        label={t('hotels.field_sistema_reservas')}
                        required
                        error={errors.sistema_reservas}
                    >
                        <SingleChoiceGrid
                            values={options.sistemas_reserva}
                            selected={data.sistema_reservas}
                            labelFor={(v) => t(`hotels.sistema_${v}`)}
                            onChange={(v) => setData('sistema_reservas', v)}
                        />
                    </FormField>
                    <FormField
                        label={t('hotels.field_interes_whatsapp')}
                        required
                        error={errors.interes_whatsapp}
                    >
                        <SingleChoiceGrid
                            values={options.interes_whatsapp}
                            selected={data.interes_whatsapp}
                            labelFor={(v) => t(`hotels.interes_${v}`)}
                            onChange={(v) => setData('interes_whatsapp', v)}
                            columns="sm:grid-cols-3"
                        />
                    </FormField>
                    <FormField
                        label={t('hotels.field_redes_sociales')}
                        required
                        error={errors.redes_sociales}
                    >
                        <MultiChoiceGrid
                            values={options.redes_sociales}
                            selected={data.redes_sociales}
                            labelFor={(v) => t(`hotels.red_${v}`)}
                            onChange={onRedesChange}
                        />
                    </FormField>
                    <FormField
                        label={t('hotels.field_herramientas')}
                        error={errors.herramientas_interes}
                    >
                        <MultiChoiceGrid
                            values={options.herramientas}
                            selected={data.herramientas_interes}
                            labelFor={(v) => t(`hotels.herramienta_${v}`)}
                            onChange={(next) => setData('herramientas_interes', next)}
                        />
                    </FormField>
                    <FormField
                        label={t('hotels.field_mayor_reto')}
                        error={errors.mayor_reto}
                    >
                        <Textarea
                            value={data.mayor_reto}
                            onChange={(v) => setData('mayor_reto', v)}
                            maxLength={3000}
                        />
                    </FormField>
                    <FormField
                        label={t('hotels.field_sugerencias')}
                        error={errors.sugerencias}
                    >
                        <Textarea
                            value={data.sugerencias}
                            onChange={(v) => setData('sugerencias', v)}
                            maxLength={3000}
                        />
                    </FormField>
                </section>

                <section className="space-y-3">
                    <SectionTitle>{t('hotels.section_publish')}</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            label={t('hotels.field_estado')}
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
                                            {t(`hotels.estado_${row}`)}
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
                                onCheckedChange={(v) => setData('destacado', v === true)}
                                className="mt-0.5"
                            />
                            <span className="space-y-0.5">
                                <span className="block text-sm font-medium">
                                    {t('hotels.field_destacado')}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    {t('hotels.field_destacado_hint')}
                                </span>
                            </span>
                        </label>
                    </div>
                </section>
            </div>
        </BaseModal>
    );
}
