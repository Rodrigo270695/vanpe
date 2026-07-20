import { Head, router } from '@inertiajs/react';
import { FileText, Layers, Plus } from 'lucide-react';
import { useState } from 'react';
import { FelSeriesSection } from '@/components/configuracion/fel-series-section';
import type { FelSerieRow } from '@/components/configuracion/types';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';
import { translate, type TranslationTree } from '@/lib/i18n';

type TipoOption = {
    value: number;
    label: string;
    hint: string;
};

type FacturacionSeriesPageProps = {
    series: FelSerieRow[];
    tipos: TipoOption[];
};

export default function FacturacionSeriesIndex({
    series,
}: FacturacionSeriesPageProps) {
    const { t } = useTranslations();
    const [showHint, setShowHint] = useState(false);

    const activas = series.filter((s) => s.activo).length;

    return (
        <>
            <Head title={t('fel.series_page_title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('fel.series_page_title')}
                    description={t('fel.series_page_description')}
                    badges={[
                        {
                            label: t('fel.series_total'),
                            value: String(series.length),
                            color: 'blue',
                            icon: Layers,
                        },
                        {
                            label: t('fel.series_active_count'),
                            value: String(activas),
                            color: activas > 0 ? 'green' : 'gray',
                            icon: FileText,
                        },
                    ]}
                >
                    <Button
                        size="sm"
                        className="gap-2 bg-violet-600 text-white shadow-sm hover:bg-violet-700"
                        onClick={() => router.visit('/configuracion?tab=billing')}
                    >
                        <Plus className="size-4" />
                        {t('fel.go_billing_settings')}
                    </Button>
                </PageHeader>

                <FelSeriesSection series={series} canManage />

                <button
                    type="button"
                    onClick={() => setShowHint((v) => !v)}
                    className="text-left text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                    {t('fel.series_sunat_naming')}
                </button>
                {showHint ? (
                    <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                        {t('fel.series_sunat_naming_detail')}
                    </p>
                ) : null}
            </div>
        </>
    );
}

FacturacionSeriesIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(props.translations as TranslationTree, 'nav.facturacion'),
            href: '/facturacion/documentos',
        },
        {
            title: translate(props.translations as TranslationTree, 'fel.series_page_title'),
            href: '/facturacion/series',
        },
    ],
});
