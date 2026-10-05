import { BedDouble } from 'lucide-react';
import { useEffect } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import {
    HotelDiagnosisSection,
    HotelGeneralSection,
    HotelLocationSection,
    HotelPhotosSection,
    HotelPublishSection,
    HotelRoomsSection,
    HotelServicesSection,
} from '@/components/hotels/hotel-form-sections';
import type {
    GeoOption,
    HotelLimits,
    HotelOptions,
    HotelRow,
} from '@/components/hotels/types';
import { hotelToFormData, useHotelForm } from '@/components/hotels/use-hotel-form';
import { useTranslations } from '@/hooks/use-translations';

type HotelFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hotel: HotelRow | null;
    departamentos: GeoOption[];
    options: HotelOptions;
    limits: HotelLimits;
    canPublish: boolean;
    mapboxToken: string | null;
};

export function HotelFormModal({
    open,
    onOpenChange,
    hotel,
    departamentos,
    options,
    limits,
    canPublish,
    mapboxToken,
}: HotelFormModalProps) {
    const { t } = useTranslations();
    const isEditing = hotel !== null;
    const controller = useHotelForm({
        hotel,
        limits,
        geoBaseUrl: '/hoteles',
        strict: 'always',
    });
    const { form, resetForm, loadGeoFor, validateBeforeSubmit } = controller;

    useEffect(() => {
        if (!open) {
            return;
        }

         
        resetForm();

        if (hotel) {
            form.setData(hotelToFormData(hotel));
            void loadGeoFor(hotel);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, hotel]);

    const submit = () => {
        if (!validateBeforeSubmit()) {
            return;
        }

        const requestOptions = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            form.transform((payload) => ({ ...payload, _method: 'put' }));
            form.post(`/hoteles/${hotel.id}`, requestOptions);

            return;
        }

        form.transform((payload) => payload);
        form.post('/hoteles', requestOptions);
    };

    const availableEstados = canPublish
        ? options.estados
        : options.estados.filter((e) => e !== 'publicado');

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? t('hotels.edit_title') : t('hotels.create_title')}
            description={t('hotels.form_hint', {
                min: limits.min_photos_to_publish,
            })}
            icon={BedDouble}
            submitLabel={
                isEditing ? t('table.save_changes') : t('hotels.create_submit')
            }
            onSubmit={submit}
            canSubmit={form.data.nombre.trim().length > 0}
            submitting={form.processing}
            size="xl"
            contentClassName="sm:max-w-4xl"
            onAfterClose={resetForm}
        >
            <div className="space-y-6">
                <HotelGeneralSection controller={controller} />
                <HotelRoomsSection controller={controller} options={options} />
                <HotelServicesSection controller={controller} options={options} />
                <HotelPhotosSection controller={controller} limits={limits} />
                <HotelLocationSection
                    controller={controller}
                    departamentos={departamentos}
                    mapboxToken={mapboxToken}
                />
                <HotelDiagnosisSection controller={controller} options={options} />
                <HotelPublishSection
                    controller={controller}
                    estados={availableEstados}
                    showFeatured
                />
            </div>
        </BaseModal>
    );
}
