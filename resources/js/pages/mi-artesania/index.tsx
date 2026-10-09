import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Camera,
    Info,
    Lock,
    MapPin,
    Rocket,
    Save,
    Share2,
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
    CraftGeneralSection,
    CraftLocationSection,
    CraftPhotosSection,
    CraftPublishSection,
    CraftSocialSection,
} from '@/components/crafts/craft-form-sections';
import type { CraftLimits, CraftOptions, CraftRow } from '@/components/crafts/types';
import { craftPayload, useCraftForm } from '@/components/crafts/use-craft-form';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';
import { translate } from '@/lib/i18n';
import type { TranslationTree } from '@/lib/i18n';
import { notify } from '@/lib/notify';

type MiArtesaniaTabId = 'general' | 'photos' | 'social' | 'location' | 'publication';

const TAB_IDS: MiArtesaniaTabId[] = [
    'general',
    'photos',
    'social',
    'location',
    'publication',
];

const FIELD_TAB: Record<string, MiArtesaniaTabId> = {
    nombre: 'general',
    slug: 'general',
    descripcion: 'general',
    telefono_contacto: 'general',
    photos: 'photos',
    remove_media_ids: 'photos',
    redes_sociales: 'social',
    latitud: 'location',
    longitud: 'location',
    estado: 'publication',
};

function tabsWithErrors(keys: string[]): MiArtesaniaTabId[] {
    const found = new Set(
        keys.map((key) => FIELD_TAB[key.split('.')[0]] ?? 'general'),
    );

    return TAB_IDS.filter((id) => found.has(id));
}

type MiArtesaniaPageProps = {
    craft: CraftRow;
    options: CraftOptions;
    limits: CraftLimits;
    mapbox_token: string | null;
    can: { manage: boolean; publish: boolean };
};

export default function MiArtesaniaIndex({
    craft,
    options,
    limits,
    mapbox_token,
    can,
}: MiArtesaniaPageProps) {
    const { t } = useTranslations();
    const canManage = can.manage;
    const controller = useCraftForm({ craft, options, limits, strict: 'publish' });
    const { form, clientErrors, fillFromCraft, validateBeforeSubmit } = controller;

    const [activeTab, setActiveTab] = useState<MiArtesaniaTabId>(() =>
        parseTabFromUrl(TAB_IDS, 'general'),
    );

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

    const tabs = useMemo<ConfigTabItem<MiArtesaniaTabId>[]>(
        () => [
            { id: 'general', label: t('mi_artesania.tab_general'), icon: Info },
            { id: 'photos', label: t('mi_artesania.tab_photos'), icon: Camera },
            { id: 'social', label: t('mi_artesania.tab_social'), icon: Share2 },
            { id: 'location', label: t('mi_artesania.tab_location'), icon: MapPin },
            {
                id: 'publication',
                label: t('mi_artesania.tab_publication'),
                icon: Rocket,
            },
        ],
        [t],
    );

    const handleTabChange = (tab: MiArtesaniaTabId) => {
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
            t('mi_artesania.errors_in_tabs', {
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
        form.transform((payload) => craftPayload(payload));
        form.post('/mi-artesania', {
            preserveScroll: true,
            forceFormData: true,
            queryStringArrayFormat: 'indices',
            onSuccess: (page) => {
                fillFromCraft((page.props as unknown as MiArtesaniaPageProps).craft);
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

    const availableEstados =
        can.publish || craft.estado === 'publicado'
            ? options.estados
            : options.estados.filter((e) => e !== 'publicado');

    const estado = form.data.estado;
    const statusColor =
        estado === 'publicado'
            ? ('green' as const)
            : estado === 'pausado'
              ? ('yellow' as const)
              : ('blue' as const);
    const photoCount = form.data.photos.length;

    return (
        <>
            <Head title={t('mi_artesania.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('mi_artesania.title')}
                    description={t('mi_artesania.description')}
                    badges={[
                        {
                            label: t('mi_artesania.badge_status'),
                            value: t(`crafts.estado_${estado}`),
                            color: statusColor,
                            icon: Rocket,
                        },
                        {
                            label: t('mi_artesania.badge_photos'),
                            value: `${photoCount}/${limits.max_photos}`,
                            color:
                                photoCount >= limits.min_photos_to_publish
                                    ? 'green'
                                    : 'orange',
                            icon: Camera,
                        },
                    ]}
                />

                {canManage ? (
                    <p className="text-[12px] text-muted-foreground">
                        {t('mi_artesania.draft_hint')}
                    </p>
                ) : (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <Lock className="mt-0.5 size-4 shrink-0" />
                        <p>{t('mi_artesania.readonly_hint')}</p>
                    </div>
                )}

                <ConfigTabs<MiArtesaniaTabId>
                    tabs={tabs}
                    value={activeTab}
                    onChange={handleTabChange}
                />

                <fieldset disabled={!canManage} className="min-w-0 space-y-6">
                    {activeTab === 'general' && (
                        <CraftGeneralSection controller={controller} />
                    )}
                    {activeTab === 'photos' && (
                        <CraftPhotosSection controller={controller} limits={limits} />
                    )}
                    {activeTab === 'social' && (
                        <CraftSocialSection controller={controller} options={options} />
                    )}
                    {activeTab === 'location' && (
                        <CraftLocationSection
                            controller={controller}
                            mapboxToken={mapbox_token}
                        />
                    )}
                    {activeTab === 'publication' && (
                        <CraftPublishSection
                            controller={controller}
                            estados={availableEstados}
                            showFeatured={false}
                            hint={
                                can.publish
                                    ? t('mi_artesania.publish_hint', {
                                          min: limits.min_photos_to_publish,
                                      })
                                    : t('mi_artesania.publish_locked_hint')
                            }
                        />
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
                            {t('mi_artesania.save')}
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
                title={t('mi_artesania.leave_title')}
                description={t('mi_artesania.leave_description')}
                icon={AlertTriangle}
                iconClassName="bg-amber-100 text-amber-700 ring-amber-200"
                submitLabel={t('mi_artesania.leave_confirm')}
                cancelLabel={t('mi_artesania.leave_cancel')}
                submitVariant="destructive"
                onSubmit={confirmLeaveWithoutSaving}
                size="sm"
            >
                {null}
            </BaseModal>
        </>
    );
}

MiArtesaniaIndex.layout = (props: { translations: TranslationTree }) => ({
    breadcrumbs: [
        {
            title: translate(props.translations, 'mi_artesania.title'),
            href: '/mi-artesania',
        },
    ],
});
