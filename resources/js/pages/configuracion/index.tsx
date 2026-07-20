import { Head } from '@inertiajs/react';
import {
    Building2,
    CalendarClock,
    Camera,
    Clock,
    Globe,
    MapPinned,
    Receipt,
    Smartphone,
    Store,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import {
    ConfigTabs,
    parseConfigTabFromUrl,
    syncConfigTabToUrl,
    type ConfigTabId,
} from '@/components/configuracion/config-tabs';
import type {
    ConfigAbilities,
    ConfigCatalog,
    ConfigProfile,
    ConfigSettings,
    ConfigVenue,
    FelSerieRow,
    ServiceHourRow,
} from '@/components/configuracion/types';
import { BillingTab } from '@/components/configuracion/tabs/billing-tab';
import { GeneralTab } from '@/components/configuracion/tabs/general-tab';
import { HoursTab } from '@/components/configuracion/tabs/hours-tab';
import { ImagesTab } from '@/components/configuracion/tabs/images-tab';
import { PublicationTab } from '@/components/configuracion/tabs/publication-tab';
import { ReservationsTab } from '@/components/configuracion/tabs/reservations-tab';
import { TouristTab } from '@/components/configuracion/tabs/tourist-tab';
import { useTranslations } from '@/hooks/use-translations';
import { translate, type TranslationTree } from '@/lib/i18n';

type ConfiguracionPageProps = {
    profile: ConfigProfile;
    venue: ConfigVenue;
    settings: ConfigSettings;
    service_hours: ServiceHourRow[];
    catalog: ConfigCatalog;
    fel_series: FelSerieRow[];
    can: ConfigAbilities;
};

export default function ConfiguracionIndex({
    profile,
    venue,
    settings,
    service_hours,
    catalog,
    fel_series,
    can,
}: ConfiguracionPageProps) {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState<ConfigTabId>(parseConfigTabFromUrl);

    const tabs = useMemo(
        () => [
            {
                id: 'general' as const,
                label: t('configuracion.tab_general'),
                icon: Store,
            },
            {
                id: 'images' as const,
                label: t('configuracion.tab_images'),
                icon: Camera,
            },
            {
                id: 'tourist' as const,
                label: t('configuracion.tab_tourist'),
                icon: MapPinned,
            },
            {
                id: 'billing' as const,
                label: t('configuracion.tab_billing'),
                icon: Receipt,
            },
            {
                id: 'hours' as const,
                label: t('configuracion.tab_hours'),
                icon: Clock,
            },
            {
                id: 'reservations' as const,
                label: t('configuracion.tab_reservations'),
                icon: CalendarClock,
            },
            {
                id: 'publication' as const,
                label: t('configuracion.tab_publication'),
                icon: Building2,
            },
        ],
        [t],
    );

    const handleTabChange = (tab: ConfigTabId) => {
        setActiveTab(tab);
        syncConfigTabToUrl(tab);
    };

    return (
        <>
            <Head title={t('configuracion.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('configuracion.title')}
                    description={t('configuracion.description')}
                    badges={[
                        {
                            label: t('configuracion.badge_subdomain'),
                            value: profile.slug,
                            color: 'blue',
                            icon: Globe,
                        },
                        {
                            label: t('configuracion.badge_receipts'),
                            value: settings.issues_electronic_receipts
                                ? t('configuracion.receipts_yes')
                                : t('configuracion.receipts_no'),
                            color: settings.issues_electronic_receipts
                                ? 'yellow'
                                : 'gray',
                            icon: Receipt,
                        },
                        {
                            label: t('configuracion.badge_reservations'),
                            value: settings.reservations_enabled
                                ? t('configuracion.enabled')
                                : t('configuracion.disabled'),
                            color: settings.reservations_enabled
                                ? 'green'
                                : 'gray',
                            icon: CalendarClock,
                        },
                        {
                            label: t('configuracion.badge_publish'),
                            value: settings.auto_publish
                                ? t('configuracion.auto')
                                : t('configuracion.manual'),
                            color: settings.auto_publish ? 'purple' : 'gray',
                            icon: Smartphone,
                        },
                    ]}
                />

                <ConfigTabs
                    tabs={tabs}
                    value={activeTab}
                    onChange={handleTabChange}
                />

                {activeTab === 'general' && (
                    <GeneralTab profile={profile} canManage={can.manage} />
                )}

                {activeTab === 'images' && (
                    <ImagesTab
                        profile={profile}
                        venue={venue}
                        canManage={can.manage}
                    />
                )}

                {activeTab === 'tourist' && (
                    <TouristTab catalog={catalog} canManage={can.manage} />
                )}

                {activeTab === 'billing' && (
                    <BillingTab
                        settings={settings}
                        felSeries={fel_series}
                        canManage={can.manage}
                        canInvoicing={can.invoicing ?? false}
                    />
                )}

                {activeTab === 'hours' && (
                    <HoursTab
                        serviceHours={service_hours}
                        canManage={can.manage}
                    />
                )}

                {activeTab === 'reservations' && (
                    <ReservationsTab
                        settings={settings}
                        canManage={can.manage}
                    />
                )}

                {activeTab === 'publication' && (
                    <PublicationTab
                        settings={settings}
                        canManage={can.manage}
                    />
                )}
            </div>
        </>
    );
}

ConfiguracionIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(
                props.translations as TranslationTree,
                'configuracion.title',
            ),
            href: '/configuracion',
        },
    ],
});
