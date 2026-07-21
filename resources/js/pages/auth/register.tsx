import { Form, Head } from '@inertiajs/react';
import { ArrowRight, Lock, Mail, Store, User } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import PasswordStrengthMeter from '@/components/password-strength-meter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from '@/hooks/use-translations';
import { register } from '@/routes';

type Props = {
    passwordRules: string;
    rootDomain: string;
};

export default function Register({ passwordRules, rootDomain }: Props) {
    const { t } = useTranslations();
    const [password, setPassword] = useState('');

    return (
        <>
            <Head title={t('auth.register_title')} />
            <Form
                action={register.url()}
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label
                                htmlFor="nombre_comercial"
                                className="text-white"
                            >
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
                                    placeholder={t(
                                        'auth.business_name_placeholder',
                                    )}
                                    className="clay-inset h-11 pl-10"
                                />
                            </div>
                            <InputError message={errors.nombre_comercial} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="slug" className="text-white">
                                {t('auth.slug')}
                            </Label>
                            <div className="clay-inset flex h-11 overflow-hidden rounded-xl bg-white/95">
                                <Input
                                    id="slug"
                                    type="text"
                                    tabIndex={2}
                                    name="slug"
                                    placeholder={t('auth.slug_placeholder')}
                                    className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
                                />
                                <span className="flex shrink-0 items-center border-l border-brand-blue/15 bg-brand-blue/8 px-3 text-sm font-semibold text-brand-blue">
                                    .{rootDomain}
                                </span>
                            </div>
                            <p className="text-xs text-white/70">
                                {t('auth.slug_hint')}
                            </p>
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
                                    placeholder={t('auth.name_placeholder')}
                                    className="clay-inset h-11 pl-10"
                                />
                            </div>
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-white">
                                {t('auth.email')}
                            </Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute top-1/2 left-3 z-10 size-4.5 -translate-y-1/2 text-brand-blue" />
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={4}
                                    autoComplete="email"
                                    name="email"
                                    data-1p-ignore
                                    data-lpignore="true"
                                    data-bwignore
                                    data-form-type="other"
                                    placeholder={t('auth.email_placeholder')}
                                    className="clay-inset h-11 [background-image:none!important] pl-10"
                                />
                            </div>
                            <InputError message={errors.email} />
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
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    name="password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    placeholder={t('auth.password_placeholder')}
                                    passwordrules={passwordRules}
                                    className="clay-inset h-11 pl-10"
                                />
                            </div>
                            <PasswordStrengthMeter
                                password={password}
                                passwordRules={passwordRules}
                            />
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
                                    tabIndex={6}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder={t(
                                        'auth.password_confirm_placeholder',
                                    )}
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
                            tabIndex={7}
                            disabled={processing}
                            data-test="register-user-button"
                        >
                            {processing && <Spinner />}
                            {t('auth.register_submit')}
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
