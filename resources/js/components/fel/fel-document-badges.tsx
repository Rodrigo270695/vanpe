import type { FelDocumentSummary } from '@/components/fel/types';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type FelDocumentBadgesProps = {
    document: FelDocumentSummary;
    compact?: boolean;
    className?: string;
};

export function FelDocumentBadges({
    document,
    compact = false,
    className,
}: FelDocumentBadgesProps) {
    const { t } = useTranslations();

    const modeTone =
        document.apisunat_mode === 'produccion'
            ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200'
            : document.apisunat_mode === 'sandbox'
              ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
              : 'border-slate-200 bg-slate-50 text-slate-600';

    const sunatEstado = document.sunat_estado;
    const sunatTone =
        sunatEstado === 'aceptado'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
            : sunatEstado === 'rechazado'
              ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
              : 'border-slate-200 bg-slate-50 text-slate-600';

    return (
        <div className={cn('flex flex-wrap gap-1', className)}>
            {document.apisunat_mode ? (
                <Badge variant="outline" className={cn(compact && 'text-[10px]', modeTone)}>
                    {document.apisunat_mode === 'produccion'
                        ? t('fel.mode_production_short')
                        : t('fel.mode_sandbox_short')}
                </Badge>
            ) : null}
            {sunatEstado ? (
                <Badge variant="outline" className={cn(compact && 'text-[10px]', sunatTone)}>
                    {t(`fel.sunat_${sunatEstado}` as 'fel.sunat_aceptado')}
                </Badge>
            ) : document.estado === 'emitido' ? (
                <Badge
                    variant="outline"
                    className={cn(
                        compact && 'text-[10px]',
                        'border-emerald-200 bg-emerald-50 text-emerald-800',
                    )}
                >
                    {t('fel.status_emitido')}
                </Badge>
            ) : null}
        </div>
    );
}
