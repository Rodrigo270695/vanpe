import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { useTranslations } from '@/hooks/use-translations';
import { translate, type TranslationTree } from '@/lib/i18n';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    const { t } = useTranslations();

    return (
        <>
            <Head title={t('settings.appearance.page_title')} />

            <h1 className="sr-only">{t('settings.appearance.page_title')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('settings.appearance.page_title')}
                    description={t('settings.appearance.description')}
                />
                <AppearanceTabs />
            </div>
        </>
    );
}

Appearance.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(
                props.translations as TranslationTree,
                'settings.appearance.breadcrumb',
            ),
            href: editAppearance(),
        },
    ],
});
