import { useForm } from '@inertiajs/react';
import { MapPinned, Store } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { FormField } from '@/components/common/form-field';
import { StatusPill } from '@/components/common/status-pill';
import { ConfigSection } from '@/components/configuracion/config-section';
import { ConfigTabSaveFooter } from '@/components/configuracion/config-tab-save-footer';
import { LocationMapPicker } from '@/components/configuracion/location-map-picker';
import type { ConfigGeoOption, ConfigProfile } from '@/components/configuracion/types';
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

type ProfileFormData = {
    nombre_comercial: string;
    razon_social: string;
    descripcion: string;
    ruc: string;
    telefono: string;
    email_admin: string;
    direccion: string;
    departamento_id: number | null;
    provincia_id: number | null;
    distrito_id: number | null;
    latitud: number | null;
    longitud: number | null;
};

type GeneralTabProps = {
    profile: ConfigProfile;
    departamentos: ConfigGeoOption[];
    mapboxToken: string | null;
    canManage: boolean;
};

type GeoListResponse = { data: ConfigGeoOption[] };

async function fetchGeo(url: string): Promise<ConfigGeoOption[]> {
    const res = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
    });
    if (!res.ok) return [];
    const json = (await res.json()) as GeoListResponse;
    return json.data ?? [];
}

export function GeneralTab({
    profile,
    departamentos,
    mapboxToken,
    canManage,
}: GeneralTabProps) {
    const { t } = useTranslations();
    const [provincias, setProvincias] = useState<ConfigGeoOption[]>([]);
    const [distritos, setDistritos] = useState<ConfigGeoOption[]>([]);
    const [loadingProvincias, setLoadingProvincias] = useState(false);
    const [loadingDistritos, setLoadingDistritos] = useState(false);

    const { data, setData, put, processing, errors } = useForm<ProfileFormData>({
        nombre_comercial: profile.nombre_comercial,
        razon_social: profile.razon_social ?? '',
        descripcion: profile.descripcion ?? '',
        ruc: profile.ruc ?? '',
        telefono: profile.telefono ?? '',
        email_admin: profile.email_admin ?? '',
        direccion: profile.direccion ?? '',
        departamento_id: profile.departamento_id,
        provincia_id: profile.provincia_id,
        distrito_id: profile.distrito_id,
        latitud: profile.latitud,
        longitud: profile.longitud,
    });

    useEffect(() => {
        if (!data.departamento_id) {
            setProvincias([]);
            return;
        }
        let cancelled = false;
        setLoadingProvincias(true);
        void fetchGeo(
            `/configuracion/geo/provincias?departamento_id=${data.departamento_id}`,
        ).then((rows) => {
            if (!cancelled) {
                setProvincias(rows);
                setLoadingProvincias(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [data.departamento_id]);

    useEffect(() => {
        if (!data.provincia_id) {
            setDistritos([]);
            return;
        }
        let cancelled = false;
        setLoadingDistritos(true);
        void fetchGeo(`/configuracion/geo/distritos?provincia_id=${data.provincia_id}`).then(
            (rows) => {
                if (!cancelled) {
                    setDistritos(rows);
                    setLoadingDistritos(false);
                }
            },
        );
        return () => {
            cancelled = true;
        };
    }, [data.provincia_id]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put('/configuracion/profile', { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-5">
            <ConfigSection
                title={t('configuracion.section_profile')}
                description={t('configuracion.section_profile_hint')}
                icon={<Store className="size-5" />}
                iconClass="bg-brand-blue/12 text-brand-blue ring-brand-blue/20"
                headerClass="bg-gradient-to-r from-brand-blue/10 via-sky-50/80 to-brand-orange/8"
            >
                <FormField
                    label={t('configuracion.field_subdomain')}
                    className="sm:col-span-2"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            value={profile.subdomain_url}
                            readOnly
                            className="bg-muted/40 font-mono text-[13px]"
                        />
                        {profile.publicado ? (
                            <StatusPill variant="green">
                                {t('configuracion.published')}
                            </StatusPill>
                        ) : (
                            <StatusPill variant="muted">
                                {t('configuracion.not_published')}
                            </StatusPill>
                        )}
                    </div>
                </FormField>

                <FormField
                    label={t('configuracion.field_nombre_comercial')}
                    required
                    error={errors.nombre_comercial}
                >
                    <Input
                        value={data.nombre_comercial}
                        onChange={(e) => setData('nombre_comercial', e.target.value)}
                        disabled={!canManage}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('configuracion.field_razon_social')}
                    error={errors.razon_social}
                >
                    <Input
                        value={data.razon_social}
                        onChange={(e) => setData('razon_social', e.target.value)}
                        disabled={!canManage}
                        className="bg-card"
                    />
                </FormField>

                <FormField label={t('configuracion.field_ruc')} error={errors.ruc}>
                    <Input
                        value={data.ruc}
                        onChange={(e) => setData('ruc', e.target.value)}
                        disabled={!canManage}
                        className="bg-card font-mono"
                        maxLength={11}
                    />
                </FormField>

                <FormField label={t('configuracion.field_telefono')} error={errors.telefono}>
                    <Input
                        value={data.telefono}
                        onChange={(e) => setData('telefono', e.target.value)}
                        disabled={!canManage}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('configuracion.field_email_admin')}
                    error={errors.email_admin}
                    className="sm:col-span-2"
                >
                    <Input
                        type="email"
                        value={data.email_admin}
                        onChange={(e) => setData('email_admin', e.target.value)}
                        disabled={!canManage}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('configuracion.field_descripcion')}
                    error={errors.descripcion}
                    className="sm:col-span-2"
                >
                    <textarea
                        value={data.descripcion}
                        onChange={(e) => setData('descripcion', e.target.value)}
                        disabled={!canManage}
                        rows={4}
                        maxLength={4000}
                        placeholder={t('configuracion.field_descripcion_placeholder')}
                        className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm disabled:opacity-60"
                    />
                </FormField>
            </ConfigSection>

            <ConfigSection
                title={t('configuracion.section_location')}
                description={t('configuracion.section_location_hint')}
                icon={<MapPinned className="size-5" />}
                iconClass="bg-brand-orange/12 text-brand-orange ring-brand-orange/20"
                headerClass="bg-gradient-to-r from-brand-orange/10 via-amber-50/70 to-brand-blue/8"
            >
                <FormField
                    label={t('configuracion.field_departamento')}
                    error={errors.departamento_id}
                >
                    <Select
                        value={data.departamento_id ? String(data.departamento_id) : undefined}
                        onValueChange={(value) => {
                            setData((prev) => ({
                                ...prev,
                                departamento_id: Number(value),
                                provincia_id: null,
                                distrito_id: null,
                            }));
                        }}
                        disabled={!canManage}
                    >
                        <SelectTrigger className="bg-card">
                            <SelectValue placeholder={t('configuracion.geo_select')} />
                        </SelectTrigger>
                        <SelectContent>
                            {departamentos.map((row) => (
                                <SelectItem key={row.id} value={String(row.id)}>
                                    {row.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField
                    label={t('configuracion.field_provincia')}
                    error={errors.provincia_id}
                >
                    <Select
                        value={data.provincia_id ? String(data.provincia_id) : undefined}
                        onValueChange={(value) => {
                            setData((prev) => ({
                                ...prev,
                                provincia_id: Number(value),
                                distrito_id: null,
                            }));
                        }}
                        disabled={!canManage || !data.departamento_id || loadingProvincias}
                    >
                        <SelectTrigger className="bg-card">
                            <SelectValue
                                placeholder={
                                    loadingProvincias
                                        ? t('configuracion.geo_loading')
                                        : t('configuracion.geo_select')
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {provincias.map((row) => (
                                <SelectItem key={row.id} value={String(row.id)}>
                                    {row.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField
                    label={t('configuracion.field_distrito')}
                    error={errors.distrito_id}
                    className="sm:col-span-2"
                >
                    <Select
                        value={data.distrito_id ? String(data.distrito_id) : undefined}
                        onValueChange={(value) => setData('distrito_id', Number(value))}
                        disabled={!canManage || !data.provincia_id || loadingDistritos}
                    >
                        <SelectTrigger className="bg-card">
                            <SelectValue
                                placeholder={
                                    loadingDistritos
                                        ? t('configuracion.geo_loading')
                                        : t('configuracion.geo_select')
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {distritos.map((row) => (
                                <SelectItem key={row.id} value={String(row.id)}>
                                    {row.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField
                    label={t('configuracion.field_direccion')}
                    error={errors.direccion}
                    className="sm:col-span-2"
                >
                    <Input
                        value={data.direccion}
                        onChange={(e) => setData('direccion', e.target.value)}
                        disabled={!canManage}
                        className="bg-card"
                    />
                </FormField>

                <LocationMapPicker
                    token={mapboxToken}
                    disabled={!canManage}
                    value={{
                        latitud: data.latitud,
                        longitud: data.longitud,
                        direccion: data.direccion,
                    }}
                    searchPlaceholder={t('configuracion.map_search_placeholder')}
                    hint={t('configuracion.map_hint')}
                    missingTokenHint={t('configuracion.map_missing_token')}
                    onChange={(next) => {
                        setData((prev) => ({
                            ...prev,
                            latitud: next.latitud,
                            longitud: next.longitud,
                            direccion:
                                next.direccion !== undefined ? next.direccion : prev.direccion,
                        }));
                    }}
                />

                {(errors.latitud || errors.longitud) && (
                    <p className="sm:col-span-2 text-sm text-destructive">
                        {errors.latitud ?? errors.longitud}
                    </p>
                )}
            </ConfigSection>

            <ConfigTabSaveFooter canManage={canManage} processing={processing} />
        </form>
    );
}
