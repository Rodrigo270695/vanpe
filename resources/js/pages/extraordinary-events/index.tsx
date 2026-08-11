import { Head, router, useForm } from '@inertiajs/react';
import { MapPinned, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { cn } from '@/lib/utils';

type StopDraft = {
    nombre: string;
    slug: string;
    target_type: 'restaurant' | 'tour_spot' | 'custom';
    target_id: string;
    latitud: number | null;
    longitud: number | null;
    visita_at: string;
    sort_order: number;
};

type EventRow = {
    id: string;
    titulo: string;
    slug: string;
    cta_label: string;
    floating_text: string | null;
    descripcion: string | null;
    logo_url: string | null;
    year_effect: string | null;
    starts_at: string | null;
    ends_at: string | null;
    active: boolean;
    sort_order: number;
    stops: Array<{
        id: string;
        nombre: string;
        slug: string | null;
        target_type: string | null;
        target_id: string | null;
        latitud: number;
        longitud: number;
        visita_at: string | null;
        sort_order: number;
    }>;
};

type Props = {
    events: EventRow[];
    can: { create: boolean; update: boolean; delete: boolean };
    mapbox_token?: string | null;
};

const emptyStop = (order = 1): StopDraft => ({
    nombre: '',
    slug: '',
    target_type: 'custom',
    target_id: '',
    latitud: null,
    longitud: null,
    visita_at: '',
    sort_order: order,
});

const makeEmptyForm = () => ({
    titulo: '',
    cta_label: 'Ver la ruta del papa',
    floating_text: 'Ver la ruta del papa',
    descripcion: '',
    year_effect: '2026',
    starts_at: '',
    ends_at: '',
    active: true,
    sort_order: 0,
    logo: null as File | null,
    stops: [emptyStop(1)] as StopDraft[],
});

export default function ExtraordinaryEventsIndex({ events, can, mapbox_token }: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<EventRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EventRow | null>(null);
    const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
    const [stopMapIndex, setStopMapIndex] = useState(0);

    const form = useForm(makeEmptyForm());

    const activeCount = useMemo(() => events.filter((e) => e.active).length, [events]);

    const openCreate = () => {
        setEditing(null);
        setExistingLogoUrl(null);
        form.setData(makeEmptyForm());
        form.clearErrors();
        setStopMapIndex(0);
        setFormOpen(true);
    };

    const openEdit = (row: EventRow) => {
        setEditing(row);
        setExistingLogoUrl(row.logo_url);
        form.setData({
            titulo: row.titulo,
            cta_label: row.cta_label || 'Ver la ruta del papa',
            floating_text: row.floating_text || '',
            descripcion: row.descripcion || '',
            year_effect: row.year_effect || '2026',
            starts_at: row.starts_at || '',
            ends_at: row.ends_at || '',
            active: row.active,
            sort_order: row.sort_order,
            logo: null,
            stops:
                row.stops.length > 0
                    ? row.stops.map((s, i) => ({
                          nombre: s.nombre,
                          slug: s.slug || '',
                          target_type: (s.target_type as StopDraft['target_type']) || 'custom',
                          target_id: s.target_id || '',
                          latitud: s.latitud,
                          longitud: s.longitud,
                          visita_at: s.visita_at || '',
                          sort_order: s.sort_order ?? i + 1,
                      }))
                    : [emptyStop(1)],
        });
        form.clearErrors();
        setStopMapIndex(0);
        setFormOpen(true);
    };

    const canSubmit =
        form.data.titulo.trim().length > 0 &&
        form.data.stops.every(
            (s) =>
                s.nombre.trim().length > 0 &&
                s.latitud != null &&
                s.longitud != null &&
                Number.isFinite(s.latitud) &&
                Number.isFinite(s.longitud),
        );

    const submit = () => {
        if (!canSubmit) return;

        const options = {
            preserveScroll: true,
            forceFormData: true as const,
            onSuccess: () => setFormOpen(false),
        };

        form.transform((payload) => ({
            ...payload,
            stops: payload.stops.map((s, i) => ({
                ...s,
                sort_order: i + 1,
                target_id: s.target_id || null,
                slug: s.slug || null,
                visita_at: s.visita_at || null,
            })),
        }));

        if (editing) {
            form.post(`/eventos-extraordinarios/${editing.id}`, options);
            return;
        }

        form.post('/eventos-extraordinarios', options);
    };

    const patchStop = (index: number, patch: Partial<StopDraft>) => {
        const next = [...form.data.stops];
        next[index] = { ...next[index], ...patch };
        form.setData('stops', next);
    };

    return (
        <>
            <Head title="Eventos extraordinarios" />
            <div className="flex flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Eventos extraordinarios"
                    description="Rutas temporales (ej. visita papal) con fechas, logo flotante y paradas en mapa."
                    badges={[
                        {
                            label: 'Eventos',
                            value: events.length,
                            color: 'blue',
                            icon: Sparkles,
                        },
                        {
                            label: 'Activos',
                            value: activeCount,
                            color: activeCount > 0 ? 'orange' : 'gray',
                            icon: MapPinned,
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
                            Aún no hay eventos extraordinarios. Crea uno (ej. Ruta del Papa 2026).
                        </p>
                    ) : (
                        events.map((row) => (
                            <div
                                key={row.id}
                                className="group flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3"
                            >
                                {row.logo_url ? (
                                    <img
                                        src={row.logo_url}
                                        alt=""
                                        className="size-16 rounded-xl object-cover bg-black"
                                    />
                                ) : (
                                    <div className="flex size-16 items-center justify-center rounded-xl bg-red-100 text-red-700">
                                        <Sparkles className="size-6" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate font-semibold">{row.titulo}</p>
                                        <StatusPill variant={row.active ? 'green' : 'muted'}>
                                            {row.active ? 'activo' : 'inactivo'}
                                        </StatusPill>
                                        {row.year_effect ? (
                                            <StatusPill variant="amber">{row.year_effect}</StatusPill>
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {row.stops.length} paradas · CTA: {row.cta_label}
                                        {row.starts_at ? ` · ${row.starts_at}` : ''}
                                        {row.ends_at ? ` → ${row.ends_at}` : ''}
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
                title={editing ? 'Editar evento extraordinario' : 'Nuevo evento extraordinario'}
                description="Define fechas, texto del flotante en la app y las paradas con fecha/hora y coordenadas."
                icon={Sparkles}
                size="xl"
                submitLabel="Guardar"
                canSubmit={canSubmit}
                submitting={form.processing}
                onSubmit={submit}
                onAfterClose={() => {
                    setEditing(null);
                    setExistingLogoUrl(null);
                    form.setData(makeEmptyForm());
                    form.clearErrors();
                }}
            >
                <div className="grid gap-4">
                    <FormField label="Título" required error={form.errors.titulo}>
                        <Input
                            value={form.data.titulo}
                            onChange={(e) => form.setData('titulo', e.target.value)}
                            className="bg-card"
                            placeholder="La ruta del Papa"
                        />
                    </FormField>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormField label="Texto flotante (app)" error={form.errors.floating_text}>
                            <Input
                                value={form.data.floating_text}
                                onChange={(e) => form.setData('floating_text', e.target.value)}
                                className="bg-card"
                                placeholder="Ver la ruta del papa"
                            />
                        </FormField>
                        <FormField label="CTA / botón" error={form.errors.cta_label}>
                            <Input
                                value={form.data.cta_label}
                                onChange={(e) => form.setData('cta_label', e.target.value)}
                                className="bg-card"
                            />
                        </FormField>
                    </div>

                    <FormField label="Descripción" error={form.errors.descripcion}>
                        <textarea
                            value={form.data.descripcion}
                            onChange={(e) => form.setData('descripcion', e.target.value)}
                            rows={3}
                            className={cn(
                                'border-input placeholder:text-muted-foreground flex w-full rounded-md border bg-card px-3 py-2 text-sm shadow-xs outline-none',
                            )}
                        />
                    </FormField>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <FormField label="Efecto año" error={form.errors.year_effect}>
                            <Input
                                value={form.data.year_effect}
                                onChange={(e) => form.setData('year_effect', e.target.value)}
                                className="bg-card"
                                placeholder="2026"
                            />
                        </FormField>
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

                    <FormField label="Logo (flotante app)" error={form.errors.logo}>
                        <ImageUploadField
                            value={form.data.logo}
                            existingUrl={existingLogoUrl}
                            removed={false}
                            onFileChange={(file) => form.setData('logo', file)}
                            onRemove={() => form.setData('logo', null)}
                        />
                    </FormField>

                    <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                            checked={form.data.active}
                            onCheckedChange={(v) => form.setData('active', Boolean(v))}
                        />
                        Activo (visible en la app dentro del rango de fechas)
                    </label>

                    <div className="rounded-xl border p-3">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">Paradas / lugares</p>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    form.setData('stops', [
                                        ...form.data.stops,
                                        emptyStop(form.data.stops.length + 1),
                                    ])
                                }
                            >
                                <Plus className="size-4" />
                                Añadir lugar
                            </Button>
                        </div>

                        <div className="mb-3 flex flex-wrap gap-2">
                            {form.data.stops.map((s, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setStopMapIndex(i)}
                                    className={cn(
                                        'rounded-full border px-3 py-1 text-xs font-semibold',
                                        stopMapIndex === i
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'bg-muted',
                                    )}
                                >
                                    {i + 1}. {s.nombre || 'Sin nombre'}
                                </button>
                            ))}
                        </div>

                        {form.data.stops.map((stop, index) => (
                            <div
                                key={index}
                                className={cn(
                                    'mb-3 grid gap-3 rounded-lg border p-3',
                                    stopMapIndex === index ? 'border-primary' : 'opacity-70',
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-xs font-bold uppercase text-muted-foreground">
                                        Lugar {index + 1}
                                    </p>
                                    {form.data.stops.length > 1 ? (
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                                const next = form.data.stops.filter((_, i) => i !== index);
                                                form.setData('stops', next);
                                                setStopMapIndex(Math.max(0, index - 1));
                                            }}
                                        >
                                            <Trash2 className="size-4 text-destructive" />
                                        </Button>
                                    ) : null}
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <FormField label="Nombre" required>
                                        <Input
                                            value={stop.nombre}
                                            onChange={(e) => patchStop(index, { nombre: e.target.value })}
                                            className="bg-card"
                                        />
                                    </FormField>
                                    <FormField label="Slug (opcional)">
                                        <Input
                                            value={stop.slug}
                                            onChange={(e) => patchStop(index, { slug: e.target.value })}
                                            className="bg-card"
                                        />
                                    </FormField>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <FormField label="Tipo">
                                        <Select
                                            value={stop.target_type}
                                            onValueChange={(v) =>
                                                patchStop(index, {
                                                    target_type: v as StopDraft['target_type'],
                                                })
                                            }
                                        >
                                            <SelectTrigger className="bg-card">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="custom">Personalizado</SelectItem>
                                                <SelectItem value="tour_spot">Centro turístico</SelectItem>
                                                <SelectItem value="restaurant">Restaurante</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormField>
                                    <FormField label="Fecha y hora visita">
                                        <Input
                                            type="datetime-local"
                                            value={stop.visita_at}
                                            onChange={(e) =>
                                                patchStop(index, { visita_at: e.target.value })
                                            }
                                            className="bg-card"
                                        />
                                    </FormField>
                                    <FormField label="ID destino (uuid opcional)">
                                        <Input
                                            value={stop.target_id}
                                            onChange={(e) =>
                                                patchStop(index, { target_id: e.target.value })
                                            }
                                            className="bg-card"
                                        />
                                    </FormField>
                                </div>

                                {stopMapIndex === index ? (
                                    <LocationMapPicker
                                        token={mapbox_token ?? null}
                                        value={{
                                            latitud: stop.latitud,
                                            longitud: stop.longitud,
                                        }}
                                        onChange={(next) =>
                                            patchStop(index, {
                                                latitud: next.latitud,
                                                longitud: next.longitud,
                                            })
                                        }
                                    />
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Lat {stop.latitud ?? '—'} · Lng {stop.longitud ?? '—'} (elige el chip
                                        para editar en mapa)
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </BaseModal>

            <BaseModal
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
                title="Eliminar evento"
                description={
                    deleteTarget
                        ? `¿Eliminar “${deleteTarget.titulo}”? Esta acción no se puede deshacer.`
                        : undefined
                }
                icon={Trash2}
                submitLabel="Eliminar"
                canSubmit={Boolean(deleteTarget)}
                submitting={false}
                onSubmit={() => {
                    if (!deleteTarget) return;
                    router.delete(`/eventos-extraordinarios/${deleteTarget.id}`, {
                        onSuccess: () => setDeleteTarget(null),
                    });
                }}
            >
                <p className="text-sm text-muted-foreground">
                    Se borrarán también todas las paradas del evento.
                </p>
            </BaseModal>
        </>
    );
}
