import { Head, router, useForm } from '@inertiajs/react';
import { PartyPopper, Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState, type ReactNode } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { StatusPill } from '@/components/common/status-pill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type SponsorDraft = {
    nombre: string;
    tipo: string;
    logo_url: string;
    website: string;
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
    sponsors: SponsorDraft[];
};

type Props = {
    events: EventRow[];
    departamentos: { id: number; name: string }[];
    can: { create: boolean; update: boolean; delete: boolean };
};

const emptyForm = {
    titulo: '',
    slug: '',
    resumen: '',
    descripcion: '',
    portada_url: '',
    lugar: '',
    departamento_id: '' as string | number,
    starts_at: '',
    ends_at: '',
    estado: 'publicado',
    destacado: true,
    sort_order: 0,
    sponsors: [] as SponsorDraft[],
};

export default function EventsIndex({ events, departamentos, can }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<EventRow | null>(null);
    const form = useForm({ ...emptyForm });

    const openCreate = () => {
        setEditing(null);
        form.setData({ ...emptyForm });
        setOpen(true);
    };

    const openEdit = (row: EventRow) => {
        setEditing(row);
        form.setData({
            titulo: row.titulo,
            slug: row.slug,
            resumen: row.resumen ?? '',
            descripcion: row.descripcion ?? '',
            portada_url: row.portada_url ?? '',
            lugar: row.lugar ?? '',
            departamento_id: row.departamento_id ?? '',
            starts_at: row.starts_at ?? '',
            ends_at: row.ends_at ?? '',
            estado: row.estado,
            destacado: row.destacado,
            sort_order: row.sort_order,
            sponsors: row.sponsors ?? [],
        });
        setOpen(true);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const payload = {
            ...form.data,
            departamento_id: form.data.departamento_id
                ? Number(form.data.departamento_id)
                : null,
        };

        if (editing) {
            form.transform(() => payload).put(`/festividades/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
            });
        } else {
            form.transform(() => payload).post('/festividades', {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
            });
        }
    };

    const remove = (row: EventRow) => {
        if (!window.confirm(`¿Eliminar «${row.titulo}»?`)) return;
        router.delete(`/festividades/${row.id}`, { preserveScroll: true });
    };

    const addSponsor = () => {
        form.setData('sponsors', [
            ...form.data.sponsors,
            { nombre: '', tipo: 'auspiciador', logo_url: '', website: '' },
        ]);
    };

    return (
        <AppLayout>
            <Head title="Ferias y festividades" />
            <div className="flex flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Ferias y festividades"
                    description="Eventos de plataforma (Cruz de Motupe, Monsefú, Fiestas Patrias…) visibles en la app."
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
                                className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3"
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
                                {can.update ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => openEdit(row)}
                                    >
                                        <Pencil className="size-4" />
                                    </Button>
                                ) : null}
                                {can.delete ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => remove(row)}
                                    >
                                        <Trash2 className="size-4 text-destructive" />
                                    </Button>
                                ) : null}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {open ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
                    <form
                        onSubmit={submit}
                        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-card p-4 shadow-xl"
                    >
                        <h2 className="mb-3 text-lg font-semibold">
                            {editing ? 'Editar evento' : 'Nuevo evento'}
                        </h2>
                        <div className="grid gap-3">
                            <Field label="Título">
                                <Input
                                    value={form.data.titulo}
                                    onChange={(e) => form.setData('titulo', e.target.value)}
                                    required
                                />
                            </Field>
                            <Field label="Resumen">
                                <Input
                                    value={form.data.resumen}
                                    onChange={(e) => form.setData('resumen', e.target.value)}
                                />
                            </Field>
                            <Field label="Descripción">
                                <textarea
                                    value={form.data.descripcion}
                                    onChange={(e) => form.setData('descripcion', e.target.value)}
                                    rows={4}
                                    className={cn(
                                        'border-input placeholder:text-muted-foreground flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none',
                                    )}
                                />
                            </Field>
                            <Field label="URL portada">
                                <Input
                                    value={form.data.portada_url}
                                    onChange={(e) => form.setData('portada_url', e.target.value)}
                                    placeholder="https://…"
                                />
                            </Field>
                            <Field label="Lugar">
                                <Input
                                    value={form.data.lugar}
                                    onChange={(e) => form.setData('lugar', e.target.value)}
                                />
                            </Field>
                            <Field label="Departamento">
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
                                    <SelectTrigger>
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
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Inicio">
                                    <Input
                                        type="datetime-local"
                                        value={form.data.starts_at}
                                        onChange={(e) =>
                                            form.setData('starts_at', e.target.value)
                                        }
                                    />
                                </Field>
                                <Field label="Fin">
                                    <Input
                                        type="datetime-local"
                                        value={form.data.ends_at}
                                        onChange={(e) => form.setData('ends_at', e.target.value)}
                                    />
                                </Field>
                            </div>
                            <Field label="Estado">
                                <Select
                                    value={form.data.estado}
                                    onValueChange={(v) => form.setData('estado', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="borrador">Borrador</SelectItem>
                                        <SelectItem value="publicado">Publicado</SelectItem>
                                        <SelectItem value="archivado">Archivado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>

                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Auspiciadores / orquestas</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addSponsor}
                                >
                                    Añadir
                                </Button>
                            </div>
                            {form.data.sponsors.map((s, i) => (
                                <div key={i} className="grid gap-2 rounded-xl border p-2">
                                    <Input
                                        placeholder="Nombre"
                                        value={s.nombre}
                                        onChange={(e) => {
                                            const next = [...form.data.sponsors];
                                            next[i] = { ...next[i], nombre: e.target.value };
                                            form.setData('sponsors', next);
                                        }}
                                    />
                                    <Select
                                        value={s.tipo}
                                        onValueChange={(v) => {
                                            const next = [...form.data.sponsors];
                                            next[i] = { ...next[i], tipo: v };
                                            form.setData('sponsors', next);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="auspiciador">Auspiciador</SelectItem>
                                            <SelectItem value="orquesta">Orquesta</SelectItem>
                                            <SelectItem value="artista">Artista</SelectItem>
                                            <SelectItem value="otro">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                Guardar
                            </Button>
                        </div>
                    </form>
                </div>
            ) : null}
        </AppLayout>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid gap-1.5">
            <Label>{label}</Label>
            {children}
        </div>
    );
}
