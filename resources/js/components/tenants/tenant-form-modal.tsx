import { useForm } from '@inertiajs/react';
import { Store, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { ImageUploadField } from '@/components/common/image-upload-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { TenantRow } from '@/components/tenants/types';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

const MAX_GALLERY = 8;

type TenantFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenant: TenantRow | null;
    statuses: string[];
};

export function TenantFormModal({
    open,
    onOpenChange,
    tenant,
    statuses,
}: TenantFormModalProps) {
    const { t } = useTranslations();
    const isEditing = tenant !== null;
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    const { data, setData, post, processing, errors, reset, clearErrors, transform } =
        useForm<{
            nombre_comercial: string;
            razon_social: string;
            slug: string;
            ruc: string;
            email_admin: string;
            telefono: string;
            canal_adquisicion: string;
            owner_name: string;
            owner_password: string;
            owner_password_confirmation: string;
            direccion: string;
            latitud: string;
            longitud: string;
            descripcion: string;
            portada: File | null;
            photos: File[];
            estado: string;
            suspension_reason: string;
            publicado: boolean;
            onboarding_completado: boolean;
            onboarding_paso: number;
        }>({
            nombre_comercial: '',
            razon_social: '',
            slug: '',
            ruc: '',
            email_admin: '',
            telefono: '',
            canal_adquisicion: '',
            owner_name: '',
            owner_password: '',
            owner_password_confirmation: '',
            direccion: '',
            latitud: '',
            longitud: '',
            descripcion: '',
            portada: null,
            photos: [],
            estado: 'trial',
            suspension_reason: '',
            publicado: false,
            onboarding_completado: false,
            onboarding_paso: 0,
        });

    useEffect(() => {
        if (open && tenant) {
            setData({
                nombre_comercial: tenant.nombre_comercial,
                razon_social: tenant.razon_social,
                slug: tenant.slug,
                ruc: tenant.ruc ?? '',
                email_admin: tenant.email_admin,
                telefono: tenant.telefono ?? '',
                canal_adquisicion: tenant.canal_adquisicion ?? '',
                owner_name: '',
                owner_password: '',
                owner_password_confirmation: '',
                direccion: tenant.direccion ?? '',
                latitud:
                    tenant.latitud !== null && tenant.latitud !== undefined
                        ? String(tenant.latitud)
                        : '',
                longitud:
                    tenant.longitud !== null && tenant.longitud !== undefined
                        ? String(tenant.longitud)
                        : '',
                descripcion: tenant.descripcion ?? '',
                portada: null,
                photos: [],
                estado: tenant.estado,
                suspension_reason: tenant.suspension_reason ?? '',
                publicado: tenant.publicado,
                onboarding_completado: tenant.onboarding_completado,
                onboarding_paso: tenant.onboarding_paso,
            });
            setGalleryPreviews([]);
        }
        if (open && !tenant) {
            reset();
            setGalleryPreviews([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, tenant]);

    useEffect(() => {
        const urls = data.photos.map((file) => URL.createObjectURL(file));
        setGalleryPreviews(urls);
        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [data.photos]);

    const statusLabel = (status: string) =>
        t(`tenants.status_${status}` as 'tenants.status_trial');

    const canSubmit = useMemo(() => {
        if (!data.nombre_comercial.trim() || !data.email_admin.trim()) {
            return false;
        }

        if (isEditing) {
            if (!data.razon_social.trim()) return false;
            if (data.estado === 'suspended' && !data.suspension_reason.trim()) {
                return false;
            }
            return true;
        }

        if (!data.owner_name.trim()) return false;
        if (!data.owner_password || data.owner_password.length < 8) return false;
        if (data.owner_password !== data.owner_password_confirmation) {
            return false;
        }

        return true;
    }, [data, isEditing]);

    const addGalleryFiles = (files: FileList | null) => {
        if (!files?.length) return;
        const incoming = Array.from(files);
        const next = [...data.photos, ...incoming].slice(0, MAX_GALLERY);
        setData('photos', next);
        if (galleryInputRef.current) galleryInputRef.current.value = '';
    };

    const removeGalleryFile = (index: number) => {
        setData(
            'photos',
            data.photos.filter((_, i) => i !== index),
        );
    };

    const submit = () => {
        const parseCoord = (raw: string): number | null => {
            const trimmed = raw.trim().replace(',', '.');
            if (trimmed === '') return null;
            const n = Number(trimmed);
            return Number.isFinite(n) ? Number(n.toFixed(6)) : null;
        };

        const options = {
            preserveScroll: true,
            forceFormData: true as const,
            onSuccess: () => onOpenChange(false),
        };

        // PUT multipart no se parsea en PHP: en edición se envía POST + _method=put
        // (mismo patrón que carta / centros turísticos).
        if (isEditing) {
            transform((payload) => ({
                nombre_comercial: payload.nombre_comercial,
                razon_social: payload.razon_social,
                ruc: payload.ruc || null,
                email_admin: payload.email_admin,
                telefono: payload.telefono || null,
                canal_adquisicion: payload.canal_adquisicion || null,
                direccion: payload.direccion || null,
                descripcion: payload.descripcion || null,
                latitud: parseCoord(String(payload.latitud ?? '')),
                longitud: parseCoord(String(payload.longitud ?? '')),
                estado: payload.estado,
                suspension_reason: payload.suspension_reason || null,
                publicado: Boolean(payload.publicado),
                onboarding_completado: Boolean(payload.onboarding_completado),
                onboarding_paso: Number(payload.onboarding_paso) || 0,
                _method: 'put',
            }));
            post(`/restaurantes/${tenant.id}`, options);
            return;
        }

        transform((payload) => ({
            ...payload,
            latitud: parseCoord(String(payload.latitud ?? '')),
            longitud: parseCoord(String(payload.longitud ?? '')),
            direccion: payload.direccion || null,
            descripcion: payload.descripcion || null,
            ruc: payload.ruc || null,
            telefono: payload.telefono || null,
            canal_adquisicion: payload.canal_adquisicion || null,
            slug: payload.slug || null,
        }));
        post('/restaurantes', options);
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                isEditing
                    ? t('tenants.edit_title')
                    : t('tenants.create_title')
            }
            description={
                isEditing
                    ? t('tenants.edit_hint')
                    : t('tenants.create_hint')
            }
            icon={Store}
            submitLabel={
                isEditing
                    ? t('table.save_changes')
                    : t('tenants.create_submit')
            }
            onSubmit={submit}
            canSubmit={canSubmit}
            submitting={processing}
            size="xl"
            onAfterClose={() => {
                reset();
                clearErrors();
                setGalleryPreviews([]);
            }}
        >
            <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                    label={t('tenants.field_nombre_comercial')}
                    required
                    error={errors.nombre_comercial}
                    className="sm:col-span-2"
                >
                    <Input
                        value={data.nombre_comercial}
                        onChange={(e) =>
                            setData('nombre_comercial', e.target.value)
                        }
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('tenants.field_razon_social')}
                    required={isEditing}
                    error={errors.razon_social}
                    className="sm:col-span-2"
                >
                    <Input
                        value={data.razon_social}
                        onChange={(e) => setData('razon_social', e.target.value)}
                        placeholder={
                            isEditing
                                ? undefined
                                : data.nombre_comercial || undefined
                        }
                        className="bg-card"
                    />
                </FormField>

                {!isEditing && (
                    <FormField
                        label={t('tenants.field_slug')}
                        error={errors.slug}
                        className="sm:col-span-2"
                    >
                        <Input
                            value={data.slug}
                            onChange={(e) =>
                                setData(
                                    'slug',
                                    e.target.value
                                        .toLowerCase()
                                        .replace(/[^a-z0-9-]/g, ''),
                                )
                            }
                            placeholder={t('tenants.slug_placeholder')}
                            className="bg-card font-mono"
                        />
                    </FormField>
                )}

                {isEditing && (
                    <FormField
                        label={t('tenants.field_slug')}
                        className="sm:col-span-2"
                    >
                        <Input
                            value={`${tenant.slug} · ${tenant.subdomain_host}`}
                            disabled
                            className="bg-muted/40 font-mono text-[13px]"
                        />
                    </FormField>
                )}

                <FormField label={t('tenants.field_ruc')} error={errors.ruc}>
                    <Input
                        value={data.ruc}
                        onChange={(e) =>
                            setData('ruc', e.target.value.replace(/\D/g, ''))
                        }
                        maxLength={11}
                        className="bg-card font-mono"
                    />
                </FormField>

                <FormField
                    label={t('tenants.field_telefono')}
                    error={errors.telefono}
                >
                    <Input
                        value={data.telefono}
                        onChange={(e) => setData('telefono', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('tenants.field_email_admin')}
                    required
                    error={errors.email_admin}
                    className="sm:col-span-2"
                >
                    <Input
                        type="email"
                        value={data.email_admin}
                        onChange={(e) => setData('email_admin', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                {!isEditing && (
                    <>
                        <FormField
                            label={t('tenants.field_owner_name')}
                            required
                            error={errors.owner_name}
                            className="sm:col-span-2"
                        >
                            <Input
                                value={data.owner_name}
                                onChange={(e) =>
                                    setData('owner_name', e.target.value)
                                }
                                className="bg-card"
                            />
                        </FormField>

                        <FormField
                            label={t('tenants.field_owner_password')}
                            required
                            error={errors.owner_password}
                        >
                            <Input
                                type="password"
                                value={data.owner_password}
                                onChange={(e) =>
                                    setData('owner_password', e.target.value)
                                }
                                className="bg-card"
                            />
                        </FormField>

                        <FormField
                            label={t('tenants.field_owner_password_confirm')}
                            required
                            error={errors.owner_password_confirmation}
                        >
                            <Input
                                type="password"
                                value={data.owner_password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        'owner_password_confirmation',
                                        e.target.value,
                                    )
                                }
                                className="bg-card"
                            />
                        </FormField>
                    </>
                )}

                <FormField
                    label={t('tenants.field_direccion')}
                    error={errors.direccion}
                    className="sm:col-span-2"
                >
                    <Input
                        value={data.direccion}
                        onChange={(e) => setData('direccion', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField label={t('tenants.field_latitud')} error={errors.latitud}>
                    <Input
                        type="text"
                        inputMode="decimal"
                        value={data.latitud}
                        onChange={(e) => setData('latitud', e.target.value)}
                        placeholder="-6.771370"
                        className="bg-card font-mono text-sm"
                    />
                </FormField>

                <FormField
                    label={t('tenants.field_longitud')}
                    error={errors.longitud}
                >
                    <Input
                        type="text"
                        inputMode="decimal"
                        value={data.longitud}
                        onChange={(e) => setData('longitud', e.target.value)}
                        placeholder="-79.840880"
                        className="bg-card font-mono text-sm"
                    />
                </FormField>

                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 sm:col-span-2">
                    <p className="text-sm font-semibold text-foreground">
                        {t('tenants.section_content')}
                    </p>

                    <FormField
                        label={t('tenants.field_descripcion')}
                        error={errors.descripcion}
                    >
                        <textarea
                            value={data.descripcion}
                            onChange={(e) => setData('descripcion', e.target.value)}
                            rows={4}
                            maxLength={4000}
                            placeholder={t('tenants.field_descripcion_placeholder')}
                            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                        />
                    </FormField>

                    {!isEditing && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                label={t('tenants.field_portada')}
                                error={errors.portada}
                            >
                                <p className="mb-2 text-[12px] text-muted-foreground">
                                    {t('tenants.field_portada_hint')}
                                </p>
                                <ImageUploadField
                                    value={data.portada}
                                    existingUrl={null}
                                    removed={false}
                                    onFileChange={(file) => setData('portada', file)}
                                    onRemove={() => setData('portada', null)}
                                    layout="compact"
                                    previewAspect="video"
                                />
                            </FormField>

                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    {t('tenants.field_gallery')}
                                </p>
                                <p className="text-[12px] text-muted-foreground">
                                    {t('tenants.field_gallery_hint', {
                                        max: MAX_GALLERY,
                                    })}
                                </p>

                                <div className="grid grid-cols-3 gap-2">
                                    {galleryPreviews.map((url, index) => (
                                        <div
                                            key={`${url}-${index}`}
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
                                                onClick={() => removeGalleryFile(index)}
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    ))}

                                    {data.photos.length < MAX_GALLERY ? (
                                        <button
                                            type="button"
                                            onClick={() => galleryInputRef.current?.click()}
                                            className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-card text-xs font-medium text-muted-foreground hover:border-brand-blue/40 hover:text-brand-blue"
                                        >
                                            + Foto
                                        </button>
                                    ) : null}
                                </div>

                                <input
                                    ref={galleryInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => addGalleryFiles(e.target.files)}
                                />
                                {errors.photos ? (
                                    <p className="text-xs text-destructive">{errors.photos}</p>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>

                {isEditing && (
                    <>
                        <FormField label={t('tenants.field_estado')} required>
                            <Select
                                value={data.estado}
                                onValueChange={(v) => setData('estado', v)}
                            >
                                <SelectTrigger className="w-full bg-card">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {statusLabel(status)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField
                            label={t('tenants.field_onboarding_paso')}
                            error={errors.onboarding_paso}
                        >
                            <Input
                                type="number"
                                min={0}
                                max={5}
                                value={data.onboarding_paso}
                                onChange={(e) =>
                                    setData(
                                        'onboarding_paso',
                                        Number(e.target.value),
                                    )
                                }
                                className="bg-card"
                            />
                        </FormField>

                        {data.estado === 'suspended' && (
                            <FormField
                                label={t('tenants.field_suspension_reason')}
                                required
                                error={errors.suspension_reason}
                                className="sm:col-span-2"
                            >
                                <Input
                                    value={data.suspension_reason}
                                    onChange={(e) =>
                                        setData(
                                            'suspension_reason',
                                            e.target.value,
                                        )
                                    }
                                    className="bg-card"
                                />
                            </FormField>
                        )}

                        <label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                                data.publicado
                                    ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                                    : 'border-border bg-card',
                            )}
                        >
                            <Checkbox
                                checked={data.publicado}
                                onCheckedChange={(v) =>
                                    setData('publicado', v === true)
                                }
                                className="mt-0.5"
                            />
                            <span className="space-y-0.5">
                                <span className="block text-sm font-medium">
                                    {t('tenants.field_publicado')}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    {t('tenants.field_publicado_hint')}
                                </span>
                            </span>
                        </label>

                        <label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                                data.onboarding_completado
                                    ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                                    : 'border-border bg-card',
                            )}
                        >
                            <Checkbox
                                checked={data.onboarding_completado}
                                onCheckedChange={(v) =>
                                    setData('onboarding_completado', v === true)
                                }
                                className="mt-0.5"
                            />
                            <span className="block text-sm font-medium">
                                {t('tenants.field_onboarding_completado')}
                            </span>
                        </label>
                    </>
                )}

                <FormField
                    label={t('tenants.field_canal')}
                    error={errors.canal_adquisicion}
                    className="sm:col-span-2"
                >
                    <Input
                        value={data.canal_adquisicion}
                        onChange={(e) =>
                            setData('canal_adquisicion', e.target.value)
                        }
                        className="bg-card"
                    />
                </FormField>
            </div>
        </BaseModal>
    );
}
