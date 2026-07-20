import { Form, Head } from '@inertiajs/react';
import { Mail, Send } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from '@/hooks/use-translations';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    const { t } = useTranslations();

    return (
        <>
            <Head title={t('auth.forgot_title')} />

            {status && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-400">
                    {status}
                </div>
            )}

            <Form {...email.form()} className="flex flex-col gap-4">
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-white">
                                {t('auth.email')}
                            </Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute top-1/2 left-3 z-10 size-4.5 -translate-y-1/2 text-brand-blue" />
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    data-1p-ignore
                                    data-lpignore="true"
                                    data-bwignore
                                    data-form-type="other"
                                    placeholder={t('auth.email_placeholder')}
                                    className="clay-inset h-11 pl-10 [background-image:none!important]"
                                />
                                <InputError message={errors.email} />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="group clay-cta-orange relative mt-1 h-12 w-full text-base font-semibold text-white transition-all active:scale-[0.99]"
                            disabled={processing}
                            data-test="email-password-reset-link-button"
                        >
                            {processing && <Spinner />}
                            {t('auth.forgot_submit')}
                            {!processing && <Send className="size-4.5" />}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}
