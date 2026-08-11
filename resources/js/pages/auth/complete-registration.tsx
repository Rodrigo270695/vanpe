import { Form, Head } from '@inertiajs/react';
import { ArrowRight, Lock, MapPin, Store, User } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import PasswordStrengthMeter from '@/components/password-strength-meter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type Props = {
    ownerName: string;
    ownerEmail: string;
    passwordRules: string;
    rootDomain: string;
};

type TenantTipo = 'restaurant' | 'tour_spot';

export default function CompleteRegistration({
    ownerName,
    ownerEmail,
    passwordRules,
    rootDomain,
}: Props) {
    const { t } = useTranslations();
    const [password, setPassword] = useState('');
    const [tipo, setTipo] = useState<TenantTipo>('restaurant');

    const businessLabel =
        tipo === 'tour_spot'
            ? t('auth.tour_spot_name')
            : t('auth.business_name');
    const businessPlaceholder =
        tipo === 'tour_spot'
            ? t('auth.tour_spot_name_placeholder')
            : t('auth.business_name_placeholder');

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
                        <input type="hidden" name="tipo" value={tipo} />

                        <div className="grid gap-2">
                            <Label className="text-white">
                                {t('auth.account_type')}
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTipo('restaurant')}
                                    className={cn(
                                        'flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 text-center ring-1 transition',
                                        tipo === 'restaurant'
                                            ? 'bg-white text-brand-blue ring-white'
                                            : 'bg-white/10 text-white ring-white/25 hover:bg-white/15',
                                    )}
                                >
                                    <Store className="size-5" />
                                    <span className="text-xs font-bold">
                                        {t('auth.type_restaurant')}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTipo('tour_spot')}
                                    className={cn(
                                        'flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 text-center ring-1 transition',
                                        tipo === 'tour_spot'
                                            ? 'bg-white text-brand-blue ring-white'
                                            : 'bg-white/10 text-white ring-white/25 hover:bg-white/15',
                                    )}
                                >
                                    <MapPin className="size-5" />
                                    <span className="text-xs font-bold">
                                        {t('auth.type_tour_spot')}
                                    </span>
                                </button>
                            </div>
                            <InputError message={errors.tipo} />
                        </div>

                        <div className="grid gap-2">
                            <Label
                                htmlFor="nombre_comercial"
                                className="text-white"
                            >
                                {businessLabel}
                            </Label>
                            <div className="relative">
                                {tipo === 'tour_spot' ? (
                                    <MapPin className="pointer-events-none absolute top-1/2 left-3 z-10 size-4.5 -translate-y-1/2 text-brand-blue" />
                                ) : (
                                    <Store className="pointer-events-none absolute top-1/2 left-3 z-10 size-4.5 -translate-y-1/2 text-brand-blue" />
                                )}
                                <Input
                                    id="nombre_comercial"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    name="nombre_comercial"
                                    placeholder={businessPlaceholder}
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
                            <InputError
                                message={errors.password_confirmation}
                            />
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
