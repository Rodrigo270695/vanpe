import { useForm } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import type { FormEvent } from 'react';
import { ConfigSection } from '@/components/configuracion/config-section';
import { ConfigTabSaveFooter } from '@/components/configuracion/config-tab-save-footer';
import { ServiceHoursSection } from '@/components/configuracion/service-hours-section';
import type { ServiceHourRow } from '@/components/configuracion/types';
import { useTranslations } from '@/hooks/use-translations';

type HoursFormData = {
    service_hours: ServiceHourRow[];
};

type HoursTabProps = {
    serviceHours: ServiceHourRow[];
    canManage: boolean;
};

export function HoursTab({ serviceHours, canManage }: HoursTabProps) {
    const { t } = useTranslations();

    const { data, setData, put, processing, errors } = useForm<HoursFormData>({
        service_hours: serviceHours,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put('/configuracion/hours', { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-5">
            <ConfigSection
                title={t('configuracion.section_hours')}
                description={t('configuracion.section_hours_hint')}
                icon={<Clock className="size-5" />}
                iconClass="bg-violet-100 text-violet-700 ring-violet-200/80"
                headerClass="bg-gradient-to-r from-violet-500/10 via-purple-50/80 to-fuchsia-500/8"
            >
                <ServiceHoursSection
                    hours={data.service_hours}
                    onChange={(hours) => setData('service_hours', hours)}
                    disabled={!canManage}
                    errors={errors as Record<string, string>}
                />
            </ConfigSection>

            <ConfigTabSaveFooter canManage={canManage} processing={processing} />
        </form>
    );
}
