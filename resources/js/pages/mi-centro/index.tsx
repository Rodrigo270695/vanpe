import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Camera,
    Clock,
    ImagePlus,
    Info,
    Lock,
    MapPin,
    Rocket,
    Save,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { CreatableCombobox } from '@/components/common/creatable-combobox';
import { CreatableMultiCombobox } from '@/components/common/creatable-multi-combobox';
import { FormField } from '@/components/common/form-field';
import { ImageUploadField } from '@/components/common/image-upload-field';
import { PageHeader } from '@/components/common/page-header';
import {
    ConfigTabs,
    parseTabFromUrl,
    syncTabToUrl,
} from '@/components/configuracion/config-tabs';
import type { ConfigTabItem } from '@/components/configuracion/config-tabs';
import { LocationMapPicker } from '@/components/configuracion/location-map-picker';
import { ServiceHoursSection } from '@/components/configuracion/service-hours-section';
import type { ServiceHourRow } from '@/components/configuracion/types';
import type {
    CatalogOption,
    GeoOption,
    TourCategoryOption,
    TourSpotHourRow,
    TourSpotMediaRow,
    TourSpotRow,
} from '@/components/tour-spots/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslations } from '@/hooks/use-translations';
import { getCsrfToken } from '@/lib/csrf';
import { translate } from '@/lib/i18n';
import type { TranslationTree } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';

type MiCentroTabId =
    'identity' | 'photos' | 'location' | 'access' | 'hours' | 'publication';

const TAB_IDS: MiCentroTabId[] = [
    'identity',
    'photos',
    'location',
    'access',
    'hours',
    'publication',
];

type MiCentroAbilities = {
    manage: boolean;
    publish: boolean;
};

type MiCentroPageProps = {
    spot: TourSpotRow;
    categories: TourCategoryOption[];
    accessModes: CatalogOption[];
    roadTypes: CatalogOption[];
    inclusions: CatalogOption[];
    departamentos: GeoOption[];
    defaultHours: TourSpotHourRow[];
    estados: string[];
    dificultades: string[];
    estacionamientos: string[];
    mapbox_token: string | null;
    can: MiCentroAbilities;
};

type GeoListResponse = { data: GeoOption[] };

const MAX_GALLERY = 8;

function tipsToText(tips: TourSpotRow['tips']): string {
    if (!tips) {
        return '';
    }

    if (Array.isArray(tips)) {
        return tips.join('\n');
    }

    return (tips.es ?? []).join('\n');
}

function SectionTitle({ children }: { children: string }) {
    return (
        <h3 className="border-b border-border/80 pb-2 text-sm font-semibold text-brand-blue">
            {children}
        </h3>
    );
}

export default function MiCentroIndex({
    spot,
    categories: initialCategories,
    accessModes: initialAccessModes,
    roadTypes: initialRoadTypes,
    inclusions: initialInclusions,
    departamentos,
    defaultHours,
    estados,
    dificultades,
    estacionamientos,
    mapbox_token,
    can,
}: MiCentroPageProps) {
    const { t } = useTranslations();
    const canManage = can.manage;
    const canPublish = can.publish;
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const [categories, setCategories] = useState(initialCategories);
    const [accessModes, setAccessModes] = useState(initialAccessModes);
    const [roadTypes, setRoadTypes] = useState(initialRoadTypes);
    const [inclusions, setInclusions] = useState(initialInclusions);

    useEffect(() => setCategories(initialCategories), [initialCategories]);
    useEffect(() => setAccessModes(initialAccessModes), [initialAccessModes]);
    useEffect(() => setRoadTypes(initialRoadTypes), [initialRoadTypes]);
    useEffect(() => setInclusions(initialInclusions), [initialInclusions]);

    const [activeTab, setActiveTab] = useState<MiCentroTabId>(() =>
        parseTabFromUrl(TAB_IDS, 'identity'),
    );

    const [provincias, setProvincias] = useState<GeoOption[]>([]);
    const [distritos, setDistritos] = useState<GeoOption[]>([]);
    const [loadingGeo, setLoadingGeo] = useState(false);
    // Derivados directamente del prop: Inertia entrega un `spot` fresco tras cada guardado.
    const existingCoverUrl: string | null = spot.imagen_portada_url;
    const existingMedia: TourSpotMediaRow[] = spot.media ?? [];
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    const { data, setData, post, processing, errors, transform, isDirty } =
        useForm({
        nombre: spot.nombre,
        slug: spot.slug,
        resumen: spot.resumen ?? '',
        descripcion: spot.descripcion ?? '',
        departamento_id: (spot.departamento_id ?? '') as string | number,
        provincia_id: (spot.provincia_id ?? '') as string | number,
        distrito_id: (spot.distrito_id ?? '') as string | number,
        direccion: spot.direccion ?? '',
        referencia: spot.referencia ?? '',
        latitud: spot.latitud !== null ? String(spot.latitud) : '',
        longitud: spot.longitud !== null ? String(spot.longitud) : '',
        telefono: spot.telefono ?? '',
        whatsapp: spot.whatsapp ?? '',
        website: spot.website ?? '',
        email: spot.email ?? '',
        es_gratuito: spot.es_gratuito,
        precio_entrada_desde:
            spot.precio_entrada_desde !== null
                ? String(spot.precio_entrada_desde)
                : '',
        precio_entrada_hasta:
            spot.precio_entrada_hasta !== null
                ? String(spot.precio_entrada_hasta)
                : '',
        moneda: spot.moneda || 'PEN',
        requiere_reserva: spot.requiere_reserva,
        dificultad_acceso: spot.dificultad_acceso,
        vialidad_principal: spot.vialidad_principal ?? '',
        tiempo_acceso_min:
            spot.tiempo_acceso_min !== null
                ? String(spot.tiempo_acceso_min)
                : '',
        distancia_acceso_km:
            spot.distancia_acceso_km !== null
                ? String(spot.distancia_acceso_km)
                : '',
        acceso_notas: spot.acceso_notas ?? '',
        estacionamiento: spot.estacionamiento,
        accesible_movilidad_reducida:
            spot.accesible_movilidad_reducida === true,
        mejor_epoca: spot.mejor_epoca ?? '',
        duracion_visita_min:
            spot.duracion_visita_min !== null
                ? String(spot.duracion_visita_min)
                : '',
        horario_texto: spot.horario_texto ?? '',
        tips: tipsToText(spot.tips),
        cover: null as File | null,
        remove_cover: false,
        gallery: [] as File[],
        remove_media_ids: [] as string[],
        destacado: spot.destacado,
        estado: spot.estado,
        category_ids: spot.category_ids,
        primary_category_id: spot.primary_category_id ?? '',
        access_mode_ids: spot.access_mode_ids,
        inclusion_ids: spot.inclusion_ids ?? [],
        hours: (spot.hours?.length
            ? spot.hours
            : defaultHours) as ServiceHourRow[],
    });

    const isDirtyRef = useRef(isDirty);
    const bypassLeaveGuardRef = useRef(false);
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const pendingLeaveRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        isDirtyRef.current = isDirty;
    }, [isDirty]);

    // Ctrl+R / cerrar pestaña: aviso nativo del navegador.
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

    // Navegación Inertia (sidebar, links): modal de confirmación.
    useEffect(() => {
        if (!canManage) {
            return;
        }

        return router.on('before', (event) => {
            if (!isDirtyRef.current || bypassLeaveGuardRef.current) {
                return;
            }

            const visit = event.detail.visit;
            // Permitir POST/PUT del propio guardado.
            if (visit.method !== 'get') {
                return;
            }

            // Misma ruta (cambio de ?tab=… u otros query): no es “salir”.
            try {
                const next = new URL(String(visit.url), window.location.origin);
                if (next.pathname === window.location.pathname) {
                    return;
                }
            } catch {
                // ignore URL parse errors
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

    const loadProvincias = async (departamentoId: number | string) => {
        if (!departamentoId) {
            setProvincias([]);

            return;
        }

        setLoadingGeo(true);

        try {
            const res = await fetch(
                `/mi-centro/geo/provincias?departamento_id=${departamentoId}`,
                { headers: { Accept: 'application/json' } },
            );
            const json = (await res.json()) as GeoListResponse;
            setProvincias(json.data ?? []);
        } finally {
            setLoadingGeo(false);
        }
    };

    const loadDistritos = async (provinciaId: number | string) => {
        if (!provinciaId) {
            setDistritos([]);

            return;
        }

        setLoadingGeo(true);

        try {
            const res = await fetch(
                `/mi-centro/geo/distritos?provincia_id=${provinciaId}`,
                { headers: { Accept: 'application/json' } },
            );
            const json = (await res.json()) as GeoListResponse;
            setDistritos(json.data ?? []);
        } finally {
            setLoadingGeo(false);
        }
    };

    useEffect(() => {
        void loadProvincias(spot.departamento_id).then(() =>
            loadDistritos(spot.provincia_id),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const urls = data.gallery.map((file) => URL.createObjectURL(file));
        setGalleryPreviews(urls);

        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [data.gallery]);

    const tabs = useMemo<ConfigTabItem<MiCentroTabId>[]>(
        () => [
            { id: 'identity', label: t('mi_centro.tab_identity'), icon: Info },
            { id: 'photos', label: t('mi_centro.tab_photos'), icon: Camera },
            {
                id: 'location',
                label: t('mi_centro.tab_location'),
                icon: MapPin,
            },
            { id: 'access', label: t('mi_centro.tab_access'), icon: MapPin },
            { id: 'hours', label: t('mi_centro.tab_hours'), icon: Clock },
            {
                id: 'publication',
                label: t('mi_centro.tab_publication'),
                icon: Rocket,
            },
        ],
        [t],
    );

    const handleTabChange = (tab: MiCentroTabId) => {
        setActiveTab(tab);
        syncTabToUrl(tab);
    };

    const categoryOptions = useMemo(
        () => categories.map((c) => ({ id: c.id, label: c.name })),
        [categories],
    );
    const accessOptions = useMemo(
        () => accessModes.map((m) => ({ id: m.id, label: m.name })),
        [accessModes],
    );
    const roadOptions = useMemo(
        () => roadTypes.map((m) => ({ id: m.slug, label: m.name })),
        [roadTypes],
    );
    const inclusionOptions = useMemo(
        () => inclusions.map((m) => ({ id: m.id, label: m.name })),
        [inclusions],
    );

    const visibleMedia = existingMedia.filter(
        (m) => !data.remove_media_ids.includes(m.id),
    );
    const remainingGallerySlots =
        MAX_GALLERY - visibleMedia.length - data.gallery.length;

    const createViaApi = async <T,>(
        url: string,
        name: string,
    ): Promise<T | null> => {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({ name }),
        });

        if (!res.ok) {
            return null;
        }

        const json = (await res.json()) as { data: T };

        return json.data;
    };

    const createCategory = async (name: string) => {
        const created = await createViaApi<TourCategoryOption>(
            '/mi-centro/categories',
            name,
        );

        if (!created) {
            return null;
        }

        setCategories((current) => [...current, created]);

        return { id: created.id, label: created.name };
    };

    const createAccessMode = async (name: string) => {
        const created = await createViaApi<CatalogOption>(
            '/mi-centro/access-modes',
            name,
        );

        if (!created) {
            return null;
        }

        setAccessModes((current) =>
            current.some((m) => m.id === created.id)
                ? current
                : [...current, created],
        );

        return { id: created.id, label: created.name };
    };

    const createRoadType = async (name: string) => {
        const created = await createViaApi<CatalogOption>(
            '/mi-centro/road-types',
            name,
        );

        if (!created) {
            return null;
        }

        setRoadTypes((current) =>
            current.some((m) => m.id === created.id)
                ? current
                : [...current, created],
        );

        return { id: created.slug, label: created.name };
    };

    const createInclusion = async (name: string) => {
        const created = await createViaApi<CatalogOption>(
            '/mi-centro/inclusions',
            name,
        );

        if (!created) {
            return null;
        }

        setInclusions((current) =>
            current.some((m) => m.id === created.id)
                ? current
                : [...current, created],
        );

        return { id: created.id, label: created.name };
    };

    const onCategoryIdsChange = (ids: string[]) => {
        const primary =
            ids.includes(data.primary_category_id) && data.primary_category_id
                ? data.primary_category_id
                : (ids[0] ?? '');
        setData((current) => ({
            ...current,
            category_ids: ids,
            primary_category_id: primary,
        }));
    };

    const submit = () => {
        if (!data.nombre.trim()) {
            setActiveTab('identity');
            notify.error(t('mi_centro.nombre_required'));

            return;
        }

        if (data.estado === 'publicado') {
            if (
                !data.departamento_id ||
                !data.provincia_id ||
                !data.distrito_id ||
                !data.latitud ||
                !data.longitud
            ) {
                setActiveTab('location');
                notify.error(t('tour_spots.publish_location_required'));

                return;
            }

            if (!data.resumen.trim()) {
                setActiveTab('identity');
                notify.error(t('tour_spots.publish_summary_required'));

                return;
            }

            if (data.category_ids.length < 1) {
                setActiveTab('access');
                notify.error(t('tour_spots.publish_category_required'));

                return;
            }

            if (
                data.access_mode_ids.length < 1 ||
                (!data.vialidad_principal && !data.acceso_notas.trim())
            ) {
                setActiveTab('access');
                notify.error(t('tour_spots.publish_access_required'));

                return;
            }

            const hasCover =
                Boolean(data.cover) ||
                (Boolean(existingCoverUrl) && !data.remove_cover);
            if (!hasCover) {
                setActiveTab('photos');
                notify.error(t('tour_spots.publish_cover_required'));

                return;
            }
        }

        bypassLeaveGuardRef.current = true;
        transform((payload) => payload);
        post('/mi-centro', {
            preserveScroll: true,
            forceFormData: true,
            onFinish: () => {
                bypassLeaveGuardRef.current = false;
            },
            onError: () => {
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

    const availableEstados = canPublish
        ? estados
        : estados.filter((e) => e !== 'publicado');

    const hourErrors = useMemo(() => {
        const mapped: Record<string, string> = {};
        Object.entries(errors).forEach(([key, value]) => {
            if (key.startsWith('hours.')) {
                mapped[key.replace(/^hours\./, 'service_hours.')] = value;
            }
        });

        return mapped;
    }, [errors]);

    const disabled = !canManage;

    const statusVariant =
        data.estado === 'publicado'
            ? ('green' as const)
            : data.estado === 'pausado'
              ? ('yellow' as const)
              : data.estado === 'archivado'
                ? ('gray' as const)
                : ('blue' as const);

    return (
        <>
            <Head title={t('mi_centro.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('mi_centro.title')}
                    description={t('mi_centro.description')}
                    badges={[
                        {
                            label: t('mi_centro.badge_status'),
                            value: t(
                                `tour_spots.estado_${data.estado}` as 'tour_spots.estado_borrador',
                            ),
                            color: statusVariant,
                            icon: Rocket,
                        },
                    ]}
                />

                {!canManage && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <Lock className="mt-0.5 size-4 shrink-0" />
                        <p>{t('mi_centro.readonly_hint')}</p>
                    </div>
                )}

                <ConfigTabs<MiCentroTabId>
                    tabs={tabs}
                    value={activeTab}
                    onChange={handleTabChange}
                />

                {activeTab === 'identity' && (
                    <section className="space-y-3">
                        <SectionTitle>
                            {t('tour_spots.section_identity')}
                        </SectionTitle>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                label={t('tour_spots.field_nombre')}
                                required
                                error={errors.nombre}
                            >
                                <Input
                                    value={data.nombre}
                                    onChange={(e) =>
                                        setData('nombre', e.target.value)
                                    }
                                    disabled={disabled}
                                    className="bg-card"
                                />
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_slug')}
                                error={errors.slug}
                            >
                                <Input
                                    value={data.slug}
                                    onChange={(e) =>
                                        setData('slug', e.target.value)
                                    }
                                    disabled={disabled}
                                    className="bg-card font-mono text-[13px]"
                                    placeholder="auto"
                                />
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_resumen')}
                                className="sm:col-span-2"
                                required
                                hint={t('mi_centro.required_to_publish')}
                                error={errors.resumen}
                            >
                                <Input
                                    value={data.resumen}
                                    onChange={(e) =>
                                        setData('resumen', e.target.value)
                                    }
                                    disabled={disabled}
                                    className="bg-card"
                                    maxLength={300}
                                />
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_descripcion')}
                                className="sm:col-span-2"
                                error={errors.descripcion}
                            >
                                <textarea
                                    value={data.descripcion}
                                    onChange={(e) =>
                                        setData('descripcion', e.target.value)
                                    }
                                    disabled={disabled}
                                    rows={4}
                                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm disabled:opacity-60"
                                />
                            </FormField>
                        </div>

                        <SectionTitle>
                            {t('tour_spots.section_practical')}
                        </SectionTitle>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <FormField
                                label={t('tour_spots.field_telefono')}
                                error={errors.telefono}
                            >
                                <Input
                                    value={data.telefono}
                                    onChange={(e) =>
                                        setData('telefono', e.target.value)
                                    }
                                    disabled={disabled}
                                    className="bg-card"
                                />
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_whatsapp')}
                                error={errors.whatsapp}
                            >
                                <Input
                                    value={data.whatsapp}
                                    onChange={(e) =>
                                        setData('whatsapp', e.target.value)
                                    }
                                    disabled={disabled}
                                    className="bg-card"
                                />
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_website')}
                                error={errors.website}
                            >
                                <Input
                                    value={data.website}
                                    onChange={(e) =>
                                        setData('website', e.target.value)
                                    }
                                    disabled={disabled}
                                    className="bg-card"
                                />
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_email')}
                                error={errors.email}
                            >
                                <Input
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    disabled={disabled}
                                    className="bg-card"
                                />
                            </FormField>
                        </div>
                    </section>
                )}

                {activeTab === 'photos' && (
                    <section className="space-y-3">
                        <SectionTitle>
                            {t('tour_spots.section_photos')}
                        </SectionTitle>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                label={t('tour_spots.field_cover')}
                                error={errors.cover}
                            >
                                <ImageUploadField
                                    value={data.cover}
                                    existingUrl={existingCoverUrl}
                                    removed={data.remove_cover}
                                    disabled={disabled}
                                    onFileChange={(file) => {
                                        setData('cover', file);
                                        setData('remove_cover', false);
                                    }}
                                    onRemove={() => {
                                        setData('cover', null);
                                        setData('remove_cover', true);
                                    }}
                                    layout="compact"
                                    previewAspect="video"
                                />
                            </FormField>

                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    {t('tour_spots.field_gallery')}
                                </p>
                                <p className="text-[12px] text-muted-foreground">
                                    {t('tour_spots.field_gallery_hint', {
                                        max: MAX_GALLERY,
                                    })}
                                </p>

                                <div className="grid grid-cols-3 gap-2">
                                    {visibleMedia.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group relative overflow-hidden rounded-lg border border-border"
                                        >
                                            <img
                                                src={item.url}
                                                alt=""
                                                className="aspect-square w-full object-cover"
                                            />
                                            {!disabled && (
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                    onClick={() =>
                                                        setData(
                                                            'remove_media_ids',
                                                            [
                                                                ...data.remove_media_ids,
                                                                item.id,
                                                            ],
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {galleryPreviews.map((url, index) => (
                                        <div
                                            key={`new-${index}`}
                                            className="group relative overflow-hidden rounded-lg border border-brand-blue/30"
                                        >
                                            <img
                                                src={url}
                                                alt=""
                                                className="aspect-square w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                onClick={() =>
                                                    setData(
                                                        'gallery',
                                                        data.gallery.filter(
                                                            (_, i) =>
                                                                i !== index,
                                                        ),
                                                    )
                                                }
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    ))}

                                    {!disabled && remainingGallerySlots > 0 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                galleryInputRef.current?.click()
                                            }
                                            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#d0dbef] bg-muted/20 text-muted-foreground transition-colors hover:bg-white/60"
                                        >
                                            <ImagePlus className="size-5 text-brand-orange" />
                                            <span className="text-[11px]">
                                                {t('tour_spots.add_photo')}
                                            </span>
                                        </button>
                                    )}
                                </div>

                                <input
                                    ref={galleryInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    className="sr-only"
                                    onChange={(e) => {
                                        const files = Array.from(
                                            e.target.files ?? [],
                                        );

                                        if (files.length === 0) {
                                            return;
                                        }

                                        const next = [
                                            ...data.gallery,
                                            ...files,
                                        ].slice(
                                            0,
                                            MAX_GALLERY - visibleMedia.length,
                                        );
                                        setData('gallery', next);
                                        e.target.value = '';
                                    }}
                                />
                                {errors.gallery && (
                                    <p className="text-[12px] text-destructive">
                                        {errors.gallery}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'location' && (
                    <section className="space-y-3">
                        <SectionTitle>
                            {t('tour_spots.section_location')}
                        </SectionTitle>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <FormField
                                label={t('tour_spots.field_departamento')}
                                required
                                hint={t('mi_centro.required_to_publish')}
                                error={errors.departamento_id}
                            >
                                <Select
                                    value={
                                        data.departamento_id
                                            ? String(data.departamento_id)
                                            : undefined
                                    }
                                    onValueChange={(v) => {
                                        setData('departamento_id', Number(v));
                                        setData('provincia_id', '');
                                        setData('distrito_id', '');
                                        setDistritos([]);
                                        void loadProvincias(v);
                                    }}
                                    disabled={disabled}
                                >
                                    <SelectTrigger className="w-full bg-card">
                                        <SelectValue
                                            placeholder={t(
                                                'tour_spots.select_placeholder',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departamentos.map((row) => (
                                            <SelectItem
                                                key={row.id}
                                                value={String(row.id)}
                                            >
                                                {row.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_provincia')}
                                required
                                hint={t('mi_centro.required_to_publish')}
                                error={errors.provincia_id}
                            >
                                <Select
                                    value={
                                        data.provincia_id
                                            ? String(data.provincia_id)
                                            : undefined
                                    }
                                    onValueChange={(v) => {
                                        setData('provincia_id', Number(v));
                                        setData('distrito_id', '');
                                        void loadDistritos(v);
                                    }}
                                    disabled={
                                        disabled ||
                                        !data.departamento_id ||
                                        loadingGeo
                                    }
                                >
                                    <SelectTrigger className="w-full bg-card">
                                        <SelectValue
                                            placeholder={t(
                                                'tour_spots.select_placeholder',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {provincias.map((row) => (
                                            <SelectItem
                                                key={row.id}
                                                value={String(row.id)}
                                            >
                                                {row.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_distrito')}
                                required
                                hint={t('mi_centro.required_to_publish')}
                                error={errors.distrito_id}
                            >
                                <Select
                                    value={
                                        data.distrito_id
                                            ? String(data.distrito_id)
                                            : undefined
                                    }
                                    onValueChange={(v) =>
                                        setData('distrito_id', Number(v))
                                    }
                                    disabled={
                                        disabled ||
                                        !data.provincia_id ||
                                        loadingGeo
                                    }
                                >
                                    <SelectTrigger className="w-full bg-card">
                                        <SelectValue
                                            placeholder={t(
                                                'tour_spots.select_placeholder',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {distritos.map((row) => (
                                            <SelectItem
                                                key={row.id}
                                                value={String(row.id)}
                                            >
                                                {row.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_direccion')}
                                className="sm:col-span-2"
                                error={errors.direccion}
                            >
                                <Input
                                    value={data.direccion}
                                    onChange={(e) =>
                                        setData('direccion', e.target.value)
                                    }
                                    disabled={disabled}
                                    className="bg-card"
                                />
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_referencia')}
                                error={errors.referencia}
                            >
                                <Input
                                    value={data.referencia}
                                    onChange={(e) =>
                                        setData('referencia', e.target.value)
                                    }
                                    disabled={disabled}
                                    className="bg-card"
                                />
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_map')}
                                error={errors.latitud ?? errors.longitud}
                                className="sm:col-span-3"
                            >
                                <LocationMapPicker
                                    token={mapbox_token}
                                    disabled={disabled}
                                    value={{
                                        latitud:
                                            data.latitud !== ''
                                                ? Number(data.latitud)
                                                : null,
                                        longitud:
                                            data.longitud !== ''
                                                ? Number(data.longitud)
                                                : null,
                                        direccion: data.direccion || undefined,
                                    }}
                                    onChange={(next) => {
                                        setData({
                                            ...data,
                                            latitud:
                                                next.latitud != null
                                                    ? String(next.latitud)
                                                    : '',
                                            longitud:
                                                next.longitud != null
                                                    ? String(next.longitud)
                                                    : '',
                                            direccion:
                                                next.direccion &&
                                                !data.direccion
                                                    ? String(next.direccion)
                                                    : data.direccion,
                                        });
                                    }}
                                    searchPlaceholder={t(
                                        'tour_spots.map_search_placeholder',
                                    )}
                                    hint={t('tour_spots.map_hint')}
                                />
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {data.latitud && data.longitud
                                        ? t('tour_spots.map_coords', {
                                              lat: data.latitud,
                                              lng: data.longitud,
                                          })
                                        : t('tour_spots.map_coords_empty')}
                                </p>
                            </FormField>
                        </div>
                    </section>
                )}

                {activeTab === 'access' && (
                    <section className="space-y-3">
                        <SectionTitle>
                            {t('tour_spots.section_taxonomy')}
                        </SectionTitle>
                        <FormField
                            label={t('tour_spots.field_categories')}
                            error={errors.category_ids}
                        >
                            <CreatableMultiCombobox
                                options={categoryOptions}
                                value={data.category_ids}
                                onChange={onCategoryIdsChange}
                                onCreate={createCategory}
                                disabled={disabled}
                                placeholder={t(
                                    'tour_spots.combobox_categories_ph',
                                )}
                            />
                        </FormField>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                label={t('tour_spots.field_primary_category')}
                                error={errors.primary_category_id}
                            >
                                <Select
                                    value={
                                        data.primary_category_id || undefined
                                    }
                                    onValueChange={(v) =>
                                        setData('primary_category_id', v)
                                    }
                                    disabled={
                                        disabled ||
                                        data.category_ids.length === 0
                                    }
                                >
                                    <SelectTrigger className="w-full bg-card">
                                        <SelectValue
                                            placeholder={t(
                                                'tour_spots.select_placeholder',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories
                                            .filter((c) =>
                                                data.category_ids.includes(
                                                    c.id,
                                                ),
                                            )
                                            .map((cat) => (
                                                <SelectItem
                                                    key={cat.id}
                                                    value={cat.id}
                                                >
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_vialidad')}
                                error={errors.vialidad_principal}
                            >
                                <CreatableCombobox
                                    options={roadOptions}
                                    value={data.vialidad_principal}
                                    onChange={(slug) =>
                                        setData('vialidad_principal', slug)
                                    }
                                    onCreate={createRoadType}
                                    disabled={disabled}
                                    placeholder={t(
                                        'tour_spots.combobox_road_ph',
                                    )}
                                />
                            </FormField>
                        </div>
                        <FormField
                            label={t('tour_spots.field_access_modes')}
                            error={errors.access_mode_ids}
                        >
                            <CreatableMultiCombobox
                                options={accessOptions}
                                value={data.access_mode_ids}
                                onChange={(ids) =>
                                    setData('access_mode_ids', ids)
                                }
                                onCreate={createAccessMode}
                                disabled={disabled}
                                placeholder={t('tour_spots.combobox_access_ph')}
                            />
                        </FormField>
                        <FormField
                            label={t('tour_spots.field_inclusions')}
                            error={errors.inclusion_ids}
                        >
                            <CreatableMultiCombobox
                                options={inclusionOptions}
                                value={data.inclusion_ids}
                                onChange={(ids) =>
                                    setData('inclusion_ids', ids)
                                }
                                onCreate={createInclusion}
                                disabled={disabled}
                                placeholder={t(
                                    'tour_spots.combobox_inclusion_ph',
                                )}
                            />
                        </FormField>
                        <label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                                data.accesible_movilidad_reducida
                                    ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                                    : 'border-border bg-card',
                                disabled && 'cursor-default opacity-60',
                            )}
                        >
                            <Checkbox
                                checked={data.accesible_movilidad_reducida}
                                onCheckedChange={(v) =>
                                    setData(
                                        'accesible_movilidad_reducida',
                                        v === true,
                                    )
                                }
                                disabled={disabled}
                                className="mt-0.5"
                            />
                            <span className="text-sm font-medium">
                                {t('tour_spots.field_accesible_movilidad')}
                            </span>
                        </label>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <FormField label={t('tour_spots.field_dificultad')}>
                                <Select
                                    value={data.dificultad_acceso}
                                    onValueChange={(v) =>
                                        setData('dificultad_acceso', v)
                                    }
                                    disabled={disabled}
                                >
                                    <SelectTrigger className="w-full bg-card">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dificultades.map((row) => (
                                            <SelectItem key={row} value={row}>
                                                {t(
                                                    `tour_spots.dificultad_${row}` as 'tour_spots.dificultad_facil',
                                                )}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_tiempo_acceso')}
                                error={errors.tiempo_acceso_min}
                            >
                                <Input
                                    type="number"
                                    min="0"
                                    value={data.tiempo_acceso_min}
                                    onChange={(e) =>
                                        setData(
                                            'tiempo_acceso_min',
                                            e.target.value,
                                        )
                                    }
                                    disabled={disabled}
                                    className="bg-card"
                                />
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_distancia_acceso')}
                                error={errors.distancia_acceso_km}
                            >
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={data.distancia_acceso_km}
                                    onChange={(e) =>
                                        setData(
                                            'distancia_acceso_km',
                                            e.target.value,
                                        )
                                    }
                                    disabled={disabled}
                                    className="bg-card"
                                />
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_estacionamiento')}
                            >
                                <Select
                                    value={data.estacionamiento}
                                    onValueChange={(v) =>
                                        setData('estacionamiento', v)
                                    }
                                    disabled={disabled}
                                >
                                    <SelectTrigger className="w-full bg-card">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {estacionamientos.map((row) => (
                                            <SelectItem key={row} value={row}>
                                                {t(
                                                    `tour_spots.estacionamiento_${row}` as 'tour_spots.estacionamiento_ninguno',
                                                )}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_acceso_notas')}
                                className="sm:col-span-2"
                                error={errors.acceso_notas}
                            >
                                <textarea
                                    value={data.acceso_notas}
                                    onChange={(e) =>
                                        setData('acceso_notas', e.target.value)
                                    }
                                    disabled={disabled}
                                    rows={2}
                                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm disabled:opacity-60"
                                />
                            </FormField>
                        </div>

                        <SectionTitle>
                            {t('tour_spots.section_practical')}
                        </SectionTitle>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <label
                                className={cn(
                                    'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors sm:col-span-3',
                                    data.es_gratuito
                                        ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                                        : 'border-border bg-card',
                                    disabled && 'cursor-default opacity-60',
                                )}
                            >
                                <Checkbox
                                    checked={data.es_gratuito}
                                    onCheckedChange={(v) =>
                                        setData('es_gratuito', v === true)
                                    }
                                    disabled={disabled}
                                    className="mt-0.5"
                                />
                                <span className="text-sm font-medium">
                                    {t('tour_spots.field_es_gratuito')}
                                </span>
                            </label>
                            <FormField
                                label={t('tour_spots.field_precio_desde')}
                                error={errors.precio_entrada_desde}
                            >
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.precio_entrada_desde}
                                    onChange={(e) =>
                                        setData(
                                            'precio_entrada_desde',
                                            e.target.value,
                                        )
                                    }
                                    disabled={disabled || data.es_gratuito}
                                    className="bg-card"
                                />
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_precio_hasta')}
                                error={errors.precio_entrada_hasta}
                            >
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.precio_entrada_hasta}
                                    onChange={(e) =>
                                        setData(
                                            'precio_entrada_hasta',
                                            e.target.value,
                                        )
                                    }
                                    disabled={disabled || data.es_gratuito}
                                    className="bg-card"
                                />
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_mejor_epoca')}
                                error={errors.mejor_epoca}
                            >
                                <Input
                                    value={data.mejor_epoca}
                                    onChange={(e) =>
                                        setData('mejor_epoca', e.target.value)
                                    }
                                    disabled={disabled}
                                    className="bg-card"
                                />
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_duracion')}
                                error={errors.duracion_visita_min}
                            >
                                <Input
                                    type="number"
                                    min="0"
                                    value={data.duracion_visita_min}
                                    onChange={(e) =>
                                        setData(
                                            'duracion_visita_min',
                                            e.target.value,
                                        )
                                    }
                                    disabled={disabled}
                                    className="bg-card"
                                />
                            </FormField>
                            <FormField
                                label={t('tour_spots.field_tips')}
                                className="sm:col-span-3"
                                error={errors.tips}
                            >
                                <textarea
                                    value={data.tips}
                                    onChange={(e) =>
                                        setData('tips', e.target.value)
                                    }
                                    disabled={disabled}
                                    rows={3}
                                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm disabled:opacity-60"
                                />
                            </FormField>
                        </div>
                    </section>
                )}

                {activeTab === 'hours' && (
                    <section className="space-y-3">
                        <SectionTitle>
                            {t('tour_spots.section_hours')}
                        </SectionTitle>
                        <p className="text-[12px] text-muted-foreground">
                            {t('tour_spots.section_hours_hint')}
                        </p>
                        <ServiceHoursSection
                            hours={data.hours}
                            onChange={(hours) => setData('hours', hours)}
                            disabled={disabled}
                            errors={hourErrors}
                        />
                        <FormField
                            label={t('tour_spots.field_horario')}
                            error={errors.horario_texto}
                        >
                            <Input
                                value={data.horario_texto}
                                onChange={(e) =>
                                    setData('horario_texto', e.target.value)
                                }
                                disabled={disabled}
                                className="bg-card"
                                placeholder={t('tour_spots.field_horario_hint')}
                            />
                        </FormField>
                    </section>
                )}

                {activeTab === 'publication' && (
                    <section className="space-y-3">
                        <SectionTitle>
                            {t('tour_spots.section_publish')}
                        </SectionTitle>
                        <p className="text-[12px] text-muted-foreground">
                            {canPublish
                                ? t('mi_centro.publish_hint')
                                : t('mi_centro.publish_locked_hint')}
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                label={t('tour_spots.field_estado')}
                                required
                                error={errors.estado}
                            >
                                <Select
                                    value={data.estado}
                                    onValueChange={(v) => setData('estado', v)}
                                    disabled={disabled}
                                >
                                    <SelectTrigger className="w-full bg-card">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableEstados.map((row) => (
                                            <SelectItem key={row} value={row}>
                                                {t(
                                                    `tour_spots.estado_${row}` as 'tour_spots.estado_borrador',
                                                )}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <label
                                className={cn(
                                    'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                                    data.destacado
                                        ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                                        : 'border-border bg-card',
                                    disabled && 'cursor-default opacity-60',
                                )}
                            >
                                <Checkbox
                                    checked={data.destacado}
                                    onCheckedChange={(v) =>
                                        setData('destacado', v === true)
                                    }
                                    disabled={disabled}
                                    className="mt-0.5"
                                />
                                <span className="space-y-0.5">
                                    <span className="block text-sm font-medium">
                                        {t('tour_spots.field_destacado')}
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        {t('tour_spots.field_destacado_hint')}
                                    </span>
                                </span>
                            </label>
                        </div>
                    </section>
                )}

                {canManage && (
                    <div className="flex justify-end border-t border-border pt-4">
                        <Button
                            onClick={submit}
                            disabled={processing}
                            className="gap-2"
                        >
                            <Save className="size-4" />
                            {t('mi_centro.save')}
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
                title={t('mi_centro.leave_title')}
                description={t('mi_centro.leave_description')}
                icon={AlertTriangle}
                iconClassName="bg-amber-100 text-amber-700 ring-amber-200"
                submitLabel={t('mi_centro.leave_confirm')}
                cancelLabel={t('mi_centro.leave_cancel')}
                submitVariant="destructive"
                onSubmit={confirmLeaveWithoutSaving}
                size="sm"
            >
                <p className="text-sm text-muted-foreground">
                    {t('mi_centro.leave_hint')}
                </p>
            </BaseModal>
        </>
    );
}

MiCentroIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(
                props.translations as TranslationTree,
                'mi_centro.title',
            ),
            href: '/mi-centro',
        },
    ],
});
