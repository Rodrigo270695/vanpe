import { Head } from '@inertiajs/react';
import { LegalBody } from '@/components/legal/legal-body';
import { LegalPageHeader } from '@/components/legal/legal-page-header';
import { useTranslations } from '@/hooks/use-translations';

export default function CookiesPage() {
    const { t } = useTranslations();

    return (
        <>
            <Head title={t('legal.cookies.title')} />
            <LegalPageHeader
                title={t('legal.cookies.title')}
                updated={t('legal.updated')}
            />
            <LegalBody body={t('legal.cookies.body')} />
        </>
    );
}
