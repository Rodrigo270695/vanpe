import { Head, router } from '@inertiajs/react';
import { Bug, RefreshCw, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { SearchInput } from '@/components/common/search-input';
import { StatusPill, type StatusPillVariant } from '@/components/common/status-pill';
import { TableCard } from '@/components/common/table-card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type DiagnosticLog = {
    id: string;
    device_id: string;
    session_id: string | null;
    level: string;
    event: string;
    message: string;
    app_version: string | null;
    platform: string | null;
    os_version: string | null;
    payload: Record<string, unknown> | null;
    customer: { id: string; name: string | null; email: string | null } | null;
    created_at: string | null;
};

type Props = {
    logs: DiagnosticLog[];
    filters: {
        level: string;
        event: string;
        device_id: string;
    };
};

function levelVariant(level: string): StatusPillVariant {
    if (level === 'fatal' || level === 'error') return 'amber';
    if (level === 'warning') return 'violet';
    if (level === 'info') return 'green';
    return 'neutral';
}

export default function AppDiagnosticsIndex({ logs, filters }: Props) {
    const [level, setLevel] = useState(filters.level || 'all');
    const [event, setEvent] = useState(filters.event);
    const [deviceId, setDeviceId] = useState(filters.device_id);
    const [selected, setSelected] = useState<DiagnosticLog | null>(logs[0] ?? null);

    const fatalCount = useMemo(
        () => logs.filter((l) => l.level === 'fatal' || l.event === 'suspected_kill').length,
        [logs],
    );

    const applyFilters = () => {
        router.get(
            '/app-diagnostics',
            {
                level: level === 'all' ? '' : level,
                event: event || undefined,
                device_id: deviceId || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Diagnóstico app" />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Diagnóstico APK"
                    description={`Últimos ${logs.length} eventos de la app móvil. Kill sospechosos / fatales: ${fatalCount}.`}
                    badges={[
                        { label: 'Eventos', value: logs.length, color: 'blue', icon: Bug },
                        { label: 'Críticos', value: fatalCount, color: 'red' },
                    ]}
                >
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => router.reload()}>
                            <RefreshCw className="mr-2 size-4" />
                            Actualizar
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.post('/app-diagnostics/clear', {}, { preserveScroll: true })
                            }
                        >
                            <Trash2 className="mr-2 size-4" />
                            Limpiar +14 días
                        </Button>
                    </div>
                </PageHeader>

                <TableCard flush>
                    <div className="flex flex-col gap-3 border-b border-border/60 p-4 md:flex-row md:items-end">
                        <div className="w-full md:w-40">
                            <p className="mb-1 text-xs font-semibold text-muted-foreground">Nivel</p>
                            <Select value={level} onValueChange={setLevel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Nivel" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="info">info</SelectItem>
                                    <SelectItem value="warning">warning</SelectItem>
                                    <SelectItem value="error">error</SelectItem>
                                    <SelectItem value="fatal">fatal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <p className="mb-1 text-xs font-semibold text-muted-foreground">Evento</p>
                            <SearchInput
                                value={event}
                                onChange={setEvent}
                                placeholder="suspected_kill, js_error…"
                            />
                        </div>
                        <div className="flex-1">
                            <p className="mb-1 text-xs font-semibold text-muted-foreground">Device ID</p>
                            <SearchInput
                                value={deviceId}
                                onChange={setDeviceId}
                                placeholder="ID del dispositivo"
                            />
                        </div>
                        <Button type="button" onClick={applyFilters}>
                            Filtrar
                        </Button>
                    </div>

                    <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="max-h-[70vh] overflow-auto">
                            {logs.length === 0 ? (
                                <p className="p-6 text-sm text-muted-foreground">
                                    Aún no hay logs. Abre la app, úsala un rato y en Perfil → Diagnóstico
                                    pulsa “Enviar logs”.
                                </p>
                            ) : (
                                <ul className="divide-y divide-border/50">
                                    {logs.map((log) => (
                                        <li key={log.id}>
                                            <button
                                                type="button"
                                                onClick={() => setSelected(log)}
                                                className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-muted/40 ${
                                                    selected?.id === log.id ? 'bg-muted/50' : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <StatusPill variant={levelVariant(log.level)}>
                                                        {log.level}
                                                    </StatusPill>
                                                    <span className="text-xs font-semibold text-foreground">
                                                        {log.event}
                                                    </span>
                                                    <span className="ml-auto text-[11px] text-muted-foreground">
                                                        {log.created_at
                                                            ? new Date(log.created_at).toLocaleString('es-PE')
                                                            : '—'}
                                                    </span>
                                                </div>
                                                <p className="line-clamp-2 text-sm text-foreground/90">
                                                    {log.message}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {log.platform ?? '?'} · v{log.app_version ?? '?'} ·{' '}
                                                    {log.customer?.email ?? 'invitado'} ·{' '}
                                                    {log.device_id.slice(0, 10)}…
                                                </p>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="border-t border-border/60 bg-muted/20 p-4 lg:border-l lg:border-t-0">
                            {selected ? (
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-bold">{selected.event}</p>
                                            <p className="text-xs text-muted-foreground">{selected.id}</p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                router.delete(`/app-diagnostics/${selected.id}`, {
                                                    preserveScroll: true,
                                                    onSuccess: () => setSelected(null),
                                                })
                                            }
                                        >
                                            Eliminar
                                        </Button>
                                    </div>
                                    <p className="text-sm">{selected.message}</p>
                                    <dl className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <dt className="text-muted-foreground">Device</dt>
                                            <dd className="break-all font-mono">{selected.device_id}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Sesión</dt>
                                            <dd className="break-all font-mono">
                                                {selected.session_id ?? '—'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">OS</dt>
                                            <dd>{selected.os_version ?? '—'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Cliente</dt>
                                            <dd>{selected.customer?.email ?? '—'}</dd>
                                        </div>
                                    </dl>
                                    <div>
                                        <p className="mb-1 text-xs font-semibold text-muted-foreground">
                                            Payload / breadcrumbs
                                        </p>
                                        <pre className="max-h-[48vh] overflow-auto rounded-lg bg-background p-3 text-[11px] leading-relaxed">
                                            {JSON.stringify(selected.payload ?? {}, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Selecciona un log.</p>
                            )}
                        </div>
                    </div>
                </TableCard>
            </div>
        </>
    );
}

AppDiagnosticsIndex.layout = () => ({
    breadcrumbs: [
        { title: 'Plataforma', href: '/dashboard' },
        { title: 'Diagnóstico APK', href: '/app-diagnostics' },
    ],
});
