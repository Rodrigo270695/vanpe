import { Head } from '@inertiajs/react';
import { LegalBody } from '@/components/legal/legal-body';
import { LegalPageHeader } from '@/components/legal/legal-page-header';
import { useTranslations } from '@/hooks/use-translations';

export default function EliminacionDatosPage() {
    const { t } = useTranslations();

    return (
        <>
            <Head title={t('legal.deletion.title')} />
            <LegalPageHeader
                title={t('legal.deletion.title')}
                updated={t('legal.updated')}
            />
            <LegalBody body={t('legal.deletion.body')} />
        </>
    );
}
