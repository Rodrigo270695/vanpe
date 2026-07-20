import { Form, Head } from '@inertiajs/react';
import { ArrowRight, Lock, Store, User } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from '@/hooks/use-translations';

type Props = {
    ownerName: string;
    ownerEmail: string;
    passwordRules: string;
};

export default function CompleteRegistration({
    ownerName,
    ownerEmail,
    passwordRules,
}: Props) {
    const { t } = useTranslations();

    return (
        <>
            <Head title={t('auth.onboarding_title')} />

            {/* Cuenta de Google conectada */}
            <div className="flex items-center gap-3 rounded-xl bg-white/12 px-4 py-3 ring-1 ring-white/20">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-brand-blue">
                    {(ownerName || ownerEmail).charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                        {ownerName}
                    </p>
                    <p className="truncate text-xs text-white/70">
                        {ownerEmail}
                    </p>
                </div>
                <span className="ml-auto rounded-full bg-green-400/20 px-2 py-0.5 text-[11px] font-semibold text-green-200 ring-1 ring-green-300/30">
                    {t('auth.google_connected')}
                </span>
            </div>

            <Form
                action="/registro/completar"
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="nombre_comercial" className="text-white">
                                {t('auth.business_name')}
                            </Label>
                            <div className="relative">
                                <Store className="pointer-events-none absolute top-1/2 left-3 z-10 size-4.5 -translate-y-1/2 text-brand-blue" />
                                <Input
                                    id="nombre_comercial"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    name="nombre_comercial"
                                    placeholder={t('auth.business_name_placeholder')}
                                    className="clay-inset h-11 pl-10"
                                />
                            </div>
                            <InputError message={errors.nombre_comercial} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="slug" className="text-white">
                                {t('auth.slug')}
                            </Label>
                            <div className="relative flex items-stretch">
                                <Input
                                    id="slug"
                                    type="text"
                                    tabIndex={2}
                                    name="slug"
                                    placeholder={t('auth.slug_placeholder')}
                                    className="clay-inset h-11 rounded-r-none"
                                />
                                <span className="flex items-center rounded-r-xl bg-white/15 px-3 text-xs font-medium text-white/80">
                                    .vanpe.com.pe
                                </span>
                            </div>
                            <p className="text-xs text-white/70">{t('auth.slug_hint')}</p>
                            <InputError message={errors.slug} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-white">
                                {t('auth.owner_name')}
                            </Label>
                            <div className="relative">
                                <User className="pointer-events-none absolute top-1/2 left-3 z-10 size-4.5 -translate-y-1/2 text-brand-blue" />
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    tabIndex={3}
                                    autoComplete="name"
                                    name="name"
                                    defaultValue={ownerName}
                                    placeholder={t('auth.name_placeholder')}
                                    className="clay-inset h-11 pl-10"
                                />
                            </div>
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password" className="text-white">
                                {t('auth.password')}
                            </Label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute top-1/2 left-3 z-10 size-4.5 -translate-y-1/2 text-brand-blue" />
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder={t('auth.password_placeholder')}
                                    passwordrules={passwordRules}
                                    className="clay-inset h-11 pl-10"
                                />
                            </div>
                            <p className="text-xs text-white/70">
                                {t('auth.password_for_panel')}
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
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder={t(
                                        'auth.password_confirm_placeholder',
                                    )}
                                    passwordrules={passwordRules}
                                    className="clay-inset h-11 pl-10"
                                />
                            </div>
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <Button
                            type="submit"
                            className="group clay-cta-orange relative mt-1 h-12 w-full text-base font-semibold text-white transition-all active:scale-[0.99]"
                            tabIndex={6}
                            disabled={processing}
                            data-test="onboarding-submit-button"
                        >
                            {processing && <Spinner />}
                            {t('auth.onboarding_submit')}
                            {!processing && (
                                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                            )}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}
