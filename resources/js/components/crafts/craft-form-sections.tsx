import { ChevronLeft, ChevronRight, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { FormField } from '@/components/common/form-field';
import { LocationMapPicker } from '@/components/configuracion/location-map-picker';
import type { CraftLimits, CraftOptions } from '@/components/crafts/types';
import type { CraftFormController } from '@/components/crafts/use-craft-form';
import { SectionTitle, Textarea } from '@/components/hotels/hotel-form-controls';
import { onlyDigits, sanitizePrice } from '@/components/hotels/validation';
import { Button } from '@/components/ui/button';
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

type SectionProps = { controller: CraftFormController };

export function CraftGeneralSection({ controller }: SectionProps) {
    const { t } = useTranslations();
    const { form, fieldError, touch, setField } = controller;
    const { data } = form;

    return (
        <section className="space-y-3">
            <SectionTitle>{t('crafts.section_general')}</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    label={t('crafts.field_nombre')}
                    required
                    error={fieldError('nombre')}
                >
                    <Input
                        value={data.nombre}
                        onChange={(e) => setField('nombre', e.target.value)}
                        onBlur={touch('nombre')}
                        placeholder={t('crafts.field_nombre_ph')}
                        className="bg-card"
                        maxLength={150}
                    />
                </FormField>
                <FormField
                    label={t('crafts.field_telefono')}
                    hint={t('crafts.phone_hint')}
                    error={fieldError('telefono_contacto')}
                >
                    <div className="flex">
                        <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                            +51
                        </span>
                        <Input
                            value={data.telefono_contacto}
                            onChange={(e) =>
                                setField(
                                    'telefono_contacto',
                                    onlyDigits(e.target.value, 9),
                                )
                            }
                            onBlur={touch('telefono_contacto')}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="tel-national"
                            placeholder="987654321"
                            className="rounded-l-none bg-card font-mono"
                        />
                    </div>
                </FormField>
                <FormField
                    label={t('crafts.field_descripcion')}
                    required={controller.requiresFullProfile}
                    className="sm:col-span-2"
                    error={fieldError('descripcion')}
                >
                    <div onBlur={touch('descripcion')}>
                        <Textarea
                            value={data.descripcion}
                            onChange={(v) => setField('descripcion', v)}
                            rows={4}
                            maxLength={5000}
                        />
                    </div>
                </FormField>
            </div>
        </section>
    );
}

export function CraftPhotosSection({
    controller,
    limits,
}: SectionProps & { limits: CraftLimits }) {
    const { t } = useTranslations();
    const { form, fieldError, photos, photoInputRef } = controller;
    const { data } = form;

    return (
        <section className="space-y-3">
            <SectionTitle>{t('crafts.section_photos')}</SectionTitle>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] text-muted-foreground">
                    {t('crafts.section_photos_hint')}
                </p>
                <span
                    className={cn(
                        'text-[12px] font-medium',
                        data.photos.length >= limits.min_photos_to_publish
                            ? 'text-muted-foreground'
                            : 'text-brand-orange',
                    )}
                >
                    {t('crafts.photos_count', {
                        count: data.photos.length,
                        max: limits.max_photos,
                    })}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {data.photos.map((photo, index) => {
                    const fileError =
                        fieldError(`photos.${index}.file`) ?? fieldError(`photos.${index}.id`);
                    const priceError = fieldError(`photos.${index}.precio`);

                    return (
                        <div
                            key={photo.key}
                            className={cn(
                                'overflow-hidden rounded-lg border bg-card',
                                photo.file ? 'border-brand-blue/30' : 'border-border',
                                (fileError || priceError) && 'border-destructive/60',
                            )}
                        >
                            <div className="group relative">
                                <img
                                    src={photo.url}
                                    alt=""
                                    className="aspect-square w-full object-cover"
                                />
                                {index === 0 && (
                                    <span className="absolute top-1 left-1 rounded-full bg-brand-orange px-2 py-0.5 text-[10px] font-semibold text-white">
                                        {t('crafts.photo_cover')}
                                    </span>
                                )}
                                <div className="absolute top-1 right-1 flex gap-1">
                                    <button
                                        type="button"
                                        title={t('crafts.photo_move_left')}
                                        aria-label={t('crafts.photo_move_left')}
                                        disabled={index === 0}
                                        onClick={() => photos.move(index, -1)}
                                        className="rounded-full bg-black/60 p-1 text-white disabled:opacity-30"
                                    >
                                        <ChevronLeft className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        title={t('crafts.photo_move_right')}
                                        aria-label={t('crafts.photo_move_right')}
                                        disabled={index === data.photos.length - 1}
                                        onClick={() => photos.move(index, 1)}
                                        className="rounded-full bg-black/60 p-1 text-white disabled:opacity-30"
                                    >
                                        <ChevronRight className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        title={t('crafts.photo_remove')}
                                        aria-label={t('crafts.photo_remove')}
                                        onClick={() => photos.remove(index)}
                                        className="rounded-full bg-black/60 p-1 text-white"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5 p-2">
                                <Input
                                    value={photo.titulo}
                                    onChange={(e) =>
                                        photos.update(index, { titulo: e.target.value })
                                    }
                                    placeholder={t('crafts.photo_titulo_ph')}
                                    maxLength={150}
                                    className="h-8 bg-card text-[13px]"
                                />
                                <div className="flex">
                                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted/40 px-2 text-[12px] text-muted-foreground">
                                        S/
                                    </span>
                                    <Input
                                        value={photo.precio}
                                        onChange={(e) =>
                                            photos.update(index, {
                                                precio: sanitizePrice(e.target.value),
                                            })
                                        }
                                        inputMode="decimal"
                                        placeholder={t('crafts.no_price')}
                                        aria-label={t('crafts.photo_precio_ph')}
                                        className="h-8 rounded-l-none bg-card font-mono text-[13px]"
                                    />
                                </div>
                                {(fileError || priceError) && (
                                    <p className="text-[11px] text-destructive">
                                        {fileError ?? priceError}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}

                {photos.remainingSlots > 0 && (
                    <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#d0dbef] bg-muted/20 text-muted-foreground transition-colors hover:bg-white/60"
                    >
                        <ImagePlus className="size-5 text-brand-orange" />
                        <span className="text-[11px]">{t('crafts.add_photo')}</span>
                    </button>
                )}
            </div>

            <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.target.value = '';

                    if (files.length > 0) {
                        photos.add(files);
                    }
                }}
            />
            {(photos.error ?? fieldError('photos')) && (
                <p className="text-[12px] text-destructive">
                    {photos.error ?? fieldError('photos')}
                </p>
            )}
        </section>
    );
}

export function CraftSocialSection({
    controller,
    options,
}: SectionProps & { options: CraftOptions }) {
    const { t } = useTranslations();
    const { form, fieldError, redes } = controller;
    const { data } = form;

    return (
        <section className="space-y-3">
            <SectionTitle>{t('crafts.section_social')}</SectionTitle>
            <p className="text-[12px] text-muted-foreground">
                {t('crafts.section_social_hint')}
            </p>
            <div className="space-y-2">
                {data.redes_sociales.map((row, index) => {
                    const isDefault = options.redes_default.includes(row.red);
                    const choices = [row.red, ...redes.available];

                    return (
                        <div key={`${row.red}-${index}`} className="space-y-1">
                            <div className="flex items-center gap-2">
                                {isDefault ? (
                                    <span className="inline-flex h-9 w-32 shrink-0 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium">
                                        {t(`crafts.red_${row.red}`)}
                                    </span>
                                ) : (
                                    <Select
                                        value={row.red}
                                        onValueChange={(v) => redes.setType(index, v)}
                                    >
                                        <SelectTrigger className="w-32 shrink-0 bg-card">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {choices.map((red) => (
                                                <SelectItem key={red} value={red}>
                                                    {t(`crafts.red_${red}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <Input
                                    value={row.url}
                                    onChange={(e) => redes.setUrl(index, e.target.value)}
                                    onBlur={controller.touch(`redes_sociales.${index}.url`)}
                                    placeholder={t(`crafts.red_ph_${row.red}`)}
                                    maxLength={300}
                                    className="bg-card"
                                />
                                {!isDefault && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        title={t('crafts.remove_red')}
                                        aria-label={t('crafts.remove_red')}
                                        onClick={() => redes.remove(index)}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                )}
                            </div>
                            {fieldError(`redes_sociales.${index}.url`) && (
                                <p className="pl-34 text-[12px] text-destructive">
                                    {fieldError(`redes_sociales.${index}.url`)}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
            {redes.available.length > 0 && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={redes.add}
                >
                    <Plus className="size-4" />
                    {t('crafts.add_red')}
                </Button>
            )}
        </section>
    );
}

export function CraftLocationSection({
    controller,
    mapboxToken,
}: SectionProps & { mapboxToken: string | null }) {
    const { t } = useTranslations();
    const { form, fieldError } = controller;
    const { data, setData, errors } = form;

    return (
        <section className="space-y-3">
            <SectionTitle>{t('crafts.section_location')}</SectionTitle>
            <FormField
                label={t('crafts.field_map')}
                error={errors.latitud ?? errors.longitud ?? fieldError('latitud')}
            >
                <LocationMapPicker
                    token={mapboxToken}
                    value={{
                        latitud: data.latitud !== '' ? Number(data.latitud) : null,
                        longitud: data.longitud !== '' ? Number(data.longitud) : null,
                    }}
                    onChange={(next) => {
                        setData((current) => ({
                            ...current,
                            latitud: next.latitud != null ? String(next.latitud) : '',
                            longitud: next.longitud != null ? String(next.longitud) : '',
                        }));
                    }}
                    searchPlaceholder={t('crafts.map_search_placeholder')}
                    hint={t('crafts.map_hint')}
                />
            </FormField>
        </section>
    );
}

export function CraftPublishSection({
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
            <SectionTitle>{t('crafts.section_publish')}</SectionTitle>
            {hint && <p className="text-[12px] text-muted-foreground">{hint}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    label={t('crafts.field_estado')}
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
                                    {t(`crafts.estado_${row}`)}
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
                                {t('crafts.field_destacado')}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                {t('crafts.field_destacado_hint')}
                            </span>
                        </span>
                    </label>
                )}
            </div>
        </section>
    );
}
