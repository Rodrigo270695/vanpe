import { useForm } from '@inertiajs/react';
import { Store } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { TenantRow } from '@/components/tenants/types';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type TenantFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenant: TenantRow | null;
    statuses: string[];
};

export function TenantFormModal({
    open,
    onOpenChange,
    tenant,
    statuses,
}: TenantFormModalProps) {
    const { t } = useTranslations();
    const isEditing = tenant !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            nombre_comercial: '',
            razon_social: '',
            slug: '',
            ruc: '',
            email_admin: '',
            telefono: '',
            canal_adquisicion: '',
            owner_name: '',
            owner_password: '',
            owner_password_confirmation: '',
            direccion: '',
            estado: 'trial',
            suspension_reason: '',
            publicado: false,
            onboarding_completado: false,
            onboarding_paso: 0,
        });

    useEffect(() => {
        if (open && tenant) {
            setData({
                nombre_comercial: tenant.nombre_comercial,
                razon_social: tenant.razon_social,
                slug: tenant.slug,
                ruc: tenant.ruc ?? '',
                email_admin: tenant.email_admin,
                telefono: tenant.telefono ?? '',
                canal_adquisicion: tenant.canal_adquisicion ?? '',
                owner_name: '',
                owner_password: '',
                owner_password_confirmation: '',
                direccion: tenant.direccion ?? '',
                estado: tenant.estado,
                suspension_reason: tenant.suspension_reason ?? '',
                publicado: tenant.publicado,
                onboarding_completado: tenant.onboarding_completado,
                onboarding_paso: tenant.onboarding_paso,
            });
        }
        if (open && !tenant) {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, tenant]);

    const statusLabel = (status: string) =>
        t(`tenants.status_${status}` as 'tenants.status_trial');

    const canSubmit = useMemo(() => {
        if (!data.nombre_comercial.trim() || !data.email_admin.trim()) {
            return false;
        }

        if (isEditing) {
            if (!data.razon_social.trim()) return false;
            if (data.estado === 'suspended' && !data.suspension_reason.trim()) {
                return false;
            }
            return true;
        }

        if (!data.owner_name.trim()) return false;
        if (!data.owner_password || data.owner_password.length < 8) return false;
        if (data.owner_password !== data.owner_password_confirmation) {
            return false;
        }

        return true;
    }, [data, isEditing]);

    const submit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            put(`/restaurantes/${tenant.id}`, options);
        } else {
            post('/restaurantes', options);
        }
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                isEditing
                    ? t('tenants.edit_title')
                    : t('tenants.create_title')
            }
            description={
                isEditing
                    ? t('tenants.edit_hint')
                    : t('tenants.create_hint')
            }
            icon={Store}
            submitLabel={
                isEditing
                    ? t('table.save_changes')
                    : t('tenants.create_submit')
            }
            onSubmit={submit}
            canSubmit={canSubmit}
            submitting={processing}
            size="xl"
            onAfterClose={() => {
                reset();
                clearErrors();
            }}
        >
            <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                    label={t('tenants.field_nombre_comercial')}
                    required
                    error={errors.nombre_comercial}
                    className="sm:col-span-2"
                >
                    <Input
                        value={data.nombre_comercial}
                        onChange={(e) =>
                            setData('nombre_comercial', e.target.value)
                        }
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('tenants.field_razon_social')}
                    required={isEditing}
                    error={errors.razon_social}
                    className="sm:col-span-2"
                >
                    <Input
                        value={data.razon_social}
                        onChange={(e) => setData('razon_social', e.target.value)}
                        placeholder={
                            isEditing
                                ? undefined
                                : data.nombre_comercial || undefined
                        }
                        className="bg-card"
                    />
                </FormField>

                {!isEditing && (
                    <FormField
                        label={t('tenants.field_slug')}
                        error={errors.slug}
                        className="sm:col-span-2"
                    >
                        <Input
                            value={data.slug}
                            onChange={(e) =>
                                setData(
                                    'slug',
                                    e.target.value
                                        .toLowerCase()
                                        .replace(/[^a-z0-9-]/g, ''),
                                )
                            }
                            placeholder={t('tenants.slug_placeholder')}
                            className="bg-card font-mono"
                        />
                    </FormField>
                )}

                {isEditing && (
                    <FormField
                        label={t('tenants.field_slug')}
                        className="sm:col-span-2"
                    >
                        <Input
                            value={`${tenant.slug} · ${tenant.subdomain_host}`}
                            disabled
                            className="bg-muted/40 font-mono text-[13px]"
                        />
                    </FormField>
                )}

                <FormField label={t('tenants.field_ruc')} error={errors.ruc}>
                    <Input
                        value={data.ruc}
                        onChange={(e) =>
                            setData('ruc', e.target.value.replace(/\D/g, ''))
                        }
                        maxLength={11}
                        className="bg-card font-mono"
                    />
                </FormField>

                <FormField
                    label={t('tenants.field_telefono')}
                    error={errors.telefono}
                >
                    <Input
                        value={data.telefono}
                        onChange={(e) => setData('telefono', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('tenants.field_email_admin')}
                    required
                    error={errors.email_admin}
                    className="sm:col-span-2"
                >
                    <Input
                        type="email"
                        value={data.email_admin}
                        onChange={(e) => setData('email_admin', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                {!isEditing && (
                    <>
                        <FormField
                            label={t('tenants.field_owner_name')}
                            required
                            error={errors.owner_name}
                            className="sm:col-span-2"
                        >
                            <Input
                                value={data.owner_name}
                                onChange={(e) =>
                                    setData('owner_name', e.target.value)
                                }
                                className="bg-card"
                            />
                        </FormField>

                        <FormField
                            label={t('tenants.field_owner_password')}
                            required
                            error={errors.owner_password}
                        >
                            <Input
                                type="password"
                                value={data.owner_password}
                                onChange={(e) =>
                                    setData('owner_password', e.target.value)
                                }
                                className="bg-card"
                            />
                        </FormField>

                        <FormField
                            label={t('tenants.field_owner_password_confirm')}
                            required
                            error={errors.owner_password_confirmation}
                        >
                            <Input
                                type="password"
                                value={data.owner_password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        'owner_password_confirmation',
                                        e.target.value,
                                    )
                                }
                                className="bg-card"
                            />
                        </FormField>
                    </>
                )}

                {isEditing && (
                    <>
                        <FormField
                            label={t('tenants.field_direccion')}
                            error={errors.direccion}
                            className="sm:col-span-2"
                        >
                            <Input
                                value={data.direccion}
                                onChange={(e) =>
                                    setData('direccion', e.target.value)
                                }
                                className="bg-card"
                            />
                        </FormField>

                        <FormField label={t('tenants.field_estado')} required>
                            <Select
                                value={data.estado}
                                onValueChange={(v) => setData('estado', v)}
                            >
                                <SelectTrigger className="w-full bg-card">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {statusLabel(status)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField
                            label={t('tenants.field_onboarding_paso')}
                            error={errors.onboarding_paso}
                        >
                            <Input
                                type="number"
                                min={0}
                                max={5}
                                value={data.onboarding_paso}
                                onChange={(e) =>
                                    setData(
                                        'onboarding_paso',
                                        Number(e.target.value),
                                    )
                                }
                                className="bg-card"
                            />
                        </FormField>

                        {data.estado === 'suspended' && (
                            <FormField
                                label={t('tenants.field_suspension_reason')}
                                required
                                error={errors.suspension_reason}
                                className="sm:col-span-2"
                            >
                                <Input
                                    value={data.suspension_reason}
                                    onChange={(e) =>
                                        setData(
                                            'suspension_reason',
                                            e.target.value,
                                        )
                                    }
                                    className="bg-card"
                                />
                            </FormField>
                        )}

                        <label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                                data.publicado
                                    ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                                    : 'border-border bg-card',
                            )}
                        >
                            <Checkbox
                                checked={data.publicado}
                                onCheckedChange={(v) =>
                                    setData('publicado', v === true)
                                }
                                className="mt-0.5"
                            />
                            <span className="space-y-0.5">
                                <span className="block text-sm font-medium">
                                    {t('tenants.field_publicado')}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    {t('tenants.field_publicado_hint')}
                                </span>
                            </span>
                        </label>

                        <label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                                data.onboarding_completado
                                    ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                                    : 'border-border bg-card',
                            )}
                        >
                            <Checkbox
                                checked={data.onboarding_completado}
                                onCheckedChange={(v) =>
                                    setData('onboarding_completado', v === true)
                                }
                                className="mt-0.5"
                            />
                            <span className="block text-sm font-medium">
                                {t('tenants.field_onboarding_completado')}
                            </span>
                        </label>
                    </>
                )}

                <FormField
                    label={t('tenants.field_canal')}
                    error={errors.canal_adquisicion}
                    className="sm:col-span-2"
                >
                    <Input
                        value={data.canal_adquisicion}
                        onChange={(e) =>
                            setData('canal_adquisicion', e.target.value)
                        }
                        className="bg-card"
                    />
                </FormField>
            </div>
        </BaseModal>
    );
}
