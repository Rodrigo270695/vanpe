import { ImagePlus, Trash2 } from 'lucide-react';
import { FormField } from '@/components/common/form-field';
import { ImageUploadField } from '@/components/common/image-upload-field';
import { LocationMapPicker } from '@/components/configuracion/location-map-picker';
import {
    ClassificationPicker,
    MultiChoiceGrid,
    SectionTitle,
    SingleChoiceGrid,
    Textarea,
} from '@/components/hotels/hotel-form-controls';
import type {
    GeoOption,
    HotelLimits,
    HotelOptions,
} from '@/components/hotels/types';
import type { HotelFormController } from '@/components/hotels/use-hotel-form';
import { onlyDigits, sanitizePrice } from '@/components/hotels/validation';
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

type SectionProps = { controller: HotelFormController };

export function HotelGeneralSection({ controller }: SectionProps) {
    const { t } = useTranslations();
    const { form, fieldError, touch, setField } = controller;
    const { data, setData } = form;

    return (
        <section className="space-y-3">
            <SectionTitle>{t('hotels.section_general')}</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    label={t('hotels.field_nombre')}
                    required
                    error={fieldError('nombre')}
                >
                    <Input
                        value={data.nombre}
                        onChange={(e) => setField('nombre', e.target.value)}
                        onBlur={touch('nombre')}
                        placeholder={t('hotels.field_nombre_ph')}
                        className="bg-card"
                        maxLength={150}
                    />
                </FormField>
                <FormField
                    label={t('hotels.field_ruc')}
                    required
                    hint={t('hotels.ruc_hint')}
                    error={fieldError('ruc')}
                >
                    <Input
                        value={data.ruc}
                        onChange={(e) => setField('ruc', onlyDigits(e.target.value, 11))}
                        onBlur={touch('ruc')}
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder={t('hotels.field_ruc_ph')}
                        className="bg-card font-mono"
                    />
                </FormField>
                <FormField
                    label={t('hotels.field_direccion')}
                    required
                    error={fieldError('direccion')}
                >
                    <Input
                        value={data.direccion}
                        onChange={(e) => setField('direccion', e.target.value)}
                        onBlur={touch('direccion')}
                        className="bg-card"
                        maxLength={255}
                    />
                </FormField>
                <FormField
                    label={t('hotels.field_referencia')}
                    error={fieldError('referencia')}
                >
                    <Input
                        value={data.referencia}
                        onChange={(e) => setField('referencia', e.target.value)}
                        placeholder={t('hotels.field_referencia_ph')}
                        className="bg-card"
                        maxLength={255}
                    />
                </FormField>
                <FormField
                    label={t('hotels.field_telefono')}
                    required
                    hint={t('hotels.phone_hint')}
                    error={fieldError('telefono_reservas')}
                >
                    <div className="flex">
                        <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                            +51
                        </span>
                        <Input
                            value={data.telefono_reservas}
                            onChange={(e) =>
                                setField(
                                    'telefono_reservas',
                                    onlyDigits(e.target.value, 9),
                                )
                            }
                            onBlur={touch('telefono_reservas')}
                            inputMode="numeric"
                            autoComplete="tel-national"
                            placeholder="987654321"
                            className="rounded-l-none bg-card font-mono"
                        />
                    </div>
                </FormField>
                <FormField label={t('hotels.field_email')} error={fieldError('email')}>
                    <Input
                        type="email"
                        value={data.email}
                        onChange={(e) => setField('email', e.target.value.trim())}
                        onBlur={touch('email')}
                        placeholder="reservas@hotel.com"
                        className="bg-card"
                        maxLength={150}
                    />
                </FormField>
                <FormField
                    label={t('hotels.field_check_in')}
                    error={fieldError('check_in')}
                >
                    <Input
                        type="time"
                        value={data.check_in}
                        onChange={(e) => setField('check_in', e.target.value)}
                        className="bg-card"
                    />
                </FormField>
                <FormField
                    label={t('hotels.field_check_out')}
                    error={fieldError('check_out')}
                >
                    <Input
                        type="time"
                        value={data.check_out}
                        onChange={(e) => setField('check_out', e.target.value)}
                        onBlur={touch('check_out')}
                        className="bg-card"
                    />
                </FormField>
                <FormField
                    label={t('hotels.field_website')}
                    error={fieldError('website')}
                >
                    <Input
                        value={data.website}
                        onChange={(e) => setField('website', e.target.value.trim())}
                        onBlur={touch('website')}
                        placeholder="https://mihotel.com"
                        className="bg-card"
                        maxLength={200}
                    />
                </FormField>
                <FormField label={t('hotels.field_slug')} error={fieldError('slug')}>
                    <Input
                        value={data.slug}
                        onChange={(e) =>
                            setField(
                                'slug',
                                e.target.value
                                    .toLowerCase()
                                    .replace(/\s+/g, '-')
                                    .replace(/[^a-z0-9-]/g, ''),
                            )
                        }
                        maxLength={160}
                        className="bg-card font-mono text-[13px]"
                        placeholder="auto"
                    />
                </FormField>
                <FormField
                    label={t('hotels.field_resumen')}
                    className="sm:col-span-2"
                    error={fieldError('resumen')}
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
                    error={fieldError('descripcion')}
                >
                    <Textarea
                        value={data.descripcion}
                        onChange={(v) => setData('descripcion', v)}
                    />
                </FormField>
            </div>
        </section>
    );
}

export function HotelRoomsSection({
    controller,
    options,
}: SectionProps & { options: HotelOptions }) {
    const { t } = useTranslations();
    const { form, fieldError, touch, setField } = controller;
    const { data, setData } = form;

    return (
        <section className="space-y-3">
            <SectionTitle>{t('hotels.section_rooms')}</SectionTitle>
            <FormField
                label={t('hotels.field_tipos_habitacion')}
                required
                error={fieldError('tipos_habitacion')}
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
                    error={fieldError('precio_desde')}
                >
                    <Input
                        value={data.precio_desde}
                        onChange={(e) =>
                            setField('precio_desde', sanitizePrice(e.target.value))
                        }
                        onBlur={touch('precio_desde')}
                        inputMode="decimal"
                        placeholder="80.00"
                        className="bg-card"
                    />
                </FormField>
                <FormField
                    label={`${t('hotels.field_precio_hasta')} (S/)`}
                    error={fieldError('precio_hasta')}
                >
                    <Input
                        value={data.precio_hasta}
                        onChange={(e) =>
                            setField('precio_hasta', sanitizePrice(e.target.value))
                        }
                        onBlur={touch('precio_hasta')}
                        inputMode="decimal"
                        placeholder="250.00"
                        className="bg-card"
                    />
                </FormField>
            </div>
            <FormField
                label={t('hotels.field_clasificacion')}
                required
                error={fieldError('clasificacion')}
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
    );
}

export function HotelServicesSection({
    controller,
    options,
}: SectionProps & { options: HotelOptions }) {
    const { t } = useTranslations();
    const { form, fieldError } = controller;
    const { data, setData } = form;

    return (
        <>
            <section className="space-y-3">
                <SectionTitle>{t('hotels.section_services')}</SectionTitle>
                <FormField
                    label={t('hotels.field_servicios')}
                    required
                    error={fieldError('servicios')}
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
                    error={fieldError('medios_pago')}
                >
                    <MultiChoiceGrid
                        values={options.medios_pago}
                        selected={data.medios_pago}
                        labelFor={(v) => t(`hotels.pago_${v}`)}
                        onChange={(next) => setData('medios_pago', next)}
                    />
                </FormField>
            </section>
        </>
    );
}

export function HotelPhotosSection({
    controller,
    limits,
}: SectionProps & { limits: HotelLimits }) {
    const { t } = useTranslations();
    const { form, fieldError, photos, galleryInputRef } = controller;
    const { data, setData } = form;

    return (
        <section className="space-y-3">
            <SectionTitle>{t('hotels.section_photos')}</SectionTitle>
            <p
                className={cn(
                    'text-[12px]',
                    photos.totalPhotos >= limits.min_photos_to_publish
                        ? 'text-muted-foreground'
                        : 'text-brand-orange',
                )}
            >
                {t('hotels.section_photos_hint', {
                    min: limits.min_photos_to_publish,
                })}{' '}
                ({photos.totalPhotos}/{limits.min_photos_to_publish})
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t('hotels.field_cover')} error={fieldError('cover')}>
                    <ImageUploadField
                        value={data.cover}
                        existingUrl={photos.existingCoverUrl}
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
                    <p className="text-sm font-medium">{t('hotels.field_gallery')}</p>
                    <p className="text-[12px] text-muted-foreground">
                        {t('hotels.field_gallery_hint', {
                            max: limits.max_gallery,
                        })}
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                        {photos.visibleMedia.map((item) => (
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

                        {photos.galleryPreviews.map((url, index) => (
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
                                            data.gallery.filter((_, i) => i !== index),
                                        )
                                    }
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            </div>
                        ))}

                        {photos.remainingGallerySlots > 0 && (
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
                                limits.max_gallery - photos.visibleMedia.length,
                            );
                            setData('gallery', next);
                            e.target.value = '';
                        }}
                    />
                    {fieldError('gallery') && (
                        <p className="text-[12px] text-destructive">
                            {fieldError('gallery')}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}

export function HotelLocationSection({
    controller,
    departamentos,
    mapboxToken,
}: SectionProps & { departamentos: GeoOption[]; mapboxToken: string | null }) {
    const { t } = useTranslations();
    const { form, fieldError, geo, clientErrors } = controller;
    const { data, setData, errors } = form;

    return (
        <section className="space-y-3">
            <SectionTitle>{t('hotels.section_location')}</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                    label={t('hotels.field_departamento')}
                    error={fieldError('departamento_id')}
                >
                    <Select
                        value={data.departamento_id ? String(data.departamento_id) : undefined}
                        onValueChange={(v) => void geo.onDepartamentoChange(v)}
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue placeholder={t('hotels.select_placeholder')} />
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
                    error={fieldError('provincia_id')}
                >
                    <Select
                        value={data.provincia_id ? String(data.provincia_id) : undefined}
                        onValueChange={(v) => void geo.onProvinciaChange(v)}
                        disabled={!data.departamento_id || geo.loading}
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue placeholder={t('hotels.select_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {geo.provincias.map((row) => (
                                <SelectItem key={row.id} value={String(row.id)}>
                                    {row.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>
                <FormField
                    label={t('hotels.field_distrito')}
                    error={fieldError('distrito_id')}
                >
                    <Select
                        value={data.distrito_id ? String(data.distrito_id) : undefined}
                        onValueChange={(v) => setData('distrito_id', Number(v))}
                        disabled={!data.provincia_id || geo.loading}
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue placeholder={t('hotels.select_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {geo.distritos.map((row) => (
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
                    error={errors.latitud ?? errors.longitud ?? clientErrors.latitud}
                    className="sm:col-span-3"
                >
                    <LocationMapPicker
                        token={mapboxToken}
                        value={{
                            latitud: data.latitud !== '' ? Number(data.latitud) : null,
                            longitud: data.longitud !== '' ? Number(data.longitud) : null,
                            direccion: data.direccion || undefined,
                        }}
                        onChange={(next) => {
                            setData((current) => ({
                                ...current,
                                latitud: next.latitud != null ? String(next.latitud) : '',
                                longitud:
                                    next.longitud != null ? String(next.longitud) : '',
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
    );
}

export function HotelDiagnosisSection({
    controller,
    options,
}: SectionProps & { options: HotelOptions }) {
    const { t } = useTranslations();
    const { form, fieldError, onRedesChange } = controller;
    const { data, setData } = form;

    return (
        <section className="space-y-4">
            <SectionTitle>{t('hotels.section_diagnosis')}</SectionTitle>
            <FormField
                label={t('hotels.field_sistema_reservas')}
                required
                error={fieldError('sistema_reservas')}
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
                error={fieldError('interes_whatsapp')}
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
                error={fieldError('redes_sociales')}
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
                error={fieldError('herramientas_interes')}
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
                error={fieldError('mayor_reto')}
            >
                <Textarea
                    value={data.mayor_reto}
                    onChange={(v) => setData('mayor_reto', v)}
                    maxLength={3000}
                />
            </FormField>
            <FormField
                label={t('hotels.field_sugerencias')}
                error={fieldError('sugerencias')}
            >
                <Textarea
                    value={data.sugerencias}
                    onChange={(v) => setData('sugerencias', v)}
                    maxLength={3000}
                />
            </FormField>
        </section>
    );
}

export function HotelPublishSection({
    controller,
    estados,
    showFeatured,
    hint,
}: SectionProps & {
    estados: string[];
    /** El destacado solo lo controla la plataforma. */
    showFeatured: boolean;
    hint?: string;
}) {
    const { t } = useTranslations();
    const { form, fieldError } = controller;
    const { data, setData } = form;

    return (
        <section className="space-y-3">
            <SectionTitle>{t('hotels.section_publish')}</SectionTitle>
            {hint && <p className="text-[12px] text-muted-foreground">{hint}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    label={t('hotels.field_estado')}
                    required
                    error={fieldError('estado')}
                >
                    <Select value={data.estado} onValueChange={(v) => setData('estado', v)}>
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {estados.map((row) => (
                                <SelectItem key={row} value={row}>
                                    {t(`hotels.estado_${row}`)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>
                {showFeatured && (
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
                )}
            </div>
        </section>
    );
}
