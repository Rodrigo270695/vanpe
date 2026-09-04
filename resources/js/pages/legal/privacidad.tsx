import { Head } from '@inertiajs/react';
import { LegalBody } from '@/components/legal/legal-body';
import { LegalPageHeader } from '@/components/legal/legal-page-header';
import { useTranslations } from '@/hooks/use-translations';

export default function PrivacidadPage() {
    const { t } = useTranslations();

    return (
        <>
            <Head title={t('legal.privacy.title')} />
            <LegalPageHeader
                title={t('legal.privacy.title')}
                updated={t('legal.updated')}
            />
            <LegalBody body={t('legal.privacy.body')} />
        </>
    );
}
