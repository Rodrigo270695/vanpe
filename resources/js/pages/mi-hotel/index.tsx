import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    BedDouble,
    Camera,
    ClipboardList,
    Info,
    Lock,
    MapPin,
    Rocket,
    Save,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { PageHeader } from '@/components/common/page-header';
import {
    ConfigTabs,
    parseTabFromUrl,
    syncTabToUrl,
} from '@/components/configuracion/config-tabs';
import type { ConfigTabItem } from '@/components/configuracion/config-tabs';
import {
    HotelDiagnosisSection,
    HotelGeneralSection,
    HotelLocationSection,
    HotelPhotosSection,
    HotelRoomsSection,
    HotelServicesSection,
} from '@/components/hotels/hotel-form-sections';
import type {
    GeoOption,
    HotelLimits,
    HotelOptions,
    HotelRow,
} from '@/components/hotels/types';
import { useHotelForm } from '@/components/hotels/use-hotel-form';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';
import { translate } from '@/lib/i18n';
import type { TranslationTree } from '@/lib/i18n';
import { notify } from '@/lib/notify';

type MiHotelTabId = 'general' | 'rooms' | 'photos' | 'location' | 'diagnosis';

const TAB_IDS: MiHotelTabId[] = ['general', 'rooms', 'photos', 'location', 'diagnosis'];

const FIELD_TAB: Record<string, MiHotelTabId> = {
    nombre: 'general',
    slug: 'general',
    ruc: 'general',
    resumen: 'general',
    descripcion: 'general',
    direccion: 'general',
    referencia: 'general',
    telefono_reservas: 'general',
    email: 'general',
    website: 'general',
    check_in: 'general',
    check_out: 'general',
    tipos_habitacion: 'rooms',
    precio_desde: 'rooms',
    precio_hasta: 'rooms',
    moneda: 'rooms',
    clasificacion: 'rooms',
    servicios: 'rooms',
    medios_pago: 'rooms',
    cover: 'photos',
    gallery: 'photos',
    remove_media_ids: 'photos',
    departamento_id: 'location',
    provincia_id: 'location',
    distrito_id: 'location',
    latitud: 'location',
    longitud: 'location',
    sistema_reservas: 'diagnosis',
    interes_whatsapp: 'diagnosis',
    redes_sociales: 'diagnosis',
    herramientas_interes: 'diagnosis',
    mayor_reto: 'diagnosis',
    sugerencias: 'diagnosis',
};

function tabsWithErrors(keys: string[]): MiHotelTabId[] {
    const found = new Set(
        keys.map((key) => FIELD_TAB[key.split('.')[0]] ?? 'general'),
    );

    return TAB_IDS.filter((id) => found.has(id));
}

type MiHotelPageProps = {
    hotel: HotelRow;
    departamentos: GeoOption[];
    options: HotelOptions;
    limits: HotelLimits;
    mapbox_token: string | null;
    can: { manage: boolean };
};

export default function MiHotelIndex({
    hotel,
    departamentos,
    options,
    limits,
    mapbox_token,
    can,
}: MiHotelPageProps) {
    const { t } = useTranslations();
    const canManage = can.manage;
    const controller = useHotelForm({
        hotel,
        limits,
        geoBaseUrl: '/mi-hotel',
        strict: 'publish',
    });
    const { form, clientErrors, fillFromHotel, loadGeoFor, validateBeforeSubmit } =
        controller;

    const [activeTab, setActiveTab] = useState<MiHotelTabId>(() =>
        parseTabFromUrl(TAB_IDS, 'general'),
    );

    useEffect(() => {
        void loadGeoFor(hotel);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isDirtyRef = useRef(form.isDirty);
    const bypassLeaveGuardRef = useRef(false);
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const pendingLeaveRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        isDirtyRef.current = form.isDirty;
    }, [form.isDirty]);

    useEffect(() => {
        if (!canManage) {
            return;
        }

        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!isDirtyRef.current || bypassLeaveGuardRef.current) {
                return;
            }

            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', onBeforeUnload);

        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [canManage]);

    useEffect(() => {
        if (!canManage) {
            return;
        }

        return router.on('before', (event) => {
            if (!isDirtyRef.current || bypassLeaveGuardRef.current) {
                return;
            }

            const visit = event.detail.visit;

            if (visit.method !== 'get') {
                return;
            }

            try {
                const next = new URL(String(visit.url), window.location.origin);

                if (next.pathname === window.location.pathname) {
                    return;
                }
            } catch {
                // URL inválida: se trata como salida.
            }

            event.preventDefault();
            pendingLeaveRef.current = () => {
                bypassLeaveGuardRef.current = true;
                router.visit(visit.url, {
                    method: visit.method,
                    data: visit.data,
                    replace: visit.replace,
                    preserveScroll: visit.preserveScroll,
                    preserveState: visit.preserveState,
                });
            };
            setLeaveModalOpen(true);
        });
    }, [canManage]);

    const tabs = useMemo<ConfigTabItem<MiHotelTabId>[]>(
        () => [
            { id: 'general', label: t('mi_hotel.tab_general'), icon: Info },
            { id: 'rooms', label: t('mi_hotel.tab_rooms'), icon: BedDouble },
            { id: 'photos', label: t('mi_hotel.tab_photos'), icon: Camera },
            { id: 'location', label: t('mi_hotel.tab_location'), icon: MapPin },
            {
                id: 'diagnosis',
                label: t('mi_hotel.tab_diagnosis'),
                icon: ClipboardList,
            },
        ],
        [t],
    );

    const handleTabChange = (tab: MiHotelTabId) => {
        setActiveTab(tab);
        syncTabToUrl(tab);
    };

    const reportErrors = (keys: string[]) => {
        const errorTabs = tabsWithErrors(keys);

        if (errorTabs.length === 0) {
            return;
        }

        if (!errorTabs.includes(activeTab)) {
            handleTabChange(errorTabs[0]);
        }

        notify.error(
            t('mi_hotel.errors_in_tabs', {
                tabs: errorTabs
                    .map((id) => tabs.find((tab) => tab.id === id)?.label ?? id)
                    .join(', '),
            }),
        );
    };

    const submit = () => {
        if (!validateBeforeSubmit()) {
            reportErrors(Object.keys(clientErrors));

            return;
        }

        bypassLeaveGuardRef.current = true;
        form.transform((payload) => payload);
        form.post('/mi-hotel', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: (page) => {
                fillFromHotel((page.props as unknown as MiHotelPageProps).hotel);
            },
            onError: (errors) => reportErrors(Object.keys(errors)),
            onFinish: () => {
                bypassLeaveGuardRef.current = false;
            },
        });
    };

    const confirmLeaveWithoutSaving = () => {
        const proceed = pendingLeaveRef.current;
        pendingLeaveRef.current = null;
        setLeaveModalOpen(false);
        proceed?.();
    };

    const cancelLeave = () => {
        pendingLeaveRef.current = null;
        setLeaveModalOpen(false);
    };

    const estado = form.data.estado;
    const statusColor =
        estado === 'publicado'
            ? ('green' as const)
            : estado === 'pausado'
              ? ('yellow' as const)
              : ('blue' as const);
    const photosReady =
        controller.photos.totalPhotos >= limits.min_photos_to_publish;

    return (
        <>
            <Head title={t('mi_hotel.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('mi_hotel.title')}
                    description={t('mi_hotel.description')}
                    badges={[
                        {
                            label: t('mi_hotel.badge_status'),
                            value: t(`hotels.estado_${estado}`),
                            color: statusColor,
                            icon: Rocket,
                        },
                        {
                            label: t('mi_hotel.badge_photos'),
                            value: `${controller.photos.totalPhotos}/${limits.min_photos_to_publish}`,
                            color: photosReady ? 'green' : 'orange',
                            icon: Camera,
                        },
                    ]}
                />

                {canManage ? (
                    <p className="text-[12px] text-muted-foreground">
                        {t('mi_hotel.draft_hint')}
                    </p>
                ) : (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <Lock className="mt-0.5 size-4 shrink-0" />
                        <p>{t('mi_hotel.readonly_hint')}</p>
                    </div>
                )}

                <ConfigTabs<MiHotelTabId>
                    tabs={tabs}
                    value={activeTab}
                    onChange={handleTabChange}
                />

                <fieldset disabled={!canManage} className="min-w-0 space-y-6">
                    {activeTab === 'general' && (
                        <HotelGeneralSection controller={controller} />
                    )}
                    {activeTab === 'rooms' && (
                        <>
                            <HotelRoomsSection controller={controller} options={options} />
                            <HotelServicesSection
                                controller={controller}
                                options={options}
                            />
                        </>
                    )}
                    {activeTab === 'photos' && (
                        <HotelPhotosSection controller={controller} limits={limits} />
                    )}
                    {activeTab === 'location' && (
                        <HotelLocationSection
                            controller={controller}
                            departamentos={departamentos}
                            mapboxToken={mapbox_token}
                        />
                    )}
                    {activeTab === 'diagnosis' && (
                        <HotelDiagnosisSection controller={controller} options={options} />
                    )}
                </fieldset>

                {canManage && (
                    <div className="flex justify-end border-t border-border pt-4">
                        <Button
                            onClick={submit}
                            disabled={form.processing || form.data.nombre.trim() === ''}
                            className="gap-2"
                        >
                            <Save className="size-4" />
                            {t('mi_hotel.save')}
                        </Button>
                    </div>
                )}
            </div>

            <BaseModal
                open={leaveModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        cancelLeave();
                    }
                }}
                title={t('mi_hotel.leave_title')}
                description={t('mi_hotel.leave_description')}
                icon={AlertTriangle}
                iconClassName="bg-amber-100 text-amber-700 ring-amber-200"
                submitLabel={t('mi_hotel.leave_confirm')}
                cancelLabel={t('mi_hotel.leave_cancel')}
                submitVariant="destructive"
                onSubmit={confirmLeaveWithoutSaving}
                size="sm"
            >
                {null}
            </BaseModal>
        </>
    );
}

MiHotelIndex.layout = (props: { translations: TranslationTree }) => ({
    breadcrumbs: [
        {
            title: translate(props.translations, 'mi_hotel.title'),
            href: '/mi-hotel',
        },
    ],
});
