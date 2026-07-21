import { Form, Head } from '@inertiajs/react';
import { Mail, Send } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from '@/hooks/use-translations';

export default function ResendVerification({ status }: { status?: string }) {
    const { t } = useTranslations();

    return (
        <>
            <Head title={t('auth.verification_resend_title')} />

            {status && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-400">
                    {status}
                </div>
            )}

            <Form
                action="/email/verificacion/reenviar"
                method="post"
                className="flex flex-col gap-4"
            >
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
                                    required
                                    autoFocus
                                    autoComplete="email"
                                    placeholder={t('auth.email_placeholder')}
                                    className="clay-inset h-11 pl-10 [background-image:none!important]"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        <Button
                            type="submit"
                            className="group clay-cta-orange relative mt-1 h-12 w-full text-base font-semibold text-white transition-all active:scale-[0.99]"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            {t('auth.verification_resend_submit')}
                            {!processing && <Send className="size-4.5" />}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}
