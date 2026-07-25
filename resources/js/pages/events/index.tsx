import { Head, router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    PartyPopper,
    Plus,
    Sparkles,
    Star,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { CatalogItemActions } from '@/components/catalog/catalog-item-actions';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { ImageUploadField } from '@/components/common/image-upload-field';
import { PageHeader } from '@/components/common/page-header';
import { StatusPill } from '@/components/common/status-pill';
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

type SponsorDraft = {
    nombre: string;
    tipo: string;
    website: string;
    logo: File | null;
    logo_url: string | null;
    remove_logo: boolean;
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
};

type Props = {
    events: EventRow[];
    departamentos: { id: number; name: string }[];
    can: { create: boolean; update: boolean; delete: boolean };
};

const emptySponsor = (): SponsorDraft => ({
    nombre: '',
    tipo: 'auspiciador',
    website: '',
    logo: null,
    logo_url: null,
    remove_logo: false,
});

const emptyForm = {
    titulo: '',
    slug: '',
    resumen: '',
    descripcion: '',
    lugar: '',
    departamento_id: '' as string | number,
    starts_at: '',
    ends_at: '',
    estado: 'publicado',
    destacado: true,
    sort_order: 0,
    cover: null as File | null,
    remove_cover: false,
    sponsors: [] as SponsorDraft[],
};

export default function EventsIndex({ events, departamentos, can }: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<EventRow | null>(null);
    const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EventRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const form = useForm({ ...emptyForm });

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
        form.clearErrors();
        form.setData({ ...emptyForm });
        setFormOpen(true);
    };

    const openEdit = (row: EventRow) => {
        setEditing(row);
        setExistingCoverUrl(row.portada_url);
        form.clearErrors();
        form.setData({
            titulo: row.titulo,
            slug: row.slug,
            resumen: row.resumen ?? '',
            descripcion: row.descripcion ?? '',
            lugar: row.lugar ?? '',
            departamento_id: row.departamento_id ?? '',
            starts_at: row.starts_at ?? '',
            ends_at: row.ends_at ?? '',
            estado: row.estado,
            destacado: row.destacado,
            sort_order: row.sort_order,
            cover: null,
            remove_cover: false,
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
            form.post(`/festividades/${editing.id}`, options);
            return;
        }

        form.post('/festividades', options);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/festividades/${deleteTarget.id}`, {
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
            <Head title="Ferias y festividades" />
            <div className="flex flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Ferias y festividades"
                    description="Eventos de plataforma visibles en la app (ferias, fiestas, celebraciones)."
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
                    form.reset();
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

                    <FormField label="Lugar" error={form.errors.lugar}>
                        <Input
                            value={form.data.lugar}
                            onChange={(e) => form.setData('lugar', e.target.value)}
                            className="bg-card"
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
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                form.setData('sponsors', [
                                    ...form.data.sponsors,
                                    emptySponsor(),
                                ])
                            }
                        >
                            Añadir
                        </Button>
                    </div>

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

EventsIndex.layout = (props: { translations?: TranslationTree }) => ({
    breadcrumbs: [
        {
            title: translate(props.translations as TranslationTree, 'nav.saas'),
            href: '/planes',
        },
        {
            title: translate(props.translations as TranslationTree, 'nav.events'),
            href: '/festividades',
        },
    ],
});
