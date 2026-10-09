import { useForm } from '@inertiajs/react';
import { CheckCircle2, KeyRound, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/use-translations';

type OwnerInfo = {
    name: string;
    username: string | null;
    email: string;
    activo: boolean;
    verificado: boolean;
};

type OwnerResponse = {
    data: OwnerInfo | null;
    login_url: string;
};

type OwnerPasswordModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenantId: string | null;
    businessName: string;
};

export function OwnerPasswordModal({
    open,
    onOpenChange,
    tenantId,
    businessName,
}: OwnerPasswordModalProps) {
    const { t } = useTranslations();
    const [result, setResult] = useState<{
        tenantId: string;
        owner: OwnerResponse | null;
        failed: boolean;
    } | null>(null);

    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (!open || !tenantId) {
            return;
        }

        let cancelled = false;

        fetch(`/restaurantes/${tenantId}/owner`, {
            headers: { Accept: 'application/json' },
        })
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error(String(res.status));
                }

                return (await res.json()) as OwnerResponse;
            })
            .then((json) => {
                if (!cancelled) {
                    setResult({ tenantId, owner: json, failed: false });
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setResult({ tenantId, owner: null, failed: true });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [open, tenantId]);

    const current = result !== null && result.tenantId === tenantId ? result : null;
    const owner = current?.owner ?? null;
    const loadState = current === null ? 'loading' : current.failed ? 'error' : 'idle';

    const handleAfterClose = useCallback(() => {
        reset();
        clearErrors();
        setResult(null);
    }, [reset, clearErrors]);

    const submit = () => {
        if (!tenantId) {
            return;
        }

        put(`/restaurantes/${tenantId}/owner/password`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    const info = owner?.data ?? null;
    const canSubmit =
        info !== null &&
        data.password.length >= 8 &&
        data.password === data.password_confirmation;

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('tenants.owner_password_title')}
            description={t('tenants.owner_password_description', { name: businessName })}
            icon={KeyRound}
            onSubmit={submit}
            submitLabel={t('tenants.owner_password_submit')}
            canSubmit={canSubmit}
            submitting={processing}
            onAfterClose={handleAfterClose}
        >
            {loadState === 'loading' && (
                <p className="text-sm text-muted-foreground">{t('tenants.owner_loading')}</p>
            )}

            {loadState === 'error' && (
                <p className="text-sm text-destructive">{t('tenants.owner_load_failed')}</p>
            )}

            {owner && !info && (
                <p className="text-sm text-destructive">{t('tenants.support_owner_missing')}</p>
            )}

            {info && owner && (
                <>
                    <div className="grid gap-2 rounded-lg border border-border bg-card p-4 text-sm">
                        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            {t('tenants.owner_section')}
                        </span>
                        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                            <span className="text-muted-foreground">{t('tenants.owner_username')}</span>
                            <span className="font-mono break-all text-foreground">{info.username ?? '—'}</span>
                            <span className="text-muted-foreground">{t('tenants.owner_email')}</span>
                            <span className="break-all text-foreground">{info.email}</span>
                            <span className="text-muted-foreground">{t('tenants.owner_login_url')}</span>
                            <a
                                href={owner.login_url}
                                target="_blank"
                                rel="noreferrer"
                                className="break-all text-brand-blue hover:underline"
                            >
                                {owner.login_url}
                            </a>
                        </div>
                        <div className="mt-1 flex flex-col gap-1 text-xs">
                            <StatusLine ok={info.activo} label={info.activo ? t('tenants.owner_active') : t('tenants.owner_inactive')} />
                            <StatusLine
                                ok={info.verificado}
                                label={info.verificado ? t('tenants.owner_verified') : t('tenants.owner_unverified')}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">{t('tenants.owner_login_hint')}</p>
                    </div>

                    <FormField
                        label={t('tenants.field_new_password')}
                        required
                        hint={t('tenants.new_password_hint')}
                        error={errors.password}
                    >
                        <Input
                            type="password"
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="bg-card"
                        />
                    </FormField>

                    <FormField
                        label={t('tenants.field_new_password_confirm')}
                        required
                        error={errors.password_confirmation}
                    >
                        <Input
                            type="password"
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="bg-card"
                        />
                    </FormField>
                </>
            )}
        </BaseModal>
    );
}

function StatusLine({ ok, label }: { ok: boolean; label: string }) {
    const Icon = ok ? CheckCircle2 : TriangleAlert;

    return (
        <span className={ok ? 'flex items-center gap-1.5 text-emerald-600' : 'flex items-center gap-1.5 text-amber-600'}>
            <Icon className="size-3.5 shrink-0" />
            {label}
        </span>
    );
}
