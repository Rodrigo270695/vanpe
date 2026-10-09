import { Palette } from 'lucide-react';
import { useEffect } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import {
    CraftGeneralSection,
    CraftLocationSection,
    CraftPhotosSection,
    CraftPublishSection,
    CraftSocialSection,
} from '@/components/crafts/craft-form-sections';
import type { CraftLimits, CraftOptions, CraftRow } from '@/components/crafts/types';
import {
    craftPayload,
    craftToFormData,
    useCraftForm,
} from '@/components/crafts/use-craft-form';
import { useTranslations } from '@/hooks/use-translations';

type CraftFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    craft: CraftRow | null;
    options: CraftOptions;
    limits: CraftLimits;
    canPublish: boolean;
    mapboxToken: string | null;
};

export function CraftFormModal({
    open,
    onOpenChange,
    craft,
    options,
    limits,
    canPublish,
    mapboxToken,
}: CraftFormModalProps) {
    const { t } = useTranslations();
    const isEditing = craft !== null;
    const controller = useCraftForm({ craft, options, limits, strict: 'always' });
    const { form, resetForm, validateBeforeSubmit } = controller;

    useEffect(() => {
        if (!open) {
            return;
        }

        resetForm();

        if (craft) {
            form.setData(craftToFormData(craft, options));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, craft]);

    const submit = () => {
        if (!validateBeforeSubmit()) {
            return;
        }

        const requestOptions = {
            preserveScroll: true,
            forceFormData: true,
            queryStringArrayFormat: 'indices' as const,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            form.transform((payload) => ({ ...craftPayload(payload), _method: 'put' }));
            form.post(`/artesanias/${craft.id}`, requestOptions);

            return;
        }

        form.transform((payload) => craftPayload(payload));
        form.post('/artesanias', requestOptions);
    };

    const availableEstados =
        canPublish || craft?.estado === 'publicado'
            ? options.estados
            : options.estados.filter((e) => e !== 'publicado');

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? t('crafts.edit_title') : t('crafts.create_title')}
            description={t('crafts.form_hint', { min: limits.min_photos_to_publish })}
            icon={Palette}
            submitLabel={isEditing ? t('table.save_changes') : t('crafts.create_submit')}
            onSubmit={submit}
            canSubmit={form.data.nombre.trim().length > 0}
            submitting={form.processing}
            size="xl"
            contentClassName="sm:max-w-4xl"
            onAfterClose={resetForm}
        >
            <div className="space-y-6">
                <CraftGeneralSection controller={controller} />
                <CraftPhotosSection controller={controller} limits={limits} />
                <CraftSocialSection controller={controller} options={options} />
                <CraftLocationSection controller={controller} mapboxToken={mapboxToken} />
                <CraftPublishSection
                    controller={controller}
                    estados={availableEstados}
                    showFeatured
                />
            </div>
        </BaseModal>
    );
}
