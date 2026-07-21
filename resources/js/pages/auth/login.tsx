import { Form, Head, usePage } from '@inertiajs/react';
import { ArrowRight, Lock, User } from 'lucide-react';
import { useCallback, useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from '@/hooks/use-translations';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
            />
        </svg>
    );
}

export default function Login({ status, canResetPassword }: Props) {
    const { t } = useTranslations();
    const tenant = usePage().props.tenant as
        | { slug: string; name: string }
        | null;
    const isTenant = Boolean(tenant);
    const IdentifierIcon = User;
    const [googleError, setGoogleError] = useState<string | null>(null);

    const handleGoogle = useCallback(() => {
        setGoogleError(null);

        const width = 500;
        const height = 640;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
            '/auth/google/redirect?popup=1',
            'vanpe-google',
            `width=${width},height=${height},left=${left},top=${top}`,
        );

        // Popup bloqueado por el navegador: usamos el redirect clásico.
        if (!popup) {
            window.location.href = '/auth/google/redirect';
            return;
        }

        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.source !== 'vanpe-google') return;

            window.removeEventListener('message', handleMessage);

            if (event.data.status === 'success') {
                window.location.href = event.data.redirect || '/dashboard';
            } else {
                setGoogleError(
                    event.data.message || t('auth.google_failed'),
                );
            }
        };

        window.addEventListener('message', handleMessage);
    }, [t]);

    return (
        <>
            <Head title={t('auth.login_title')} />

            {status && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-400">
                    {status}
                </div>
            )}

            {googleError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                    {googleError}
                </div>
            )}

            {/* Acceso con Google (solo dominio central) */}
            {!isTenant && (
                <>
                    <button
                        type="button"
                        onClick={handleGoogle}
                        className="clay-google group inline-flex h-12 w-full cursor-pointer items-center justify-center gap-3 text-sm font-bold"
                    >
                        <span className="flex size-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-black/5">
                            <GoogleIcon className="size-5" />
                        </span>
                        {t('auth.continue_google')}
                    </button>

                    <div className="relative flex items-center gap-3">
                        <span className="h-px flex-1 bg-white/25" />
                        <span className="text-xs font-medium tracking-wide text-white/70 uppercase">
                            {t('auth.or_email')}
                        </span>
                        <span className="h-px flex-1 bg-white/25" />
                    </div>
                </>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-white">
                                {t('auth.identifier')}
                            </Label>
                            <div className="relative">
                                <IdentifierIcon className="pointer-events-none absolute top-1/2 left-3 z-10 size-4.5 -translate-y-1/2 text-brand-blue" />
                                <Input
                                    id="email"
                                    type="text"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="username"
                                    data-1p-ignore
                                    data-lpignore="true"
                                    data-bwignore
                                    data-form-type="other"
                                    placeholder={t('auth.identifier_placeholder')}
                                    className="clay-inset h-11 pl-10 [background-image:none!important]"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password" className="text-white">
                                    {t('auth.password')}
                                </Label>
                                {canResetPassword && (
                                    <TextLink
                                        href={request()}
                                        className="ml-auto text-sm font-medium text-brand-orange-light hover:text-white"
                                        tabIndex={5}
                                    >
                                        {t('auth.forgot')}
                                    </TextLink>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute top-1/2 left-3 z-10 size-4.5 -translate-y-1/2 text-brand-blue" />
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder={t('auth.password_placeholder')}
                                    className="clay-inset h-11 pl-10"
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        <Button
                            type="submit"
                            className="group clay-cta-orange relative mt-1 h-12 w-full text-base font-semibold text-white transition-all active:scale-[0.99]"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                        >
                            {processing && <Spinner />}
                            {t('auth.submit')}
                            {!processing && (
                                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                            )}
                        </Button>
                    </>
                )}
            </Form>

            {!isTenant && (
                <div className="text-center text-sm">
                    <TextLink
                        href="/email/verificacion/reenviar"
                        className="font-medium text-brand-orange-light hover:text-white"
                    >
                        {t('auth.verification_resend_link')}
                    </TextLink>
                </div>
            )}
        </>
    );
}
