import { Form, Head } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Lock, Store } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from '@/hooks/use-translations';

type Props = {
    staffName: string;
    restaurantName: string;
    loginUrl: string;
    submitUrl: string;
    alreadyDone: boolean;
    passwordRules: string;
};

export default function AcceptInvitation({
    staffName,
    restaurantName,
    loginUrl,
    submitUrl,
    alreadyDone,
    passwordRules,
}: Props) {
    const { t } = useTranslations();

    return (
        <>
            <Head title={t('auth.invite_title')} />

            {/* Restaurante que invita */}
            <div className="flex items-center gap-3 rounded-xl bg-white/12 px-4 py-3 ring-1 ring-white/20">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white text-brand-blue">
                    <Store className="size-4.5" />
                </span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                        {restaurantName}
                    </p>
                    <p className="truncate text-xs text-white/70">
                        {t('auth.invite_hello', { name: staffName })}
                    </p>
                </div>
            </div>

            {alreadyDone ? (
                <div className="flex flex-col items-center gap-4 py-2 text-center">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-green-400/20 text-green-200 ring-1 ring-green-300/30">
                        <CheckCircle2 className="size-7" />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-white">
                            {t('auth.invite_already_active')}
                        </p>
                        <p className="mt-1 text-xs text-white/70">
                            {t('auth.invite_already_active_hint')}
                        </p>
                    </div>
                    <a href={loginUrl} className="w-full">
                        <Button className="group clay-cta-orange h-12 w-full text-base font-semibold text-white transition-all active:scale-[0.99]">
                            {t('auth.invite_go_login')}
                            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </a>
                </div>
            ) : (
                <Form
                    action={submitUrl}
                    method="post"
                    resetOnSuccess={['password', 'password_confirmation']}
                    disableWhileProcessing
                    className="flex flex-col gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="password" className="text-white">
                                    {t('auth.invite_new_password')}
                                </Label>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute top-1/2 left-3 z-10 size-4.5 -translate-y-1/2 text-brand-blue" />
                                    <PasswordInput
                                        id="password"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="new-password"
                                        name="password"
                                        placeholder="••••••••"
                                        passwordrules={passwordRules}
                                        className="clay-inset h-11 pl-10"
                                    />
                                </div>
                                <p className="text-xs text-white/70">
                                    {t('auth.invite_password_hint')}
                                </p>
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="password_confirmation"
                                    className="text-white"
                                >
                                    {t('auth.password_confirm')}
                                </Label>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute top-1/2 left-3 z-10 size-4.5 -translate-y-1/2 text-brand-blue" />
                                    <PasswordInput
                                        id="password_confirmation"
                                        required
                                        tabIndex={2}
                                        autoComplete="new-password"
                                        name="password_confirmation"
                                        placeholder="••••••••"
                                        passwordrules={passwordRules}
                                        className="clay-inset h-11 pl-10"
                                    />
                                </div>
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="group clay-cta-orange relative mt-1 h-12 w-full text-base font-semibold text-white transition-all active:scale-[0.99]"
                                tabIndex={3}
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                {t('auth.invite_activate')}
                                {!processing && (
                                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                                )}
                            </Button>
                        </>
                    )}
                </Form>
            )}
        </>
    );
}
