import { useForm } from '@inertiajs/react';
import { Store } from 'lucide-react';
import type { FormEvent } from 'react';
import { FormField } from '@/components/common/form-field';
import { StatusPill } from '@/components/common/status-pill';
import { ConfigSection } from '@/components/configuracion/config-section';
import { ConfigTabSaveFooter } from '@/components/configuracion/config-tab-save-footer';
import type { ConfigProfile } from '@/components/configuracion/types';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/use-translations';

type ProfileFormData = {
    nombre_comercial: string;
    razon_social: string;
    ruc: string;
    telefono: string;
    email_admin: string;
    direccion: string;
};

type GeneralTabProps = {
    profile: ConfigProfile;
    canManage: boolean;
};

export function GeneralTab({ profile, canManage }: GeneralTabProps) {
    const { t } = useTranslations();

    const { data, setData, put, processing, errors } = useForm<ProfileFormData>({
        nombre_comercial: profile.nombre_comercial,
        razon_social: profile.razon_social ?? '',
        ruc: profile.ruc ?? '',
        telefono: profile.telefono ?? '',
        email_admin: profile.email_admin ?? '',
        direccion: profile.direccion ?? '',
    });

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
                        onChange={(e) =>
                            setData('nombre_comercial', e.target.value)
                        }
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
                        onChange={(e) =>
                            setData('razon_social', e.target.value)
                        }
                        disabled={!canManage}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('configuracion.field_ruc')}
                    error={errors.ruc}
                >
                    <Input
                        value={data.ruc}
                        onChange={(e) => setData('ruc', e.target.value)}
                        disabled={!canManage}
                        className="bg-card font-mono"
                        maxLength={11}
                    />
                </FormField>

                <FormField
                    label={t('configuracion.field_telefono')}
                    error={errors.telefono}
                >
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
                        onChange={(e) =>
                            setData('email_admin', e.target.value)
                        }
                        disabled={!canManage}
                        className="bg-card"
                    />
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
            </ConfigSection>

            <ConfigTabSaveFooter canManage={canManage} processing={processing} />
        </form>
    );
}
