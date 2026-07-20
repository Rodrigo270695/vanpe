import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Hash,
    Layers,
    Plus,
    Power,
    Star,
    Trash2,
    X,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { FormField } from '@/components/common/form-field';
import { BaseModal } from '@/components/common/base-modal';
import type { FelSerieRow } from '@/components/configuracion/types';
import { Button } from '@/components/ui/button';
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

type FelSeriesSectionProps = {
    series: FelSerieRow[];
    canManage: boolean;
};

const TIPO_COLORS: Record<number, string> = {
    1: 'bg-blue-50 text-blue-700 ring-blue-200',
    2: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

const TIPO_NEXT_COLORS: Record<number, string> = {
    1: 'text-blue-700 bg-blue-50 ring-blue-200/80',
    2: 'text-emerald-700 bg-emerald-50 ring-emerald-200/80',
};

export function FelSeriesSection({ series, canManage }: FelSeriesSectionProps) {
    const { t } = useTranslations();
    const [showForm, setShowForm] = useState(false);
    const [formTipo, setFormTipo] = useState('2');
    const [formAmbiente, setFormAmbiente] = useState('sandbox');
    const [formSerie, setFormSerie] = useState('');
    const [formCorrelativo, setFormCorrelativo] = useState('0');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<FelSerieRow | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [defaultingId, setDefaultingId] = useState<string | null>(null);

    const handleStore = () => {
        setSubmitting(true);
        router.post(
            '/facturacion/series',
            {
                tipo_comprobante: Number(formTipo),
                serie: formSerie.trim().toUpperCase(),
                ambiente: formAmbiente,
                ultimo_correlativo: Number(formCorrelativo) || 0,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowForm(false);
                    setFormSerie('');
                    setFormCorrelativo('0');
                    setFormAmbiente('sandbox');
                    setFormErrors({});
                },
                onError: (errs) => setFormErrors(errs as Record<string, string>),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const handleToggle = (serie: FelSerieRow) => {
        setTogglingId(serie.id);
        router.put(
            `/facturacion/series/${serie.id}`,
            { activo: !serie.activo },
            {
                preserveScroll: true,
                onFinish: () => setTogglingId(null),
            },
        );
    };

    const handleSetDefault = (serie: FelSerieRow) => {
        if (serie.es_predeterminada || !serie.activo) {
            return;
        }

        setDefaultingId(serie.id);
        router.put(
            `/facturacion/series/${serie.id}`,
            { es_predeterminada: true },
            {
                preserveScroll: true,
                onFinish: () => setDefaultingId(null),
            },
        );
    };

    const handleDelete = (serie: FelSerieRow) => {
        setDeleteTarget(serie);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        setDeletingId(deleteTarget.id);
        router.delete(`/facturacion/series/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeletingId(null),
        });
    };

    const previewNext =
        formSerie.trim() !== ''
            ? `${formSerie.trim().toUpperCase()}-${String((Number(formCorrelativo) || 0) + 1).padStart(8, '0')}`
            : null;

    return (
        <div className="space-y-4 sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold">{t('fel.series_title')}</p>
                    <p className="text-[12px] text-muted-foreground">
                        {t('fel.series_hint')}
                    </p>
                </div>
                {canManage && !showForm ? (
                    <Button
                        type="button"
                        size="sm"
                        className="gap-2 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                        onClick={() => setShowForm(true)}
                    >
                        <Plus className="size-4" />
                        {t('fel.series_add')}
                    </Button>
                ) : null}
            </div>

            {showForm ? (
                <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-emerald-900">
                            {t('fel.series_new')}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setFormErrors({});
                            }}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/80 hover:text-foreground"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-12">
                        <FormField
                            label={t('fel.series_type')}
                            error={formErrors.tipo_comprobante}
                            className="sm:col-span-2"
                        >
                            <Select value={formTipo} onValueChange={setFormTipo}>
                                <SelectTrigger className="h-10 w-full bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2">{t('fel.type_boleta')}</SelectItem>
                                    <SelectItem value="1">{t('fel.type_factura')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField
                            label={t('fel.series_ambiente')}
                            error={formErrors.ambiente}
                            className="sm:col-span-2"
                        >
                            <Select value={formAmbiente} onValueChange={setFormAmbiente}>
                                <SelectTrigger className="h-10 w-full bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sandbox">
                                        {t('fel.mode_sandbox_short')}
                                    </SelectItem>
                                    <SelectItem value="produccion">
                                        {t('fel.mode_production_short')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField
                            label={t('fel.series_code')}
                            error={formErrors.serie}
                            className="sm:col-span-2"
                        >
                            <Input
                                value={formSerie}
                                onChange={(e) =>
                                    setFormSerie(
                                        e.target.value
                                            .toUpperCase()
                                            .replace(/[^A-Z0-9]/g, '')
                                            .slice(0, 4),
                                    )
                                }
                                placeholder="B001"
                                maxLength={4}
                                className="h-10 bg-white font-mono tracking-widest"
                            />
                        </FormField>

                        <FormField
                            label={t('fel.series_correlative_base')}
                            error={formErrors.ultimo_correlativo}
                            className="sm:col-span-3"
                        >
                            <Input
                                type="number"
                                min={0}
                                value={formCorrelativo}
                                onChange={(e) => setFormCorrelativo(e.target.value)}
                                className="h-10 bg-white font-mono"
                            />
                        </FormField>

                        <div className="sm:col-span-3">
                            <Button
                                type="button"
                                className="h-10 w-full gap-2 bg-brand-blue text-white shadow-sm hover:bg-brand-blue/90"
                                disabled={submitting}
                                onClick={handleStore}
                            >
                                <Plus className="size-4" />
                                {t('fel.series_save')}
                            </Button>
                        </div>
                    </div>

                    {previewNext ? (
                        <p className="mt-3 rounded-lg border border-dashed border-emerald-200 bg-white/70 px-3 py-2 text-xs text-muted-foreground">
                            {t('fel.series_next')}:{' '}
                            <span className="font-mono text-sm font-bold text-emerald-800">
                                {previewNext}
                            </span>
                            <span className="mt-1 block">
                                {formAmbiente === 'sandbox'
                                    ? t('fel.series_advance_hint_sandbox')
                                    : t('fel.series_advance_hint_production')}
                            </span>
                        </p>
                    ) : null}
                </div>
            ) : null}

            {series.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                    <Layers className="mx-auto mb-2 size-8 opacity-40" />
                    {t('fel.series_empty')}
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                <th className="px-4 py-3">{t('fel.series_type')}</th>
                                <th className="px-4 py-3">{t('fel.series_code')}</th>
                                <th className="px-4 py-3">{t('fel.series_ambiente')}</th>
                                <th className="px-4 py-3 text-right">
                                    <span className="inline-flex items-center justify-end gap-1">
                                        <Hash className="size-3.5" />
                                        {t('fel.series_next_number')}
                                    </span>
                                </th>
                                <th className="px-4 py-3 text-center">{t('fel.series_default')}</th>
                                <th className="px-4 py-3 text-center">{t('fel.series_status')}</th>
                                {canManage ? (
                                    <th className="px-4 py-3 text-right">{t('fel.series_actions')}</th>
                                ) : null}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {series.map((serie) => (
                                <tr
                                    key={serie.id}
                                    className={cn(
                                        'transition-colors hover:bg-muted/20',
                                        !serie.activo && 'opacity-60',
                                    )}
                                >
                                    <td className="px-4 py-3.5">
                                        <span
                                            className={cn(
                                                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
                                                TIPO_COLORS[serie.tipo_comprobante] ??
                                                    'bg-muted text-muted-foreground ring-border',
                                            )}
                                        >
                                            {serie.tipo_label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 font-mono text-base font-bold tracking-widest">
                                        {serie.serie}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span
                                            className={cn(
                                                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
                                                serie.ambiente === 'produccion'
                                                    ? 'bg-blue-50 text-blue-700 ring-blue-200'
                                                    : 'bg-amber-50 text-amber-700 ring-amber-200',
                                            )}
                                        >
                                            {serie.ambiente === 'produccion'
                                                ? t('fel.mode_production_short')
                                                : t('fel.mode_sandbox_short')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <span
                                            className={cn(
                                                'inline-flex flex-col items-end gap-0.5 rounded-lg px-2.5 py-1.5 ring-1',
                                                TIPO_NEXT_COLORS[serie.tipo_comprobante] ??
                                                    'bg-muted text-foreground ring-border',
                                            )}
                                        >
                                            <span className="font-mono text-sm font-bold tabular-nums">
                                                {serie.proximo_numero_completo}
                                            </span>
                                            <span className="text-[10px] font-normal opacity-80">
                                                {serie.ambiente === 'sandbox'
                                                    ? t('fel.series_last_sandbox', {
                                                          number:
                                                              serie.ultimo_emitido_sandbox ?? 0,
                                                      })
                                                    : t('fel.series_last_issued', {
                                                          number: serie.ultimo_correlativo,
                                                      })}
                                            </span>
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <button
                                            type="button"
                                            title={
                                                serie.es_predeterminada
                                                    ? t('fel.series_default_active')
                                                    : t('fel.series_default_set')
                                            }
                                            disabled={
                                                !serie.activo ||
                                                serie.es_predeterminada ||
                                                defaultingId === serie.id
                                            }
                                            onClick={() => handleSetDefault(serie)}
                                            className={cn(
                                                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors disabled:opacity-50',
                                                serie.es_predeterminada
                                                    ? 'bg-brand-blue/10 text-brand-blue ring-brand-blue/20'
                                                    : 'bg-muted text-muted-foreground ring-border hover:bg-brand-blue/5 hover:text-brand-blue',
                                            )}
                                        >
                                            <Star
                                                className={cn(
                                                    'size-3.5',
                                                    serie.es_predeterminada && 'fill-current',
                                                )}
                                            />
                                            {serie.es_predeterminada
                                                ? t('fel.series_default_active')
                                                : t('fel.series_default_set')}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        {serie.activo ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                                                <CheckCircle2 className="size-3" />
                                                {t('fel.series_active')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                                                <XCircle className="size-3" />
                                                {t('fel.series_inactive')}
                                            </span>
                                        )}
                                    </td>
                                    {canManage ? (
                                        <td className="px-4 py-3.5">
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    title={
                                                        serie.activo
                                                            ? t('fel.series_deactivate')
                                                            : t('fel.series_activate')
                                                    }
                                                    disabled={togglingId === serie.id}
                                                    onClick={() => handleToggle(serie)}
                                                    className={cn(
                                                        'rounded-lg p-2 transition-colors disabled:opacity-50',
                                                        serie.activo
                                                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                                    )}
                                                >
                                                    <Power className="size-4" />
                                                </button>
                                                {serie.puede_eliminar ?? !serie.tiene_documentos ? (
                                                    <button
                                                        type="button"
                                                        title={t('fel.series_delete')}
                                                        disabled={deletingId === serie.id}
                                                        onClick={() => handleDelete(serie)}
                                                        className="rounded-lg bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                ) : (
                                                    <span
                                                        title={t('fel.series_locked')}
                                                        className="rounded-lg bg-amber-50 p-2 text-amber-600"
                                                    >
                                                        <AlertTriangle className="size-4" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    ) : null}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <BaseModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={t('fel.series_delete_title')}
                description={
                    deleteTarget
                        ? t('fel.series_delete_confirm', { serie: deleteTarget.serie })
                        : ''
                }
                submitLabel={t('common.delete')}
                submitVariant="destructive"
                onSubmit={confirmDelete}
                submitting={deletingId !== null}
            />
        </div>
    );
}
