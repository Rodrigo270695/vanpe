import { useForm } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { ConfigSection } from '@/components/configuracion/config-section';
import { ConfigTabSaveFooter } from '@/components/configuracion/config-tab-save-footer';
import type { ConfigSettings } from '@/components/configuracion/types';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type PublicationFormData = {
    auto_publish: boolean;
};

type PublicationTabProps = {
    settings: ConfigSettings;
    canManage: boolean;
};

export function PublicationTab({ settings, canManage }: PublicationTabProps) {
    const { t } = useTranslations();

    const { data, setData, put, processing } = useForm<PublicationFormData>({
        auto_publish: settings.auto_publish,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put('/configuracion/publication', { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-5">
            <ConfigSection
                title={t('configuracion.section_publication')}
                description={t('configuracion.section_publication_hint')}
                icon={<Building2 className="size-5" />}
                iconClass="bg-violet-100 text-violet-700 ring-violet-200/80"
                headerClass="bg-gradient-to-r from-violet-500/10 via-purple-50/80 to-fuchsia-500/8"
            >
                <label
                    className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors sm:col-span-2',
                        data.auto_publish
                            ? 'border-violet-300/60 bg-violet-50/60'
                            : 'border-border bg-card',
                        !canManage && 'cursor-default opacity-70',
                    )}
                >
                    <Checkbox
                        checked={data.auto_publish}
                        onCheckedChange={(v) =>
                            setData('auto_publish', v === true)
                        }
                        disabled={!canManage}
                        className="mt-0.5"
                    />
                    <span className="block text-sm font-medium">
                        {t('configuracion.field_auto_publish')}
                    </span>
                </label>
            </ConfigSection>

            <ConfigTabSaveFooter canManage={canManage} processing={processing} />
        </form>
    );
}
