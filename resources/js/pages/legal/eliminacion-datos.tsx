import { Head } from '@inertiajs/react';
import { LegalBody } from '@/components/legal/legal-body';
import { useTranslations } from '@/hooks/use-translations';

export default function EliminacionDatosPage() {
    const { t } = useTranslations();

    return (
        <>
            <Head title={t('legal.deletion.title')} />
            <header className="mb-8 border-b border-border/50 pb-6">
                <p className="text-xs font-medium tracking-wide text-brand-blue uppercase dark:text-brand-blue-light">
                    VanPe · Perú
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    {t('legal.deletion.title')}
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                    {t('legal.updated')}
                </p>
            </header>
            <LegalBody body={t('legal.deletion.body')} />
        </>
    );
}
