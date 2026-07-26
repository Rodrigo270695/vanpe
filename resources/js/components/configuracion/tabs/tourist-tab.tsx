import { useForm } from '@inertiajs/react';
import { MapPinned } from 'lucide-react';
import type { FormEvent } from 'react';
import { ConfigSection } from '@/components/configuracion/config-section';
import { ConfigTabSaveFooter } from '@/components/configuracion/config-tab-save-footer';
import { TouristProfileSection } from '@/components/configuracion/tourist-profile-section';
import type { ConfigCatalog } from '@/components/configuracion/types';
import { useTranslations } from '@/hooks/use-translations';

type TouristFormData = {
    catalog_selection_ids: string[];
};

type TouristTabProps = {
    catalog: ConfigCatalog;
    canManage: boolean;
};

export function TouristTab({ catalog, canManage }: TouristTabProps) {
    const { t } = useTranslations();

    const { data, setData, put, processing } = useForm<TouristFormData>({
        catalog_selection_ids: catalog.selection_ids,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put('/configuracion/tourist', { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-5">
            <ConfigSection
                title={t('configuracion.section_tourist_profile')}
                description={t('configuracion.section_tourist_profile_hint')}
                icon={<MapPinned className="size-5" />}
                iconClass="bg-indigo-100 text-indigo-700 ring-indigo-200/80 dark:bg-indigo-500/20 dark:text-indigo-300 dark:ring-indigo-400/30"
                headerClass="bg-gradient-to-r from-indigo-500/10 via-violet-50/80 to-sky-500/8 dark:from-indigo-500/15 dark:via-violet-500/10 dark:to-sky-500/10"
            >
                <TouristProfileSection
                    options={catalog.options}
                    selectionIds={data.catalog_selection_ids}
                    typeLabels={catalog.type_labels}
                    proposals={catalog.proposals}
                    disabled={!canManage}
                    onSelectionChange={(ids) =>
                        setData('catalog_selection_ids', ids)
                    }
                />
            </ConfigSection>

            <ConfigTabSaveFooter canManage={canManage} processing={processing} />
        </form>
    );
}
