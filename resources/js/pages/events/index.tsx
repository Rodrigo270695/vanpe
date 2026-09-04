import { Head, router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    ImagePlus,
    PartyPopper,
    Plus,
    Sparkles,
    Star,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CatalogItemActions } from '@/components/catalog/catalog-item-actions';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { ImageUploadField } from '@/components/common/image-upload-field';
import { PageHeader } from '@/components/common/page-header';
import { StatusPill } from '@/components/common/status-pill';
import { LocationMapPicker } from '@/components/configuracion/location-map-picker';
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
import { translate, type TranslationTree } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const MAX_GALLERY = 8;

type SponsorDraft = {
    nombre: string;
    tipo: string;
    website: string;
    logo: File | null;
    logo_url: string | null;
    remove_logo: boolean;
};

type EventMedia = {
    id: string;
    url: string;
    caption: string | null;
};

type EventRow = {
    id: string;
    titulo: string;
    slug: string;
    resumen: string | null;
    descripcion: string | null;
    portada_url: string | null;
    lugar: string | null;
    departamento_id: number | null;
    latitud: number | null;
    longitud: number | null;
    starts_at: string | null;
    ends_at: string | null;
    estado: string;
    destacado: boolean;
    sort_order: number;
    departamento?: string | null;
    sponsors: Array<{
        nombre: string;
        tipo: string;
        logo_url: string | null;
        website: string | null;
    }>;
    media?: EventMedia[];
};

type Props = {
    events: EventRow[];
    departamentos: { id: number; name: string }[];
    can: { create: boolean; update: boolean; delete: boolean };
    mapbox_token?: string | null;
    basePath?: string;
    pageTitle?: string;
    pageDescription?: string;
    defaultDestacado?: boolean;
    breadcrumbMode?: 'platform' | 'tenant';
};

const emptySponsor = (): SponsorDraft => ({
    nombre: '',
    tipo: 'auspiciador',
    website: '',
    logo: null,
    logo_url: null,
    remove_logo: false,
});

const makeEmptyForm = (destacado = true) => ({
    titulo: '',
    slug: '',
    resumen: '',
    descripcion: '',
    lugar: '',
    departamento_id: '' as string | number,
    latitud: null as number | null,
    longitud: null as number | null,
    starts_at: '',
    ends_at: '',
    estado: 'publicado',
    destacado,
    sort_order: 0,
    cover: null as File | null,
    remove_cover: false,
    gallery: [] as File[],
    remove_media_ids: [] as string[],
    sponsors: [] as SponsorDraft[],
});

export default function EventsIndex({
    events,
    departamentos,
    can,
    mapbox_token = null,
    basePath = '/festividades',
    pageTitle = 'Ferias y festividades',
    pageDescription = 'Eventos de plataforma visibles en la app (ferias, fiestas, celebraciones).',
    defaultDestacado = true,
    breadcrumbMode = 'platform',
}: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<EventRow | null>(null);
    const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
    const [existingMedia, setExistingMedia] = useState<EventMedia[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<EventRow | null>(null);
    const [deleting, setDeleting] = useState(false);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    const form = useForm(makeEmptyForm(defaultDestacado));

    useEffect(() => {
        const urls = form.data.gallery.map((file) => URL.createObjectURL(file));
        setGalleryPreviews(urls);
        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [form.data.gallery]);

    const visibleMedia = existingMedia.filter(
        (m) => !form.data.remove_media_ids.includes(m.id),
    );
    const remainingGallerySlots =
        MAX_GALLERY - visibleMedia.length - form.data.gallery.length;

    const publishedCount = useMemo(
        () => events.filter((e) => e.estado === 'publicado').length,
        [events],
    );
    const featuredCount = useMemo(
        () => events.filter((e) => e.destacado).length,
        [events],
    );

    const canSubmit = form.data.titulo.trim().length > 0 && form.data.estado !== '';

    const openCreate = () => {
        setEditing(null);
        setExistingCoverUrl(null);
        setExistingMedia([]);
        form.clearErrors();
        form.setData(makeEmptyForm(defaultDestacado));
        setFormOpen(true);
    };

    const openEdit = (row: EventRow) => {
        setEditing(row);
        setExistingCoverUrl(row.portada_url);
        setExistingMedia(row.media ?? []);
        form.clearErrors();
        form.setData({
            titulo: row.titulo,
            slug: row.slug,
            resumen: row.resumen ?? '',
            descripcion: row.descripcion ?? '',
            lugar: row.lugar ?? '',
            departamento_id: row.departamento_id ?? '',
            latitud: row.latitud,
            longitud: row.longitud,
            starts_at: row.starts_at ?? '',
            ends_at: row.ends_at ?? '',
            estado: row.estado,
            destacado: row.destacado,
            sort_order: row.sort_order,
            cover: null,
            remove_cover: false,
            gallery: [],
            remove_media_ids: [],
            sponsors: (row.sponsors ?? []).map((s) => ({
                nombre: s.nombre,
                tipo: s.tipo || 'auspiciador',
                website: s.website ?? '',
                logo: null,
                logo_url: s.logo_url,
                remove_logo: false,
            })),
        });
        setFormOpen(true);
    };

    const submit = () => {
        if (!canSubmit) return;

        const options = {
            preserveScroll: true,
            forceFormData: true as const,
            onSuccess: () => setFormOpen(false),
        };

        form.transform((payload) => ({
            ...payload,
            departamento_id: payload.departamento_id
                ? Number(payload.departamento_id)
                : null,
            ...(editing ? { _method: 'put' } : {}),
        }));

        if (editing) {
            form.post(`${basePath}/${editing.id}`, options);
            return;
        }

        form.post(basePath, options);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`${basePath}/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    const updateSponsor = (index: number, patch: Partial<SponsorDraft>) => {
        const next = [...form.data.sponsors];
        next[index] = { ...next[index], ...patch };
        form.setData('sponsors', next);
    };

    return (
        <>
            <Head title={pageTitle} />
            <div className="flex flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title={pageTitle}
                    description={pageDescription}
                    badges={[
                        {
                            label: 'Eventos',
                            value: events.length,
                            color: 'blue',
                            icon: PartyPopper,
                        },
                        {
                            label: 'Publicados',
                            value: publishedCount,
                            color: 'green',
                            icon: CalendarDays,
                        },
                        {
                            label: 'Destacados',
                            value: featuredCount,
                            color: featuredCount > 0 ? 'orange' : 'gray',
                            icon: Star,
                        },
                    ]}
                    action={
                        can.create
                            ? {
                                  label: 'Nuevo evento',
                                  onClick: openCreate,
                                  icon: Plus,
                              }
                            : undefined
                    }
                />

                <div className="grid gap-3">
                    {events.length === 0 ? (
                        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                            Aún no hay eventos. Crea el primero.
                        </p>
                    ) : (
                        events.map((row) => (
                            <div
                                key={row.id}
                                className="group flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3"
                            >
                                {row.portada_url ? (
                                    <img
                                        src={row.portada_url}
                                        alt=""
                                        className="size-16 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="flex size-16 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-700">
                                        <PartyPopper className="size-6" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate font-semibold">{row.titulo}</p>
                                        <StatusPill
                                            variant={
                                                row.estado === 'publicado' ? 'green' : 'muted'
                                            }
                                        >
                                            {row.estado}
                                        </StatusPill>
                                        {row.destacado ? (
                                            <StatusPill variant="amber">Destacado</StatusPill>
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {row.lugar ?? '—'}
                                        {row.departamento ? ` · ${row.departamento}` : ''}
                                        {row.starts_at
                                            ? ` · ${row.starts_at.replace('T', ' ')}`
                                            : ''}
                                    </p>
                                </div>
                                <CatalogItemActions
                                    canUpdate={can.update}
                                    canDelete={can.delete}
                                    onEdit={() => openEdit(row)}
                                    onDelete={() => setDeleteTarget(row)}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>

            <BaseModal
                open={formOpen}
                onOpenChange={setFormOpen}
                title={editing ? 'Editar evento' : 'Nuevo evento'}
                description="Completa los datos. La portada y logos se suben como archivo."
                icon={Sparkles}
                size="xl"
                submitLabel="Guardar"
                canSubmit={canSubmit}
                submitting={form.processing}
                onSubmit={submit}
                onAfterClose={() => {
                    setEditing(null);
                    setExistingCoverUrl(null);
                    form.setData(makeEmptyForm());
                    form.clearErrors();
                }}
            >
                <div className="grid gap-4">
                    <FormField
                        label="Título"
                        required
                        error={form.errors.titulo}
                    >
                        <Input
                            value={form.data.titulo}
                            onChange={(e) => form.setData('titulo', e.target.value)}
                            className="bg-card"
                        />
                    </FormField>

                    <FormField label="Resumen" error={form.errors.resumen}>
                        <Input
                            value={form.data.resumen}
                            onChange={(e) => form.setData('resumen', e.target.value)}
                            className="bg-card"
                        />
                    </FormField>

                    <FormField label="Descripción" error={form.errors.descripcion}>
                        <textarea
                            value={form.data.descripcion}
                            onChange={(e) => form.setData('descripcion', e.target.value)}
                            rows={4}
                            className={cn(
                                'border-input placeholder:text-muted-foreground flex w-full rounded-md border bg-card px-3 py-2 text-sm shadow-xs outline-none',
                            )}
                        />
                    </FormField>

                    <FormField label="Portada" error={form.errors.cover}>
                        <ImageUploadField
                            value={form.data.cover}
                            existingUrl={existingCoverUrl}
                            removed={form.data.remove_cover}
                            onFileChange={(file) => {
                                form.setData('cover', file);
                                form.setData('remove_cover', false);
                            }}
                            onRemove={() => {
                                form.setData('cover', null);
                                form.setData('remove_cover', true);
                            }}
                            layout="compact"
                            previewAspect="video"
                        />
                    </FormField>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">Galería de fotos</p>
                        <p className="text-[12px] text-muted-foreground">
                            Hasta {MAX_GALLERY} fotos adicionales (JPG, PNG o WebP). Se
                            muestran en la app del turista como en restaurantes y
                            centros.
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
                                            form.setData('remove_media_ids', [
                                                ...form.data.remove_media_ids,
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
                                            form.setData(
                                                'gallery',
                                                form.data.gallery.filter(
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
                                    <span className="text-[11px]">Añadir</span>
                                </button>
                            )}
                        </div>

                        <input
                            ref={galleryInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                const files = Array.from(e.target.files ?? []);
                                if (files.length === 0) return;
                                const next = [
                                    ...form.data.gallery,
                                    ...files,
                                ].slice(0, MAX_GALLERY - visibleMedia.length);
                                form.setData('gallery', next);
                                e.target.value = '';
                            }}
                        />
                        {form.errors.gallery && (
                            <p className="text-xs text-destructive">{form.errors.gallery}</p>
                        )}
                    </div>

                    <FormField label="Lugar" error={form.errors.lugar}>
                        <Input
                            value={form.data.lugar}
                            onChange={(e) => form.setData('lugar', e.target.value)}
                            className="bg-card"
                        />
                    </FormField>

                    <FormField
                        label="Ubicación en el mapa"
                        hint="El turista podrá ir al lugar o añadirlo a su ruta."
                        error={form.errors.latitud ?? form.errors.longitud}
                    >
                        <LocationMapPicker
                            token={mapbox_token}
                            value={{
                                latitud: form.data.latitud,
                                longitud: form.data.longitud,
                                direccion: form.data.lugar || null,
                            }}
                            onChange={(next) => {
                                form.setData({
                                    ...form.data,
                                    latitud: next.latitud,
                                    longitud: next.longitud,
                                    lugar:
                                        next.direccion && !form.data.lugar
                                            ? String(next.direccion)
                                            : form.data.lugar,
                                });
                            }}
                        />
                    </FormField>

                    <FormField label="Departamento" error={form.errors.departamento_id}>
                        <Select
                            value={
                                form.data.departamento_id
                                    ? String(form.data.departamento_id)
                                    : undefined
                            }
                            onValueChange={(v) =>
                                form.setData('departamento_id', Number(v))
                            }
                        >
                            <SelectTrigger className="bg-card">
                                <SelectValue placeholder="Seleccionar…" />
                            </SelectTrigger>
                            <SelectContent>
                                {departamentos.map((d) => (
                                    <SelectItem key={d.id} value={String(d.id)}>
                                        {d.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormField label="Inicio" error={form.errors.starts_at}>
                            <Input
                                type="datetime-local"
                                value={form.data.starts_at}
                                onChange={(e) => form.setData('starts_at', e.target.value)}
                                className="bg-card"
                            />
                        </FormField>
                        <FormField label="Fin" error={form.errors.ends_at}>
                            <Input
                                type="datetime-local"
                                value={form.data.ends_at}
                                onChange={(e) => form.setData('ends_at', e.target.value)}
                                className="bg-card"
                            />
                        </FormField>
                    </div>

                    <FormField label="Estado" required error={form.errors.estado}>
                        <Select
                            value={form.data.estado}
                            onValueChange={(v) => form.setData('estado', v)}
                        >
                            <SelectTrigger className="bg-card">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="borrador">Borrador</SelectItem>
                                <SelectItem value="publicado">Publicado</SelectItem>
                                <SelectItem value="archivado">Archivado</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>

                    <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                            checked={form.data.destacado}
                            onCheckedChange={(v) =>
                                form.setData('destacado', v === true)
                            }
                        />
                        Destacado en la app
                    </label>

                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">Auspiciadores / orquestas</p>
                        <Button
                            type="button"
                            size="sm"
                            className="cursor-pointer gap-1 border-0 bg-brand-blue text-white shadow-sm shadow-blue-200/50 hover:bg-brand-blue/90"
                            onClick={() =>
                                form.setData('sponsors', [
                                    ...form.data.sponsors,
                                    emptySponsor(),
                                ])
                            }
                        >
                            <Plus className="size-3.5" />
                            Añadir
                        </Button>
                    </div>

                    {form.data.sponsors.length === 0 ? (
                        <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                            Sin auspiciadores. Pulsa «Añadir» para incorporar uno.
                        </p>
                    ) : null}

                    {form.data.sponsors.map((s, i) => (
                        <div
                            key={i}
                            className="grid gap-3 rounded-xl border bg-card p-3"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-muted-foreground">
                                    #{i + 1}
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => {
                                        form.setData(
                                            'sponsors',
                                            form.data.sponsors.filter((_, idx) => idx !== i),
                                        );
                                    }}
                                >
                                    Quitar
                                </Button>
                            </div>
                            <FormField
                                label="Nombre"
                                required
                                error={form.errors[`sponsors.${i}.nombre`]}
                            >
                                <Input
                                    value={s.nombre}
                                    onChange={(e) =>
                                        updateSponsor(i, { nombre: e.target.value })
                                    }
                                    className="bg-background"
                                />
                            </FormField>
                            <FormField label="Tipo">
                                <Select
                                    value={s.tipo}
                                    onValueChange={(v) => updateSponsor(i, { tipo: v })}
                                >
                                    <SelectTrigger className="bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="auspiciador">
                                            Auspiciador
                                        </SelectItem>
                                        <SelectItem value="orquesta">Orquesta</SelectItem>
                                        <SelectItem value="artista">Artista</SelectItem>
                                        <SelectItem value="otro">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <FormField label="Logo / foto">
                                <ImageUploadField
                                    value={s.logo}
                                    existingUrl={s.logo_url}
                                    removed={s.remove_logo}
                                    onFileChange={(file) =>
                                        updateSponsor(i, {
                                            logo: file,
                                            remove_logo: false,
                                        })
                                    }
                                    onRemove={() =>
                                        updateSponsor(i, {
                                            logo: null,
                                            remove_logo: true,
                                        })
                                    }
                                    layout="compact"
                                    previewAspect="square"
                                />
                            </FormField>
                            <FormField label="Sitio web">
                                <Input
                                    value={s.website}
                                    onChange={(e) =>
                                        updateSponsor(i, { website: e.target.value })
                                    }
                                    placeholder="https://…"
                                    className="bg-background"
                                />
                            </FormField>
                        </div>
                    ))}
                </div>
            </BaseModal>

            <BaseModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Eliminar evento"
                description={
                    deleteTarget
                        ? `¿Eliminar «${deleteTarget.titulo}»? Esta acción no se puede deshacer fácilmente.`
                        : undefined
                }
                submitLabel="Eliminar"
                submitVariant="destructive"
                onSubmit={confirmDelete}
                submitting={deleting}
            >
                <p className="text-sm text-muted-foreground">
                    El evento dejará de mostrarse en la app turista.
                </p>
            </BaseModal>
        </>
    );
}

EventsIndex.layout = (props: {
    translations?: TranslationTree;
    breadcrumbMode?: 'platform' | 'tenant';
    basePath?: string;
    pageTitle?: string;
}) => {
    const mode = props.breadcrumbMode ?? 'platform';
    const path = props.basePath ?? '/festividades';
    const title =
        props.pageTitle ??
        translate(props.translations as TranslationTree, 'nav.events');

    if (mode === 'tenant') {
        return {
            breadcrumbs: [
                {
                    title: translate(props.translations as TranslationTree, 'nav.dashboard'),
                    href: '/dashboard',
                },
                { title, href: path },
            ],
        };
    }

    return {
        breadcrumbs: [
            {
                title: translate(props.translations as TranslationTree, 'nav.saas'),
                href: '/planes',
            },
            { title, href: path },
        ],
    };
};
