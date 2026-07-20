import { History } from 'lucide-react';
import type { CajaHistorySession } from '@/components/caja/types';
import { BaseModal } from '@/components/common/base-modal';
import { useTranslations } from '@/hooks/use-translations';
import {
    formatCajaDate,
    formatCajaMoney,
    formatCajaTime,
} from '@/lib/caja-format';
import { cn } from '@/lib/utils';

type HistoryDetailModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    row: CajaHistorySession | null;
    currency: string;
};

export function HistoryDetailModal({
    open,
    onOpenChange,
    row,
    currency,
}: HistoryDetailModalProps) {
    const { t, locale, timezone } = useTranslations();

    if (!row) {
        return null;
    }

    const methodLabel = (method: string) =>
        t(`caja.method_${method}` as 'caja.method_efectivo');

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('caja.history_detail_title')}
            description={`${formatCajaDate(row.cerrada_en, locale, timezone)} · ${row.cajero?.name ?? '—'}`}
            icon={History}
            submitLabel={t('caja.close_detail')}
            onSubmit={() => onOpenChange(false)}
        >
            <div className="space-y-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                    <Detail label={t('caja.history_opening')} value={formatCajaMoney(row.monto_apertura, currency)} />
                    <Detail label={t('caja.history_sales')} value={formatCajaMoney(row.total_ventas, currency)} />
                    <Detail label={t('caja.history_closing')} value={formatCajaMoney(row.monto_cierre, currency)} />
                    <Detail
                        label={t('caja.history_expected')}
                        value={formatCajaMoney(row.monto_esperado_efectivo, currency)}
                    />
                    <Detail
                        label={t('caja.history_difference')}
                        value={formatCajaMoney(row.diferencia, currency)}
                        valueClassName={cn(
                            row.diferencia === 0
                                ? 'text-emerald-600'
                                : row.diferencia > 0
                                  ? 'text-amber-600'
                                  : 'text-red-600',
                        )}
                    />
                    <Detail
                        label={t('caja.history_schedule')}
                        value={`${formatCajaTime(row.abierta_en, locale, timezone)} – ${formatCajaTime(row.cerrada_en, locale, timezone)}`}
                    />
                </div>

                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('caja.history_sales_breakdown')}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {(['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'] as const).map(
                            (method) => (
                                <Detail
                                    key={method}
                                    label={methodLabel(method)}
                                    value={formatCajaMoney(row.summary[method], currency)}
                                />
                            ),
                        )}
                    </div>
                </div>

                {row.notas_cierre && (
                    <p className="rounded-lg bg-muted/50 p-3 text-muted-foreground">
                        {row.notas_cierre}
                    </p>
                )}
            </div>
        </BaseModal>
    );
}

function Detail({
    label,
    value,
    valueClassName,
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div className="rounded-lg border px-3 py-2">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className={cn('font-medium', valueClassName)}>{value}</p>
        </div>
    );
}
