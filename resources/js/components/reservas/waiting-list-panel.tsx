import { router, useForm } from '@inertiajs/react';
import { Clock, LogOut, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import type { ReservasAreaOption, WaitingListRow } from '@/components/reservas/types';
import { SeatTableModal } from '@/components/reservas/seat-table-modal';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/use-translations';
import { formatCajaTime } from '@/lib/caja-format';

type WaitingListPanelProps = {
    entries: WaitingListRow[];
    areas: ReservasAreaOption[];
    canManage: boolean;
};

export function WaitingListPanel({
    entries,
    areas,
    canManage,
}: WaitingListPanelProps) {
    const { t, locale, timezone } = useTranslations();
    const [addOpen, setAddOpen] = useState(false);
    const [seatTarget, setSeatTarget] = useState<WaitingListRow | null>(null);

    const form = useForm({
        cliente_nombre: '',
        cliente_telefono: '',
        num_personas: '2',
        notas: '',
    });

    const submitAdd = () => {
        form.post('/lista-espera', {
            preserveScroll: true,
            onSuccess: () => {
                setAddOpen(false);
                form.reset();
            },
        });
    };

    const withdraw = (id: string) => {
        router.post(`/lista-espera/${id}/retirar`, {}, { preserveScroll: true });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">{t('lista_espera.title')}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t('lista_espera.description')}
                    </p>
                </div>
                {canManage ? (
                    <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
                        <Plus className="size-4" />
                        {t('lista_espera.add')}
                    </Button>
                ) : null}
            </div>

            {entries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                    {t('lista_espera.empty')}
                </div>
            ) : (
                <div className="grid gap-3">
                    {entries.map((entry, index) => (
                        <article
                            key={entry.id}
                            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card p-4"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
                                        {index + 1}
                                    </span>
                                    <h3 className="font-semibold">{entry.cliente_nombre}</h3>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                        <Users className="size-3.5" />
                                        {t('lista_espera.people', {
                                            count: entry.num_personas,
                                        })}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="size-3.5" />
                                        {formatCajaTime(entry.hora_llegada, locale, timezone)}
                                        {' · '}
                                        {t('lista_espera.wait_minutes', {
                                            minutes: entry.wait_minutes,
                                        })}
                                    </span>
                                </div>
                                {entry.notas ? (
                                    <p className="mt-2 text-xs text-slate-600">{entry.notas}</p>
                                ) : null}
                            </div>

                            {canManage ? (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => setSeatTarget(entry)}
                                    >
                                        {t('lista_espera.seat')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1"
                                        onClick={() => withdraw(entry.id)}
                                    >
                                        <LogOut className="size-3.5" />
                                        {t('lista_espera.withdraw')}
                                    </Button>
                                </div>
                            ) : null}
                        </article>
                    ))}
                </div>
            )}

            <BaseModal
                open={addOpen}
                onOpenChange={setAddOpen}
                title={t('lista_espera.add_title')}
                icon={Users}
                submitLabel={t('lista_espera.add_confirm')}
                onSubmit={submitAdd}
                submitting={form.processing}
            >
                <div className="space-y-4">
                    <FormField
                        label={t('lista_espera.field_name')}
                        error={form.errors.cliente_nombre}
                        required
                    >
                        <Input
                            value={form.data.cliente_nombre}
                            onChange={(e) => form.setData('cliente_nombre', e.target.value)}
                        />
                    </FormField>
                    <FormField
                        label={t('lista_espera.field_phone')}
                        error={form.errors.cliente_telefono}
                    >
                        <Input
                            value={form.data.cliente_telefono}
                            onChange={(e) =>
                                form.setData('cliente_telefono', e.target.value)
                            }
                        />
                    </FormField>
                    <FormField
                        label={t('lista_espera.field_people')}
                        error={form.errors.num_personas}
                        required
                    >
                        <Input
                            type="number"
                            min={1}
                            max={99}
                            value={form.data.num_personas}
                            onChange={(e) => form.setData('num_personas', e.target.value)}
                        />
                    </FormField>
                    <FormField label={t('lista_espera.field_notes')} error={form.errors.notas}>
                        <Input
                            value={form.data.notas}
                            onChange={(e) => form.setData('notas', e.target.value)}
                        />
                    </FormField>
                </div>
            </BaseModal>

            {seatTarget ? (
                <SeatTableModal
                    open={seatTarget !== null}
                    onOpenChange={(open) => !open && setSeatTarget(null)}
                    title={t('lista_espera.seat_title')}
                    description={seatTarget.cliente_nombre}
                    submitUrl={`/lista-espera/${seatTarget.id}/sentar`}
                    areas={areas}
                    partySize={seatTarget.num_personas}
                />
            ) : null}
        </div>
    );
}
